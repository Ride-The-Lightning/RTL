import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, throwError, of } from 'rxjs';
import { map, takeUntil, catchError, mergeMap, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../shared/services/logger.service';
import { environment, API_URL } from '../../../environments/environment';

import { SwitchReq } from '../models/lndModels';
import { ErrorMessageComponent } from '../components/data-modal/error-message/error-message.component';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';
import * as fromLNDReducers from '../../lnd/store/lnd.reducers';
import * as LNDActions from '../../lnd/store/lnd.actions';
import { APICallStatusEnum, UI_MESSAGES } from './consts-enums-functions';

@Injectable()
export class DataService implements OnDestroy {
  private lnImplementation = 'LND';
  private childAPIUrl = API_URL;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private httpClient: HttpClient, private store: Store<fromRTLReducer.RTLState>, private logger: LoggerService, private snackBar: MatSnackBar) {}

  getChildAPIUrl() {
    return this.childAPIUrl;
  }

  getLnImplementation() {
    return this.lnImplementation;
  }

  setChildAPIUrl(lnImplementation: string) {
    this.lnImplementation = lnImplementation;    
    switch (lnImplementation) {
      case 'CLT':
        this.childAPIUrl = API_URL + '/cl';
        break;

      case 'ECL':
          this.childAPIUrl = API_URL + '/ecl';
          break;
      
      default:
        this.childAPIUrl = API_URL + '/lnd';
        break;
    }
  }

  getFiatRates() {
    return this.httpClient.get(environment.CONF_API + '/rates');
  }

  decodePayment(payment: string, fromDialog: boolean) {
    let url = this.childAPIUrl + environment.PAYREQUEST_API + '/' + payment;
    if (this.getLnImplementation() === 'ECL') {
      url = this.childAPIUrl + environment.PAYMENTS_API + '/' + payment;
    }
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.DECODE_PAYMENT));
    return this.httpClient.get(url).pipe(takeUntil(this.unSubs[0]),
    map((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.DECODE_PAYMENT));
      return res;
    }),
    catchError(err => {
      if (fromDialog) {
        this.handleErrorWithoutAlert('Decode Payment', UI_MESSAGES.DECODE_PAYMENT, err);
      } else {
        this.handleErrorWithAlert('decodePaymentData', UI_MESSAGES.DECODE_PAYMENT, 'Decode Payment Failed', this.childAPIUrl + environment.PAYREQUEST_API, err);
      }
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));
  }

  decodePayments(payments: string) {
    let url = this.childAPIUrl + environment.PAYREQUEST_API;
    let msg = UI_MESSAGES.DECODE_PAYMENTS;
    if (this.getLnImplementation() === 'ECL') {
      url = this.childAPIUrl + environment.PAYMENTS_API + '/getsentinfos';
      msg = UI_MESSAGES.GET_SENT_PAYMENTS;
    }
    this.store.dispatch(new RTLActions.OpenSpinner(msg));
    return this.httpClient.post(url, {payments: payments})
    .pipe(takeUntil(this.unSubs[1]),
    map((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner(msg));      
      return res;
    }),
    catchError(err => {
      this.handleErrorWithAlert('decodePaymentsData', msg, msg + ' Failed', url, err);
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));
  }

  getAliasesFromPubkeys(pubkey: string, multiple: boolean) {
    if (multiple) {
      let pubkey_params = new HttpParams().set('pubkeys', pubkey);
      return this.httpClient.get(this.childAPIUrl + environment.NETWORK_API + '/nodes', {params: pubkey_params});
    } else {
      return this.httpClient.get(this.childAPIUrl + environment.NETWORK_API + '/node/' + pubkey);
    }
  }

  signMessage(msg: string) {
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.SIGN_MESSAGE));    
    return this.httpClient.post(this.childAPIUrl + environment.MESSAGE_API + '/sign', {message: msg})
    .pipe(takeUntil(this.unSubs[2]),
    map((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.SIGN_MESSAGE));      
      return res;
    }),
    catchError(err => {
      this.handleErrorWithAlert('signMessageData', UI_MESSAGES.SIGN_MESSAGE, 'Sign Message Failed', this.childAPIUrl + environment.MESSAGE_API + '/sign', err);
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));
  }

  verifyMessage(msg: string, sign: string) {
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.VERIFY_MESSAGE));
    return this.httpClient.post(this.childAPIUrl + environment.MESSAGE_API + '/verify', {message: msg, signature: sign})
    .pipe(takeUntil(this.unSubs[3]),
    map((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.VERIFY_MESSAGE));      
      return res;
    }),
    catchError(err => {
      this.handleErrorWithAlert('verifyMessageData', UI_MESSAGES.VERIFY_MESSAGE, 'Verify Message Failed', this.childAPIUrl + environment.MESSAGE_API + '/verify', err);
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));    
  }

  bumpFee(txid: string, outputIndex: number, targetConf: number, satPerByte: number) {
    let bumpFeeBody: any = {txid: txid, outputIndex: outputIndex};
    if (targetConf) { bumpFeeBody.targetConf = targetConf; }
    if (satPerByte) { bumpFeeBody.satPerByte = satPerByte; }
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.BUMP_FEE));
    return this.httpClient.post(this.childAPIUrl + environment.WALLET_API + '/bumpfee', bumpFeeBody)
    .pipe(takeUntil(this.unSubs[4]),
    map((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.BUMP_FEE));
      this.snackBar.open('Successfully bumped the fee. Use the block explorer to verify transaction.');
      return res;
    }),
    catchError(err => {
      this.handleErrorWithoutAlert('Bump Fee', UI_MESSAGES.BUMP_FEE, err);
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));
  }

  labelUTXO(txid: string, label: string, overwrite: boolean = true) {
    let labelBody = {txid: txid, label: label, overwrite: overwrite};
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.LABEL_UTXO));
    return this.httpClient.post(this.childAPIUrl + environment.WALLET_API + '/label', labelBody)
    .pipe(takeUntil(this.unSubs[5]),
    map(res => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.LABEL_UTXO));
      return res;
    }, (err) => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.LABEL_UTXO));
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));
  }

  leaseUTXO(txid: string, output_index: number) {
    let leaseBody: any = {txid: txid, outputIndex: output_index};
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.LEASE_UTXO));
    return this.httpClient.post(this.childAPIUrl + environment.WALLET_API + '/lease', leaseBody)
    .pipe(takeUntil(this.unSubs[6]))
    .subscribe((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.LEASE_UTXO));
      this.store.dispatch(new LNDActions.FetchTransactions());
      this.store.dispatch(new LNDActions.FetchUTXOs());
      const expirationDate = new Date(res.expiration * 1000);
      const expiryDateInSeconds = Math.round(expirationDate.getTime()) - (expirationDate.getTimezoneOffset() * 60);
      this.snackBar.open('The UTXO has been leased till ' + new Date(expiryDateInSeconds).toString().substring(4, 21).replace(' ', '/').replace(' ', '/').toUpperCase() + '.');
    }, err => {
      this.handleErrorWithoutAlert('Lease UTXO', UI_MESSAGES.LEASE_UTXO, err);
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    });
  }

  getForwardingHistory(start: string, end: string) {
    const queryHeaders: SwitchReq = {end_time: end, start_time: start};
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_FEE_REPORT));
    return this.httpClient.post(this.childAPIUrl + environment.SWITCH_API, queryHeaders)
    .pipe(takeUntil(this.unSubs[7]),
    withLatestFrom(this.store.select('lnd')),
    mergeMap(([res, lndData]: [any, fromLNDReducers.LNDState]) => {
      if (res.forwarding_events) {
        const storedChannels = [...lndData.allChannels, ...lndData.closedChannels];
        res.forwarding_events.forEach(event => {
          if (storedChannels && storedChannels.length > 0) {
            for (let idx = 0; idx < storedChannels.length; idx++) {
              if (storedChannels[idx].chan_id.toString() === event.chan_id_in) {
                event.alias_in = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : event.chan_id_in;
                if (event.alias_out) { return; }
              }
              if (storedChannels[idx].chan_id.toString() === event.chan_id_out) {
                event.alias_out = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : event.chan_id_out;
                if (event.alias_in) { return; }
              }
              if(idx === storedChannels.length-1) {
                if (!event.alias_in) { event.alias_in = event.chan_id_in; }
                if (!event.alias_out) { event.alias_out = event.chan_id_out; }
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
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_FEE_REPORT));
      return of(res);
    }),
    catchError(err => {
      this.handleErrorWithAlert('getForwardingHistoryData', UI_MESSAGES.GET_FEE_REPORT, 'Forwarding History Failed', this.childAPIUrl + environment.SWITCH_API, err);
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401 && actionName !== 'Login') {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner(uiMessage));      
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.message && typeof err.error.error.error.error.message === 'string') ? err.error.error.error.error.message : (err.error.error && err.error.error.error && err.error.error.error.message && typeof err.error.error.error.message === 'string') ? err.error.error.error.message : (err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message : (err.error.error && typeof err.error.error === 'string') ? err.error.error : (err.error.message && typeof err.error.message === 'string') ? err.error.message : typeof err.error === 'string' ? err.error : 'Unknown Error.'}));
    }
  }

  handleErrorWithAlert(actionName: string, uiMessage: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {
    this.logger.error(err);
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner(uiMessage));
      this.store.dispatch(new RTLActions.OpenAlert({data: {
          type: 'ERROR',
          alertTitle: alertTitle,
          message: { code: err.status ? err.status : 'Unknown Error', message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.error && typeof err.error.error.error.error.error === 'string') ? err.error.error.error.error.error : (err.error.error && err.error.error.error && err.error.error.error.error && typeof err.error.error.error.error === 'string') ? err.error.error.error.error : (err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error.error && typeof err.error.error === 'string') ? err.error.error : typeof err.error === 'string' ? err.error : 'Unknown Error', URL: errURL },
          component: ErrorMessageComponent
        }
      }));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.message && typeof err.error.error.error.error.message === 'string') ? err.error.error.error.error.message : (err.error.error && err.error.error.error && err.error.error.error.message && typeof err.error.error.error.message === 'string') ? err.error.error.error.message : (err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message : (err.error.message && typeof err.error.message === 'string') ? err.error.message : typeof err.error === 'string' ? err.error : 'Unknown Error', URL: errURL}));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
