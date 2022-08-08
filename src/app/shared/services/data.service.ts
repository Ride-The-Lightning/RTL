import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TitleCasePipe } from '@angular/common';
import { Subject, throwError, of, BehaviorSubject } from 'rxjs';
import { map, takeUntil, catchError, mergeMap, withLatestFrom, first } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../shared/services/logger.service';
import { environment, API_URL } from '../../../environments/environment';
import { APICallStatusEnum, UI_MESSAGES } from './consts-enums-functions';
import { Channel, ClosedChannel, PendingChannels, SwitchReq } from '../models/lndModels';
import { ErrorMessageComponent } from '../components/data-modal/error-message/error-message.component';
import { closeAllDialogs, closeSpinner, logout, openAlert, openSnackBar, openSpinner, updateRootAPICallStatus } from '../../store/rtl.actions';
import { fetchTransactions, fetchUTXOs } from '../../lnd/store/lnd.actions';

import { RTLState } from '../../store/rtl.state';
import { allChannels } from '../../lnd/store/lnd.selector';
import { Channel as ChannelCLN } from '../models/clnModels';
import { channels } from '../../cln/store/cln.selector';
import { ApiCallStatusPayload } from '../models/apiCallsPayload';

@Injectable()
export class DataService implements OnDestroy {

  private APIUrl = API_URL;
  private lnImplementation = '';
  public lnImplementationUpdated: BehaviorSubject<string> = new BehaviorSubject(null);
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private httpClient: HttpClient, private store: Store<RTLState>, private logger: LoggerService, private snackBar: MatSnackBar, private titleCasePipe: TitleCasePipe) { }

  setLnImplementation(lnImplementation: string) {
    this.lnImplementation = lnImplementation.toLowerCase();
    this.lnImplementationUpdated.next(this.lnImplementation);
  }

  getFiatRates() {
    return this.httpClient.get(environment.CONF_API + '/rates');
  }

  decodePayment(payment: string, fromDialog: boolean) {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      let url = this.APIUrl + '/' + updatedLnImplementation + environment.PAYMENTS_API + '/decode/' + payment;
      if (updatedLnImplementation === 'cln') {
        url = this.APIUrl + '/' + updatedLnImplementation + environment.UTILITY_API + '/decode/' + payment;
      }
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.DECODE_PAYMENT }));
      return this.httpClient.get(url).pipe(
        takeUntil(this.unSubs[0]),
        map((res: any) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.DECODE_PAYMENT }));
          return res;
        }),
        catchError((err) => {
          if (fromDialog) {
            this.handleErrorWithoutAlert('Decode Payment', UI_MESSAGES.DECODE_PAYMENT, err);
          } else {
            this.handleErrorWithAlert('decodePaymentData', UI_MESSAGES.DECODE_PAYMENT, 'Decode Payment Failed', url, err);
          }
          return throwError(() => new Error(this.extractErrorMessage(err)));
        })
      );
    }));
  }

  decodePayments(payments: string) {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      let url = '';
      let msg = '';
      if (updatedLnImplementation === 'ecl') {
        url = this.APIUrl + '/' + updatedLnImplementation + environment.PAYMENTS_API + '/getsentinfos';
        msg = UI_MESSAGES.GET_SENT_PAYMENTS;
      } else if (updatedLnImplementation === 'cln') {
        url = this.APIUrl + '/' + updatedLnImplementation + environment.UTILITY_API;
        msg = UI_MESSAGES.DECODE_PAYMENTS;
      } else {
        url = this.APIUrl + '/' + updatedLnImplementation + environment.PAYMENTS_API;
        msg = UI_MESSAGES.DECODE_PAYMENTS;
      }
      this.store.dispatch(openSpinner({ payload: msg }));
      return this.httpClient.post(url, { payments: payments }).pipe(
        takeUntil(this.unSubs[1]),
        map((res: any) => {
          this.store.dispatch(closeSpinner({ payload: msg }));
          return res;
        }),
        catchError((err) => {
          this.handleErrorWithAlert('decodePaymentsData', msg, msg + ' Failed', url, err);
          return throwError(() => new Error(this.extractErrorMessage(err)));
        })
      );
    }));
  }

  getAliasesFromPubkeys(pubkey: string, multiple: boolean) {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      if (multiple) {
        const pubkey_params = new HttpParams().set('pubkeys', pubkey);
        return this.httpClient.get(this.APIUrl + '/' + updatedLnImplementation + environment.NETWORK_API + '/nodes', { params: pubkey_params });
      } else {
        return this.httpClient.get(this.APIUrl + '/' + updatedLnImplementation + environment.NETWORK_API + '/node/' + pubkey);
      }
    }));
  }

  signMessage(msg: string) {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      let url = this.APIUrl + '/' + updatedLnImplementation + environment.MESSAGE_API + '/sign';
      if (updatedLnImplementation === 'cln') {
        url = this.APIUrl + '/' + updatedLnImplementation + environment.UTILITY_API + '/sign';
      }
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.SIGN_MESSAGE }));
      return this.httpClient.post(url, { message: msg }).pipe(
        takeUntil(this.unSubs[2]),
        map((res: any) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.SIGN_MESSAGE }));
          return res;
        }),
        catchError((err) => {
          this.handleErrorWithAlert('signMessageData', UI_MESSAGES.SIGN_MESSAGE, 'Sign Message Failed', url, err);
          return throwError(() => new Error(this.extractErrorMessage(err)));
        })
      );
    }));
  }

  verifyMessage(msg: string, sign: string) {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      let url = this.APIUrl + '/' + updatedLnImplementation + environment.MESSAGE_API + '/verify';
      if (updatedLnImplementation === 'cln') {
        url = this.APIUrl + '/' + updatedLnImplementation + environment.UTILITY_API + '/verify';
      }
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.VERIFY_MESSAGE }));
      return this.httpClient.post(url, { message: msg, signature: sign }).pipe(
        takeUntil(this.unSubs[3]),
        map((res: any) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.VERIFY_MESSAGE }));
          return res;
        }),
        catchError((err) => {
          this.handleErrorWithAlert('verifyMessageData', UI_MESSAGES.VERIFY_MESSAGE, 'Verify Message Failed', url, err);
          return throwError(() => new Error(this.extractErrorMessage(err)));
        })
      );
    }));
  }

  bumpFee(txid: string, outputIndex: number, targetConf: number, satPerByte: number) {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      const bumpFeeBody: any = { txid: txid, outputIndex: outputIndex };
      if (targetConf) {
        bumpFeeBody.targetConf = targetConf;
      }
      if (satPerByte) {
        bumpFeeBody.satPerByte = satPerByte;
      }
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.BUMP_FEE }));
      return this.httpClient.post(this.APIUrl + '/' + updatedLnImplementation + environment.WALLET_API + '/bumpfee', bumpFeeBody).pipe(
        takeUntil(this.unSubs[4]),
        map((res: any) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.BUMP_FEE }));
          this.snackBar.open('Successfully bumped the fee. Use the block explorer to verify transaction.');
          return res;
        }),
        catchError((err) => {
          this.handleErrorWithoutAlert('Bump Fee', UI_MESSAGES.BUMP_FEE, err);
          return throwError(() => new Error(this.extractErrorMessage(err)));
        })
      );
    }));
  }

  labelUTXO(txid: string, label: string, overwrite: boolean = true) {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      const labelBody = { txid: txid, label: label, overwrite: overwrite };
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.LABEL_UTXO }));
      return this.httpClient.post(this.APIUrl + '/' + updatedLnImplementation + environment.WALLET_API + '/label', labelBody).pipe(
        takeUntil(this.unSubs[5]),
        map((res) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.LABEL_UTXO }));
          return res;
        }), catchError((err) => {
          this.handleErrorWithoutAlert('Lease UTXO', UI_MESSAGES.LABEL_UTXO, err);
          return throwError(() => new Error(this.extractErrorMessage(err)));
        })
      );
    }));
  }

  leaseUTXO(txid: string, output_index: number) {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      const leaseBody: any = { txid: txid, outputIndex: output_index };
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.LEASE_UTXO }));
      return this.httpClient.post(this.APIUrl + '/' + updatedLnImplementation + environment.WALLET_API + '/lease', leaseBody).pipe(
        takeUntil(this.unSubs[6]),
        map((res: any) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.LEASE_UTXO }));
          this.store.dispatch(fetchTransactions());
          this.store.dispatch(fetchUTXOs());
          const expirationDate = new Date(res.expiration * 1000);
          const expiryDateInSeconds = Math.round(expirationDate.getTime()) - (expirationDate.getTimezoneOffset() * 60);
          this.snackBar.open('The UTXO has been leased till ' + new Date(expiryDateInSeconds).toString().
            substring(4, 21).
            replace(' ', '/').
            replace(' ', '/').
            toUpperCase() + '.');
        }), catchError((err) => {
          this.handleErrorWithoutAlert('Lease UTXO', UI_MESSAGES.LEASE_UTXO, err);
          return throwError(() => new Error(this.extractErrorMessage(err)));
        })
      );
    }));
  }

  getForwardingHistory(implementation: string, start: string, end: string, status?: string) {
    if (implementation === 'LND') {
      const queryHeaders: SwitchReq = { end_time: end, start_time: start };
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_FORWARDING_HISTORY }));
      return this.httpClient.post(this.APIUrl + '/lnd' + environment.SWITCH_API, queryHeaders).pipe(
        takeUntil(this.unSubs[7]),
        withLatestFrom(this.store.select(allChannels)),
        mergeMap(([res, allChannelsSelector]: [any, { channels: Channel[], pendingChannels: PendingChannels, closedChannels: ClosedChannel[] }]) => {
          if (res.forwarding_events) {
            const storedChannels = [...allChannelsSelector.channels, ...allChannelsSelector.closedChannels];
            res.forwarding_events.forEach((event) => {
              if (storedChannels && storedChannels.length > 0) {
                for (let idx = 0; idx < storedChannels.length; idx++) {
                  if (storedChannels[idx].chan_id.toString() === event.chan_id_in) {
                    event.alias_in = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : event.chan_id_in;
                    if (event.alias_out) {
                      return;
                    }
                  }
                  if (storedChannels[idx].chan_id.toString() === event.chan_id_out) {
                    event.alias_out = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : event.chan_id_out;
                    if (event.alias_in) {
                      return;
                    }
                  }
                  if (idx === storedChannels.length - 1) {
                    if (!event.alias_in) {
                      event.alias_in = event.chan_id_in;
                    }
                    if (!event.alias_out) {
                      event.alias_out = event.chan_id_out;
                    }
                  }
                }
              } else {
                event.alias_in = event.chan_id_in;
                event.alias_out = event.chan_id_out;
              }
            });
          } else {
            res = {};
          }
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_FORWARDING_HISTORY }));
          return of(res);
        }),
        catchError((err) => {
          this.handleErrorWithAlert('getForwardingHistoryData', UI_MESSAGES.GET_FORWARDING_HISTORY, 'Forwarding History Failed', this.APIUrl + '/lnd' + environment.SWITCH_API, err);
          return throwError(() => new Error(this.extractErrorMessage(err)));
        }));
    } else if (implementation === 'CLN') {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_FORWARDING_HISTORY }));
      return this.httpClient.get(this.APIUrl + '/cln' + environment.CHANNELS_API + '/listForwards?status=' + status).pipe(
        takeUntil(this.unSubs[8]),
        withLatestFrom(this.store.select(channels)),
        mergeMap(([res, channelsSelector]: [any, { activeChannels: ChannelCLN[], pendingChannels: ChannelCLN[], inactiveChannels: ChannelCLN[], apiCallStatus: ApiCallStatusPayload }]) => {
          const forwardsWithAlias = this.mapAliases(res, [...channelsSelector.activeChannels, ...channelsSelector.pendingChannels, ...channelsSelector.inactiveChannels]);
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_FORWARDING_HISTORY }));
          return of(forwardsWithAlias);
        }),
        catchError((err) => {
          this.handleErrorWithAlert('getForwardingHistoryData', UI_MESSAGES.GET_FORWARDING_HISTORY, 'Forwarding History Failed', this.APIUrl + '/cln' + environment.CHANNELS_API + '/listForwards?status=' + status + '&start=' + start + '&end=' + end, err);
          return throwError(() => new Error(this.extractErrorMessage(err)));
        }));
    } else {
      return of({});
    }
  }

  listNetworkNodes(queryParams: string = '') {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.LIST_NETWORK_NODES }));
      return this.httpClient.get(this.APIUrl + '/' + updatedLnImplementation + environment.NETWORK_API + '/listNodes' + queryParams).pipe(
        takeUntil(this.unSubs[9]),
        mergeMap((res) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.LIST_NETWORK_NODES }));
          return of(res);
        }), catchError((err) => {
          this.handleErrorWithoutAlert('List Network Nodes', UI_MESSAGES.LIST_NETWORK_NODES, err);
          return throwError(() => this.extractErrorMessage(err));
        })
      );
    }));
  }

  listConfigs() {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_LIST_CONFIGS }));
      return this.httpClient.get(this.APIUrl + '/' + updatedLnImplementation + environment.UTILITY_API + '/listConfigs').pipe(
        takeUntil(this.unSubs[10]),
        mergeMap((res) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_LIST_CONFIGS }));
          return of(res);
        }), catchError((err) => {
          this.handleErrorWithoutAlert('List Configurations', UI_MESSAGES.GET_LIST_CONFIGS, err);
          return throwError(() => this.extractErrorMessage(err));
        })
      );
    }));
  }

  getOrUpdateFunderPolicy(policy?: any, policyMod?: any, leaseFeeBaseMsat?: any, leaseFeeBasis?: any, channelFeeMaxBaseMsat?: any, channelFeeMaxProportional?: any) {
    return this.lnImplementationUpdated.pipe(first((val) => val !== null), mergeMap((updatedLnImplementation) => {
      const postParams = policy ? { policy: policy, policy_mod: policyMod, lease_fee_base_msat: leaseFeeBaseMsat, lease_fee_basis: leaseFeeBasis, channel_fee_max_base_msat: channelFeeMaxBaseMsat, channel_fee_max_proportional_thousandths: channelFeeMaxProportional } : null;
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_FUNDER_POLICY }));
      return this.httpClient.post(this.APIUrl + '/' + updatedLnImplementation + environment.CHANNELS_API + '/funderUpdate', postParams).pipe(
        takeUntil(this.unSubs[11]),
        map((res: any) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_FUNDER_POLICY }));
          if (postParams) {
            this.store.dispatch(openSnackBar({ payload: 'Funder Policy Updated Successfully with Compact Lease: ' + res.compact_lease + '!' }));
          }
          return res;
        }), catchError((err) => {
          this.handleErrorWithoutAlert('Funder Policy', UI_MESSAGES.GET_FUNDER_POLICY, err);
          return throwError(() => new Error(this.extractErrorMessage(err)));
        })
      );
    }));
  }

  mapAliases = (payload: any, storedChannels: ChannelCLN[]) => {
    if (payload && payload.length > 0) {
      payload.forEach((fhEvent, i) => {
        if (storedChannels && storedChannels.length > 0) {
          for (let idx = 0; idx < storedChannels.length; idx++) {
            if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id === fhEvent.in_channel) {
              fhEvent.in_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : fhEvent.in_channel;
              if (fhEvent.out_channel_alias) { return; }
            }
            if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id.toString() === fhEvent.out_channel) {
              fhEvent.out_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : fhEvent.out_channel;
              if (fhEvent.in_channel_alias) { return; }
            }
            if (idx === storedChannels.length - 1) {
              if (!fhEvent.in_channel_alias) { fhEvent.in_channel_alias = fhEvent.in_channel ? fhEvent.in_channel : '-'; }
              if (!fhEvent.out_channel_alias) { fhEvent.out_channel_alias = fhEvent.out_channel ? fhEvent.out_channel : '-'; }
            }
          }
        } else {
          fhEvent.in_channel_alias = fhEvent.in_channel ? fhEvent.in_channel : '-';
          fhEvent.out_channel_alias = fhEvent.out_channel ? fhEvent.out_channel : '-';
        }
      });
    } else {
      payload = [];
    }
    return payload;
  };

  extractErrorMessage(err: any, genericErrorMessage: string = 'Unknown Error.') {
    return this.titleCasePipe.transform(
      (err.error.text && typeof err.error.text === 'string' && err.error.text.includes('<!DOCTYPE html><html lang="en">')) ? 'API Route Does Not Exist.' :
        (err.error && err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.error && typeof err.error.error.error.error.error === 'string') ? err.error.error.error.error.error :
          (err.error && err.error.error && err.error.error.error && err.error.error.error.error && typeof err.error.error.error.error === 'string') ? err.error.error.error.error :
            (err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error :
              (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error :
                (err.error && typeof err.error === 'string') ? err.error :
                  (err.error && err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.message && typeof err.error.error.error.error.message === 'string') ? err.error.error.error.error.message :
                    (err.error && err.error.error && err.error.error.error && err.error.error.error.message && typeof err.error.error.error.message === 'string') ? err.error.error.error.message :
                      (err.error && err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message :
                        (err.error && err.error.message && typeof err.error.message === 'string') ? err.error.message :
                          (err.message && typeof err.message === 'string') ? err.message : genericErrorMessage);
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, err: { status: number, error: any }) {
    if (err.error.text && typeof err.error.text === 'string' && err.error.text.includes('<!DOCTYPE html><html lang="en">')) {
      err = { status: 403, error: { message: 'API Route Does Not Exist.' } };
    }
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(closeAllDialogs());
      this.store.dispatch(logout());
      this.store.dispatch(openSnackBar({ payload: 'Authentication Failed. Redirecting to Login.' }));
    } else {
      this.store.dispatch(closeSpinner({ payload: uiMessage }));
      this.store.dispatch(updateRootAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: this.extractErrorMessage(err) } }));
    }
  }

  handleErrorWithAlert(actionName: string, uiMessage: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {
    this.logger.error(err);
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(closeAllDialogs());
      this.store.dispatch(logout());
      this.store.dispatch(openSnackBar({ payload: 'Authentication Failed. Redirecting to Login.' }));
    } else {
      this.store.dispatch(closeSpinner({ payload: uiMessage }));
      const errMsg = this.extractErrorMessage(err);
      this.store.dispatch(openAlert({
        payload: {
          data: {
            type: 'ERROR',
            alertTitle: alertTitle,
            message: { code: err.status ? err.status : 'Unknown Error', message: errMsg, URL: errURL },
            component: ErrorMessageComponent
          }
        }
      }));
      this.store.dispatch(updateRootAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: errMsg, URL: errURL } }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
