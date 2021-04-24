import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom, takeUntil } from 'rxjs/operators';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { environment, API_URL } from '../../../environments/environment';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';
import { SessionService } from '../../shared/services/session.service';
import { GetInfo, Fees, Balance, NetworkInfo, Payment, GraphNode, Transaction, SwitchReq, ListInvoices, PendingChannelsGroup, UTXO } from '../../shared/models/lndModels';
import { InvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { AlertTypeEnum, CurrencyUnitEnum, FEE_LIMIT_TYPES, PAGE_SIZE } from '../../shared/services/consts-enums-functions';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

import * as LNDActions from './lnd.actions';
import * as fromLNDReducers from '../store/lnd.reducers';

@Injectable()
export class LNDEffects implements OnDestroy {
  dialogRef: any;
  CHILD_API_URL = API_URL + '/lnd';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<fromRTLReducer.RTLState>,
    private logger: LoggerService,
    private commonService: CommonService,
    private sessionService: SessionService,
    public dialog: MatDialog,
    private router: Router,
    private location: Location) { 
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      if(rtlStore.initialAPIResponseStatus[0] === 'INCOMPLETE' && rtlStore.initialAPIResponseStatus.length > 8) { // Num of Initial APIs + 1
        rtlStore.initialAPIResponseStatus[0] = 'COMPLETE';
        this.store.dispatch(new RTLActions.CloseSpinner());
      }
    });
  }

  @Effect()
  infoFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_INFO_LND),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [LNDActions.FetchInfo, fromRTLReducer.RootState]) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchInfo'));
      return this.httpClient.get<GetInfo>(this.CHILD_API_URL + environment.GETINFO_API)
        .pipe(takeUntil(this.actions$.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
            if (info.chains && info.chains.length && info.chains[0]
              && (
                (typeof info.chains[0] === 'string' && info.chains[0].toLowerCase().indexOf('bitcoin') < 0)
                || (typeof info.chains[0] === 'object' && info.chains[0].hasOwnProperty('chain') && info.chains[0].chain.toLowerCase().indexOf('bitcoin') < 0)
              )
            ) {
              this.store.dispatch(new RTLActions.CloseAllDialogs());
              this.store.dispatch(new RTLActions.OpenAlert({ data: {
                type: AlertTypeEnum.ERROR,
                alertTitle: 'Shitcoin Found',
                titleMessage: 'Sorry Not Sorry, RTL is Bitcoin Only!'
              }}));
              return { type: RTLActions.LOGOUT };
            } else if (!info.identity_pubkey) {
              this.sessionService.removeItem('lndUnlocked');
              this.logger.info('Redirecting to Unlock');
              this.router.navigate(['/lnd/wallet']);
              return {
                type: LNDActions.SET_INFO_LND,
                payload: {}
              };
            } else {
              info.lnImplementation = 'LND';    
              this.initializeRemainingData(info, action.payload.loadPage);
              return {
                type: LNDActions.SET_INFO_LND,
                payload: info ? info : {}
              };
            }
          }),
          catchError((err) => {
            if ((typeof err.error.error === 'string' && err.error.error.includes('Not Found')) || err.status === 502) {
              this.sessionService.removeItem('lndUnlocked');
              this.logger.info('Redirecting to Unlock');
              this.router.navigate(['/lnd/wallet']);
              this.handleErrorWithoutAlert('FetchInfo', 'Fetching Node Info Failed.', err);
            } else {
              const code = (err.error && err.error.error && err.error.error.message && err.error.error.message.code) ? err.error.error.message.code : (err.error && err.error.error && err.error.error.code) ? err.error.error.code : err.status ? err.status : '';
              const message = (err.error.message ? err.error.message + ' ' : '') + ((err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.error && typeof err.error.error.error.error.error === 'string') ? err.error.error.error.error.error : (err.error.error && err.error.error.error && err.error.error.error.error && typeof err.error.error.error.error === 'string') ? err.error.error.error.error : (err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error.error && typeof err.error.error === 'string') ? err.error.error : typeof err.error === 'string' ? err.error : 'Unknown Error');
              this.router.navigate(['/error'], { state: { errorCode: code, errorMessage: message }});
              this.handleErrorWithoutAlert('FetchInfo', 'Fetching Node Info Failed.', err);
            }
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  peersFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_PEERS_LND),
    mergeMap((action: LNDActions.FetchPeers) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchPeers'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PEERS_API)
        .pipe(
          map((peers: any) => {
            this.logger.info(peers);
            return {
              type: LNDActions.SET_PEERS_LND,
              payload: peers ? peers : []
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchPeers', 'Fetching Peers Failed.', err);
            return of({type: RTLActions.VOID});
          })
        );
      }
    ));

  @Effect()
  saveNewPeer = this.actions$.pipe(
    ofType(LNDActions.SAVE_NEW_PEER_LND),
    withLatestFrom(this.store.select('lnd')),
    mergeMap(([action, lndData]: [LNDActions.SaveNewPeer, fromLNDReducers.LNDState]) => {
      this.store.dispatch(new LNDActions.ClearEffectError('SaveNewPeer'));
      return this.httpClient.post(this.CHILD_API_URL + environment.PEERS_API, { pubkey: action.payload.pubkey, host: action.payload.host, perm: action.payload.perm })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new LNDActions.SetPeers((postRes && postRes.length > 0) ? postRes : []));
            return {
              type: LNDActions.NEWLY_ADDED_PEER_LND,
              payload: {peer: postRes[0]}
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewPeer', 'Peer Connection Failed.', err);
            return of({type: RTLActions.VOID});
          })
        );
      }
    ));

  @Effect()
  detachPeer = this.actions$.pipe(
    ofType(LNDActions.DETACH_PEER_LND),
    mergeMap((action: LNDActions.DetachPeer) => {
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.pubkey)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Peer Disconnected Successfully.'));
            return {
              type: LNDActions.REMOVE_PEER_LND,
              payload: { pubkey: action.payload.pubkey }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('ERROR', 'Unable to Detach Peer. Try again later.', this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.pubkey, err);
            return of({type: RTLActions.VOID});
          })
        );
      }
    ));

  @Effect()
  saveNewInvoice = this.actions$.pipe(
    ofType(LNDActions.SAVE_NEW_INVOICE_LND),
    mergeMap((action: LNDActions.SaveNewInvoice) => {
      this.store.dispatch(new LNDActions.ClearEffectError('SaveNewInvoice'));
      return this.httpClient.post(this.CHILD_API_URL + environment.INVOICES_API, {
        memo: action.payload.memo, amount: action.payload.invoiceValue, private: action.payload.private, expiry: action.payload.expiry
      })
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new LNDActions.FetchInvoices({ num_max_invoices: action.payload.pageSize, reversed: true }));
          if (action.payload.openModal) {
            postRes.memo = action.payload.memo;
            postRes.value = action.payload.invoiceValue;
            postRes.expiry = action.payload.expiry;
            postRes.cltv_expiry = '144';
            postRes.private = action.payload.private;
            postRes.creation_date = Math.round(new Date().getTime() / 1000).toString();
            postRes.creation_date_str = this.commonService.convertTimestampToDate(+postRes.creation_date);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.OPEN_ALERT,
              payload: { data: {
                invoice: postRes,
                newlyAdded: true,
                component: InvoiceInformationComponent
              }}
            }
          } else {
            return {
              type: LNDActions.NEWLY_SAVED_INVOICE_LND,
              payload: { paymentRequest: postRes.payment_request }
            }
          }
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('SaveNewInvoice', 'Add Invoice Failed.', err);
          return of({type: RTLActions.VOID});
        })
      );
    }
  ));

  @Effect()
  openNewChannel = this.actions$.pipe(
    ofType(LNDActions.SAVE_NEW_CHANNEL_LND),
    mergeMap((action: LNDActions.SaveNewChannel) => {
      this.store.dispatch(new LNDActions.ClearEffectError('SaveNewChannel'));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, {
        node_pubkey: action.payload.selectedPeerPubkey, local_funding_amount: action.payload.fundingAmount, private: action.payload.private,
        trans_type: action.payload.transType, trans_type_value: action.payload.transTypeValue, spend_unconfirmed: action.payload.spendUnconfirmed
      })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new LNDActions.FetchBalance('blockchain'));
            this.store.dispatch(new LNDActions.FetchAllChannels());
            this.store.dispatch(new LNDActions.BackupChannels({ channelPoint: 'ALL', showMessage: 'Channel Added Successfully!' }));
            return {
              type: LNDActions.FETCH_PENDING_CHANNELS_LND
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewChannel', 'Opening Channel Failed.', err);
            return of({type: RTLActions.VOID});
          })
        );
      }
  ));

  @Effect()
  updateChannel = this.actions$.pipe(
    ofType(LNDActions.UPDATE_CHANNELS_LND),
    mergeMap((action: LNDActions.UpdateChannels) => {
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/chanPolicy',
        { baseFeeMsat: action.payload.baseFeeMsat, feeRate: action.payload.feeRate, timeLockDelta: action.payload.timeLockDelta, chanPoint: action.payload.chanPoint })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            if(action.payload.chanPoint === 'all') {
              this.store.dispatch(new RTLActions.OpenSnackBar('All Channels Updated Successfully.'));
            } else {
              this.store.dispatch(new RTLActions.OpenSnackBar('Channel Updated Successfully!'));
            }
            return {
              type: LNDActions.FETCH_ALL_CHANNELS_LND
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('ERROR', 'Update Channel Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/chanPolicy', err);
            return of({type: RTLActions.VOID});
          })
        );
      }
  ));

  @Effect()
  closeChannel = this.actions$.pipe(
    ofType(LNDActions.CLOSE_CHANNEL_LND),
    mergeMap((action: LNDActions.CloseChannel) => {
      let reqUrl = this.CHILD_API_URL + environment.CHANNELS_API + '/' + action.payload.channelPoint + '?force=' + action.payload.forcibly;
      if(action.payload.targetConf) { reqUrl = reqUrl + '&target_conf=' + action.payload.targetConf; }
      if(action.payload.satPerByte) { reqUrl = reqUrl + '&sat_per_byte=' + action.payload.satPerByte; }
      return this.httpClient.delete(reqUrl)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new LNDActions.FetchBalance('channels'));
            this.store.dispatch(new LNDActions.FetchBalance('blockchain'));
            this.store.dispatch(new LNDActions.FetchAllChannels());
            if (action.payload.forcibly) {
              this.store.dispatch(new LNDActions.FetchPendingChannels());
            } else {
              this.store.dispatch(new LNDActions.FetchClosedChannels());
            }
            this.store.dispatch(new LNDActions.BackupChannels({ channelPoint: 'ALL', showMessage: 'Channel Closed Successfully!' }));
            return {
              type: LNDActions.REMOVE_CHANNEL_LND,
              payload: { channelPoint: action.payload.channelPoint }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('ERROR', 'Unable to Close Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_API + '/' + action.payload.channelPoint + '?force=' + action.payload.forcibly, err);
            return of({type: RTLActions.VOID});
          })
        );
      }
  ));

  @Effect()
  backupChannels = this.actions$.pipe(
    ofType(LNDActions.BACKUP_CHANNELS_LND),
    mergeMap((action: LNDActions.BackupChannels) => {
      this.store.dispatch(new LNDActions.ClearEffectError('BackupChannels'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/' + action.payload.channelPoint)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar(action.payload.showMessage + ' ' + postRes.message));
            return {
              type: LNDActions.BACKUP_CHANNELS_RES_LND,
              payload: postRes.message
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new LNDActions.EffectError({ action: 'BackupChannels', code: err.status, message: err.error.error }));
            this.handleErrorWithAlert('ERROR', action.payload.showMessage + ' ' + 'Unable to Backup Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/' + action.payload.channelPoint, err);
            return of({type: RTLActions.VOID});
          })
        );
      }
  ));

  @Effect()
  verifyChannels = this.actions$.pipe(
    ofType(LNDActions.VERIFY_CHANNELS_LND),
    mergeMap((action: LNDActions.VerifyChannels) => {
      this.store.dispatch(new LNDActions.ClearEffectError('VerifyChannels'));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/verify/' + action.payload.channelPoint, {})
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar(postRes.message));
            return {
              type: LNDActions.VERIFY_CHANNELS_RES_LND,
              payload: postRes.message
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new LNDActions.EffectError({ action: 'VerifyChannels', code: err.status, message: err.error.error }));
            this.handleErrorWithAlert('ERROR', 'Unable to Verify Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/verify/' + action.payload.channelPoint, err);
            return of({type: RTLActions.VOID});
          })
        );
      }
    ));

    @Effect()
    restoreChannels = this.actions$.pipe(
      ofType(LNDActions.RESTORE_CHANNELS_LND),
      mergeMap((action: LNDActions.RestoreChannels) => {
        this.store.dispatch(new LNDActions.ClearEffectError('RestoreChannels'));
        return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/restore/' + action.payload.channelPoint, {})
          .pipe(
            map((postRes: any) => {
              this.logger.info(postRes);
              this.store.dispatch(new RTLActions.CloseSpinner());
              this.store.dispatch(new RTLActions.OpenSnackBar(postRes.message));
              this.store.dispatch(new LNDActions.SetRestoreChannelsList(postRes.list));
              return {
                type: LNDActions.RESTORE_CHANNELS_RES_LND,
                payload: postRes.message
              };
            }),
            catchError((err: any) => {
              this.store.dispatch(new LNDActions.EffectError({ action: 'RestoreChannels', code: err.status, message: err.error.error }));
              this.handleErrorWithAlert('ERROR', 'Unable to Restore Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/restore/' + action.payload.channelPoint, err);
              return of({type: RTLActions.VOID});
          })
        );
      }
  ));
  
  @Effect()
  fetchFees = this.actions$.pipe(
    ofType(LNDActions.FETCH_FEES_LND),
    mergeMap((action: LNDActions.FetchFees) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchFees'));
      return this.httpClient.get<Fees>(this.CHILD_API_URL + environment.FEES_API);
    }),
    map((fees) => {
      this.logger.info(fees);
      if(fees.forwarding_events_history) {
        this.store.dispatch(new LNDActions.SetForwardingHistory(fees.forwarding_events_history));
        delete fees.forwarding_events_history;
      }
      return {
        type: LNDActions.SET_FEES_LND,
        payload: fees ? fees : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchFees', 'Fetching Fees Failed.', err);
      return of({type: RTLActions.VOID});
    })
  );

  @Effect()
  balanceFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_BALANCE_LND),
    mergeMap((action: LNDActions.FetchBalance) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchBalance/' + action.payload));
      return this.httpClient.get<Balance>(this.CHILD_API_URL + environment.BALANCE_API + '/' + action.payload)
        .pipe(
          map((res: any) => {
            if (action.payload === 'channels') {
              this.store.dispatch(new LNDActions.FetchBalance('blockchain'));
            }
            this.logger.info(res);
            const emptyRes = (action.payload === 'channels') ? { balance: '', btc_balance: '' } : { total_balance: '', btc_total_balance: '' };
            return {
              type: LNDActions.SET_BALANCE_LND,
              payload: res ? { target: action.payload, balance: res } : { target: action.payload, balance: emptyRes }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchBalance/' + action.payload, 'Fetching' + this.commonService.titleCase(action.payload) + ' Balance Failed.', err);
            return of({type: RTLActions.VOID});
          }
      ));
    }
  ));

  @Effect()
  networkInfoFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_NETWORK_LND),
    mergeMap((action: LNDActions.FetchNetwork) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchNetwork'));
      return this.httpClient.get<NetworkInfo>(this.CHILD_API_URL + environment.NETWORK_API + '/info');
    }),
    map((networkInfo) => {
      this.logger.info(networkInfo);
      return {
        type: LNDActions.SET_NETWORK_LND,
        payload: networkInfo ? networkInfo : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchNetwork', 'Fetching Network Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  channelsAllFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_ALL_CHANNELS_LND),
    mergeMap((action: LNDActions.FetchAllChannels) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchChannels/all'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API)
        .pipe(
          map((channels: any) => {
            this.logger.info(channels);
            return {
              type: LNDActions.SET_ALL_CHANNELS_LND,
              payload: (channels && channels.channels && channels.channels.length > 0) ? channels.channels : []
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchChannels/all', 'Fetching All Channels Failed.', err);
            return of({type: RTLActions.VOID});
          })
      );
    }
  ));

  @Effect()
  channelsPendingFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_PENDING_CHANNELS_LND),
    mergeMap((action: LNDActions.FetchPendingChannels) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchChannels/pending'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/pending')
        .pipe(
          map((channels: any) => {
            this.logger.info(channels);
            let pendingChannels: PendingChannelsGroup = { open: {num_channels: 0, limbo_balance: 0}, closing: {num_channels: 0, limbo_balance: 0}, force_closing: {num_channels: 0, limbo_balance: 0}, waiting_close: {num_channels: 0, limbo_balance: 0}, total_channels: 0, total_limbo_balance: 0};
            if (channels) {
              pendingChannels.total_limbo_balance = channels.total_limbo_balance;
              if (channels.pending_closing_channels) {
                pendingChannels.closing.num_channels = channels.pending_closing_channels.length;
                pendingChannels.total_channels = pendingChannels.total_channels + channels.pending_closing_channels.length;
                channels.pending_closing_channels.forEach(closingChannel => {
                  pendingChannels.closing.limbo_balance = +pendingChannels.closing.limbo_balance + (closingChannel.channel.local_balance ? +closingChannel.channel.local_balance : 0);
                });
              }
              if (channels.pending_force_closing_channels) {
                pendingChannels.force_closing.num_channels = channels.pending_force_closing_channels.length;
                pendingChannels.total_channels = pendingChannels.total_channels + channels.pending_force_closing_channels.length;
                channels.pending_force_closing_channels.forEach(closingChannel => {
                  pendingChannels.force_closing.limbo_balance = +pendingChannels.force_closing.limbo_balance + (closingChannel.channel.local_balance ? +closingChannel.channel.local_balance : 0);
                });
              }
              if (channels.pending_open_channels) {
                pendingChannels.open.num_channels = channels.pending_open_channels.length;
                pendingChannels.total_channels = pendingChannels.total_channels + channels.pending_open_channels.length;
                channels.pending_open_channels.forEach(openingChannel => {
                  pendingChannels.open.limbo_balance = +pendingChannels.open.limbo_balance + (openingChannel.channel.local_balance ? +openingChannel.channel.local_balance : 0);
                });
              }
              if (channels.waiting_close_channels) {
                pendingChannels.waiting_close.num_channels = channels.waiting_close_channels.length;
                pendingChannels.total_channels = pendingChannels.total_channels + channels.waiting_close_channels.length;
                channels.waiting_close_channels.forEach(closingChannel => {
                  pendingChannels.waiting_close.limbo_balance = +pendingChannels.waiting_close.limbo_balance + (closingChannel.channel.local_balance ? +closingChannel.channel.local_balance : 0);
                });
              }
            }
            return {
              type: LNDActions.SET_PENDING_CHANNELS_LND,
              payload: channels ? { channels: channels, pendingChannels: pendingChannels } : {channels: {}, pendingChannels: pendingChannels}
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchChannels/pending', 'Fetching Pending Channels Failed.', err);
            return of({type: RTLActions.VOID});
          })
      );
    }
  ));

  @Effect()
  channelsClosedFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_CLOSED_CHANNELS_LND),
    mergeMap((action: LNDActions.FetchClosedChannels) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchChannels/closed'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/closed')
        .pipe(
          map((channels: any) => {
            this.logger.info(channels);
            return {
              type: LNDActions.SET_CLOSED_CHANNELS_LND,
              payload: (channels && channels.channels && channels.channels.length > 0) ? channels.channels : []
            };
          },
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchChannels/closed', 'Fetching Closed Channels Failed.', err);
            return of({type: RTLActions.VOID});
          })
      ));
    }
  ));

  @Effect()
  invoicesFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_INVOICES_LND),
    mergeMap((action: LNDActions.FetchInvoices) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchInvoices'));
      const num_max_invoices = (action.payload.num_max_invoices) ? action.payload.num_max_invoices : 100;
      const index_offset = (action.payload.index_offset) ? action.payload.index_offset : 0;
      const reversed = (action.payload.reversed) ? action.payload.reversed : false;
      return this.httpClient.get<ListInvoices>(this.CHILD_API_URL + environment.INVOICES_API + '?num_max_invoices=' + num_max_invoices + '&index_offset=' + index_offset + '&reversed=' + reversed)
        .pipe(map((res: ListInvoices) => {
          this.logger.info(res);
          if (action.payload.reversed && !action.payload.index_offset) {
            this.store.dispatch(new LNDActions.SetTotalInvoices(+res.last_index_offset));
          }
          return {
            type: LNDActions.SET_INVOICES_LND,
            payload: res
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchInvoices', 'Fetching Invoices Failed.', err);
          return of({type: RTLActions.VOID});
        }
    ));
  }));

  @Effect()
  transactionsFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_TRANSACTIONS_LND),
    mergeMap((action: LNDActions.FetchTransactions) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchTransactions'));
      return this.httpClient.get<Transaction[]>(this.CHILD_API_URL + environment.TRANSACTIONS_API);
    }),
    map((transactions) => {
      this.logger.info(transactions);
      return {
        type: LNDActions.SET_TRANSACTIONS_LND,
        payload: (transactions && transactions.length > 0) ? transactions : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchTransactions', 'Fetching Transactions Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  utxosFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_UTXOS_LND),
    withLatestFrom(this.store.select('lnd')),
    mergeMap(([action, lndData]: [LNDActions.FetchUTXOs, fromLNDReducers.LNDState]) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchUTXOs'));
      return this.httpClient.get<UTXO[]>(this.CHILD_API_URL + environment.WALLET_API + '/getUTXOs?max_confs=' + (lndData.information && lndData.information.block_height ? lndData.information.block_height : 1000000000));
    }),
    map((utxos) => {
      this.logger.info(utxos);
      return {
        type: LNDActions.SET_UTXOS_LND,
        payload: (utxos && utxos.length > 0) ? utxos : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchUTXOs', 'Fetching UTXOs Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  paymentsFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_PAYMENTS_LND),
    mergeMap((action: LNDActions.FetchPayments) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchPayments'));
      return this.httpClient.get<Payment[]>(this.CHILD_API_URL + environment.PAYMENTS_API);
    }),
    map((payments) => {
      this.logger.info(payments);
      return {
        type: LNDActions.SET_PAYMENTS_LND,
        payload: payments ? payments : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchPayments', 'Fetching Payments Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  sendPayment = this.actions$.pipe(
    ofType(LNDActions.SEND_PAYMENT_LND),
    mergeMap((action: LNDActions.SendPayment) => {
      this.store.dispatch(new LNDActions.ClearEffectError('SendPayment'));
      let queryHeaders = {};
      queryHeaders['paymentReq'] = action.payload.paymentReq;
      if (action.payload.paymentAmount) { queryHeaders['paymentAmount'] = action.payload.paymentAmount; }
      if (action.payload.outgoingChannel) { queryHeaders['outgoingChannel'] = action.payload.outgoingChannel.chan_id; }
      if (action.payload.allowSelfPayment) { queryHeaders['allowSelfPayment'] = action.payload.allowSelfPayment; } // Channel Rebalancing
      if (action.payload.lastHopPubkey) { queryHeaders['lastHopPubkey'] = action.payload.lastHopPubkey; }
      if(action.payload.feeLimitType && action.payload.feeLimitType !== FEE_LIMIT_TYPES[0]) {
        queryHeaders['feeLimit'] = {};
        queryHeaders['feeLimit'][action.payload.feeLimitType.id] = action.payload.feeLimit;
      }
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/transactions', queryHeaders)
        .pipe(
          map((sendRes: any) => {
            this.logger.info(sendRes);
            if (sendRes.payment_error) {
              if (action.payload.allowSelfPayment) { 
                this.store.dispatch(new LNDActions.FetchInvoices({ num_max_invoices: PAGE_SIZE, reversed: true }));
                return {
                  type: LNDActions.SEND_PAYMENT_STATUS_LND,
                  payload: sendRes
                };
              } else {
                this.logger.error('Error: ' + sendRes.payment_error);
                const myErr = {status: sendRes.payment_error.status, error: sendRes.payment_error.error && sendRes.payment_error.error.error && typeof(sendRes.payment_error.error.error) === 'object' ? sendRes.payment_error.error.error : {error: sendRes.payment_error.error && sendRes.payment_error.error.error ? sendRes.payment_error.error.error : 'Unknown Error'}};
                if (action.payload.fromDialog) {
                  this.handleErrorWithoutAlert('SendPayment', 'Send Payment Failed.', myErr);
                } else {
                  this.handleErrorWithAlert('ERROR', 'Send Payment Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/transactions', myErr);
                }
                return of({type: RTLActions.VOID});
              }
            } else {
              this.store.dispatch(new LNDActions.FetchAllChannels());
              this.store.dispatch(new LNDActions.FetchBalance('channels'));
              this.store.dispatch(new LNDActions.FetchPayments());
              if (action.payload.allowSelfPayment) { 
                this.store.dispatch(new LNDActions.FetchInvoices({ num_max_invoices: PAGE_SIZE, reversed: true }));
              } else {
                this.store.dispatch(new RTLActions.CloseSpinner());
                let msg = 'Payment Sent Successfully.';
                if(sendRes.payment_route && sendRes.payment_route.total_fees_msat) {
                  msg = 'Payment sent successfully with the total fee ' + sendRes.payment_route.total_fees_msat + ' (mSats).';
                }
                this.store.dispatch(new RTLActions.OpenSnackBar(msg));
              }
              return {
                type: LNDActions.SEND_PAYMENT_STATUS_LND,
                payload: sendRes
              };
            }
          }),
          catchError((err: any) => {
            if (action.payload.allowSelfPayment) { 
              this.store.dispatch(new LNDActions.FetchInvoices({ num_max_invoices: PAGE_SIZE, reversed: true }));
              return of({
                type: LNDActions.SEND_PAYMENT_STATUS_LND,
                payload: err
              });
            } else {
              this.logger.error('Error: ' + JSON.stringify(err));
              const myErr = {status: err.status, error: err.error && err.error.error && typeof(err.error.error) === 'object' ? err.error.error : {error: err.error && err.error.error ? err.error.error : 'Unknown Error'}};
              if (action.payload.fromDialog) {
                this.handleErrorWithoutAlert('SendPayment', 'Send Payment Failed.', myErr);
              } else {
                this.handleErrorWithAlert('ERROR', 'Send Payment Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/transactions', myErr);
              }
              return of({type: RTLActions.VOID});
            }
          })
        );
    })
  );

  @Effect()
  graphNodeFetch = this.actions$.pipe(
    ofType(LNDActions.FETCH_GRAPH_NODE_LND),
    mergeMap((action: LNDActions.FetchGraphNode) => {
      this.store.dispatch(new LNDActions.ClearEffectError('FetchGraphNode'));
      return this.httpClient.get<GraphNode>(this.CHILD_API_URL + environment.NETWORK_API + '/node/' + action.payload.pubkey)
        .pipe(map((graphNode: any) => {
          this.logger.info(graphNode);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: LNDActions.SET_GRAPH_NODE_LND,
            payload: graphNode && graphNode.node ? {node: graphNode.node} : {node: null}
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchGraphNode', 'Fetching Graph Node Failed.', err);
          return of({type: RTLActions.VOID});
        }));
      }
  ));

  @Effect({ dispatch: false })
  setGraphNode = this.actions$.pipe(
    ofType(LNDActions.SET_GRAPH_NODE_LND),
    map((action: LNDActions.SetGraphNode) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  getNewAddress = this.actions$.pipe(
    ofType(LNDActions.GET_NEW_ADDRESS_LND),
    mergeMap((action: LNDActions.GetNewAddress) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.NEW_ADDRESS_API + '?type=' + action.payload.addressId)
        .pipe(map((newAddress: any) => {
          this.logger.info(newAddress);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: LNDActions.SET_NEW_ADDRESS_LND,
            payload: (newAddress && newAddress.address) ? newAddress.address : {}
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('ERROR', 'Generate New Address Failed', this.CHILD_API_URL + environment.NEW_ADDRESS_API + '?type=' + action.payload.addressId, err);
          return of({type: RTLActions.VOID});
        }));
    })
  );

  @Effect({ dispatch: false })
  setNewAddress = this.actions$.pipe(
    ofType(LNDActions.SET_NEW_ADDRESS_LND),
    map((action: LNDActions.SetNewAddress) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  SetChannelTransaction = this.actions$.pipe(
    ofType(LNDActions.SET_CHANNEL_TRANSACTION_LND),
    mergeMap((action: LNDActions.SetChannelTransaction) => {
      this.store.dispatch(new LNDActions.ClearEffectError('SetChannelTransaction'));
      return this.httpClient.post(this.CHILD_API_URL + environment.TRANSACTIONS_API,
        { amount: action.payload.amount, address: action.payload.address, sendAll: action.payload.sendAll, fees: action.payload.fees, blocks: action.payload.blocks }
      )
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new LNDActions.FetchTransactions());            
            this.store.dispatch(new LNDActions.FetchBalance('blockchain'));
            return {
              type: LNDActions.SET_CHANNEL_TRANSACTION_RES_LND,
              payload: postRes
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SetChannelTransaction', 'Sending Fund Failed.', err);
            return of({type: RTLActions.VOID});
          }));
      })
  );

  @Effect()
  fetchForwardingHistory = this.actions$.pipe(
    ofType(LNDActions.GET_FORWARDING_HISTORY_LND),
    mergeMap((action: LNDActions.GetForwardingHistory) => {
      this.store.dispatch(new LNDActions.ClearEffectError('GetForwardingHistory'));
      const queryHeaders: SwitchReq = {
        num_max_events: action.payload.num_max_events, index_offset: action.payload.index_offset, end_time: action.payload.end_time, start_time: action.payload.start_time
      };
      return this.httpClient.post(this.CHILD_API_URL + environment.SWITCH_API, queryHeaders)
        .pipe(
          map((fhRes: any) => {
            this.logger.info(fhRes);
            return {
              type: LNDActions.SET_FORWARDING_HISTORY_LND,
              payload: fhRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new LNDActions.EffectError({ action: 'GetForwardingHistory', code: err.status, message: err.error.error }));
            this.handleErrorWithAlert('ERROR', 'Get Forwarding History Failed', this.CHILD_API_URL + environment.SWITCH_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  queryRoutesFetch = this.actions$.pipe(
    ofType(LNDActions.GET_QUERY_ROUTES_LND),
    mergeMap((action: LNDActions.GetQueryRoutes) => {
      let url = this.CHILD_API_URL + environment.NETWORK_API + '/routes/' + action.payload.destPubkey + '/' + action.payload.amount;
      if (action.payload.outgoingChanId) { url = url + '?outgoing_chan_id=' + action.payload.outgoingChanId; }
      return this.httpClient.get(url)
        .pipe(
          map((qrRes: any) => {
            this.logger.info(qrRes);
            return {
              type: LNDActions.SET_QUERY_ROUTES_LND,
              payload: qrRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new LNDActions.SetQueryRoutes({}));
            this.handleErrorWithAlert('ERROR', 'Get Query Routes Failed', this.CHILD_API_URL + environment.NETWORK_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect({ dispatch: false })
  setQueryRoutes = this.actions$.pipe(
    ofType(LNDActions.SET_QUERY_ROUTES_LND),
    map((action: LNDActions.SetQueryRoutes) => {
      return action.payload;
    })
  );

  @Effect()
  genSeed = this.actions$.pipe(
    ofType(LNDActions.GEN_SEED_LND),
    mergeMap((action: LNDActions.GenSeed) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.WALLET_API + '/genseed/' + action.payload)
        .pipe(
          map((postRes: any) => {
            this.logger.info('Generated GenSeed!');
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: LNDActions.GEN_SEED_RESPONSE_LND,
              payload: postRes.cipher_seed_mnemonic
            };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('ERROR', 'Genseed Generation Failed', this.CHILD_API_URL + environment.WALLET_API + '/genseed/' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
      }
  ));

  @Effect()
  updateSelNodeOptions = this.actions$.pipe(
    ofType(RTLActions.UPDATE_SELECTED_NODE_OPTIONS),
    mergeMap((action: RTLActions.UpdateSelectedNodeOptions) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.WALLET_API + '/updateSelNodeOptions')
        .pipe(
          map((postRes: any) => {
            this.logger.info('Update Sel Node Successfull');
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.VOID
            };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('ERROR', 'Update macaroon for newly initialized node failed! Please check the macaroon path and restart the server!', 'Update Macaroon', err);
            return of({type: RTLActions.VOID});
          })
        );
      }
  ));

  @Effect({ dispatch: false })
  genSeedResponse = this.actions$.pipe(
    ofType(LNDActions.GEN_SEED_RESPONSE_LND),
    map((action: LNDActions.GenSeedResponse) => {
      return action.payload;
    })
  );

  @Effect({ dispatch: false })
  initWalletRes = this.actions$.pipe(
    ofType(LNDActions.INIT_WALLET_RESPONSE_LND),
    map((action: LNDActions.InitWalletResponse) => {
      return action.payload;
    })
  );

  @Effect()
  initWallet = this.actions$.pipe(
    ofType(LNDActions.INIT_WALLET_LND),
    mergeMap((action: LNDActions.InitWallet) => {
      return this.httpClient.post(this.CHILD_API_URL + environment.WALLET_API + '/wallet/initwallet',
        {
          wallet_password: action.payload.pwd,
          cipher_seed_mnemonic: action.payload.cipher ? action.payload.cipher : '',
          aezeed_passphrase: action.payload.passphrase ? action.payload.passphrase : ''
        })
        .pipe(
          map((postRes) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: LNDActions.INIT_WALLET_RESPONSE_LND,
              payload: postRes
            };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('ERROR', 'Wallet Initialization Failed', this.CHILD_API_URL + environment.WALLET_API + '/initwallet', err);
            return of({type: RTLActions.VOID});
          })
        );
      }
  ));

  @Effect({ dispatch: false })
  unlockWallet = this.actions$.pipe(
    ofType(LNDActions.UNLOCK_WALLET_LND),
    mergeMap((action: LNDActions.UnlockWallet) => {
      return this.httpClient.post(this.CHILD_API_URL + environment.WALLET_API + '/wallet/unlockwallet', { wallet_password: action.payload.pwd })
        .pipe(
          map((postRes) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSpinner('Initializing Node...'));
            this.logger.info('Successfully Unlocked!');
            this.sessionService.setItem('lndUnlocked', 'true');
            setTimeout(() => {
              this.store.dispatch(new RTLActions.CloseSpinner());
              this.logger.info('Successfully Initialized!');
              this.store.dispatch(new LNDActions.FetchInfo({loadPage: 'HOME'}));
            }, 1000 * 5);
            return { type: RTLActions.VOID };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('ERROR', 'Unlock Wallet Failed', this.CHILD_API_URL + environment.WALLET_API + '/unlockwallet', err);
            return of({ type: RTLActions.VOID });
          })
        );
    }
    ));

  @Effect()
  peerLookup = this.actions$.pipe(
    ofType(LNDActions.PEER_LOOKUP_LND),
    mergeMap((action: LNDActions.PeerLookup) => {
      this.store.dispatch(new LNDActions.ClearEffectError('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/node/' + action.payload)
        .pipe(
          map((resPeer) => {
            this.logger.info(resPeer);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: LNDActions.SET_LOOKUP_LND,
              payload: resPeer
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new LNDActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Peer Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/node/' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  channelLookup = this.actions$.pipe(
    ofType(LNDActions.CHANNEL_LOOKUP_LND),
    mergeMap((action: LNDActions.ChannelLookup) => {
      this.store.dispatch(new LNDActions.ClearEffectError('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/edge/' + action.payload)
        .pipe(
          map((resChannel) => {
            this.logger.info(resChannel);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: LNDActions.SET_LOOKUP_LND,
              payload: resChannel
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new LNDActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Channel Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/edge/' + action.payload, err);
            this.store.dispatch(new LNDActions.SetLookup({}));
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  invoiceLookup = this.actions$.pipe(
    ofType(LNDActions.INVOICE_LOOKUP_LND),
    mergeMap((action: LNDActions.InvoiceLookup) => {
      this.store.dispatch(new LNDActions.ClearEffectError('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.INVOICES_API + '/' + action.payload)
        .pipe(
          map((resInvoice) => {
            this.logger.info(resInvoice);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: LNDActions.SET_LOOKUP_LND,
              payload: resInvoice
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new LNDActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Invoice Lookup Failed', this.CHILD_API_URL + environment.INVOICES_API + '/' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setLookup = this.actions$.pipe(
    ofType(LNDActions.SET_LOOKUP_LND),
    map((action: LNDActions.SetLookup) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );


  @Effect()
  getRestoreChannelList = this.actions$.pipe(
    ofType(LNDActions.RESTORE_CHANNELS_LIST_LND),
    mergeMap((action: LNDActions.RestoreChannelsList) => {
      this.store.dispatch(new LNDActions.ClearEffectError('RestoreChannelsList'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/restore/list')
        .pipe(
          map((resRestoreList) => {
            this.logger.info(resRestoreList);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: LNDActions.SET_RESTORE_CHANNELS_LIST_LND,
              payload: (resRestoreList) ? resRestoreList : {all_restore_exists: false, files: []}
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new LNDActions.EffectError({ action: 'RestoreChannelsList', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Restore Channels List Failed', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setRestoreChannelList = this.actions$.pipe(
    ofType(LNDActions.SET_RESTORE_CHANNELS_LIST_LND),
    map((action: LNDActions.SetRestoreChannelsList) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  initializeRemainingData(info: any, landingPage: string) {
    this.sessionService.setItem('lndUnlocked', 'true');
    const node_data = {
      identity_pubkey: info.identity_pubkey,
      alias: info.alias,
      testnet: info.testnet,
      chains: info.chains,
      uris: info.uris,
      version: (!info.version) ? '' : info.version.split(' ')[0],
      currency_unit: CurrencyUnitEnum.BTC,
      smaller_currency_unit: CurrencyUnitEnum.SATS
    };
    this.store.dispatch(new RTLActions.OpenSpinner('Initializing Node Data...'));
    this.store.dispatch(new RTLActions.SetNodeData(node_data));
    this.store.dispatch(new LNDActions.FetchPeers());
    this.store.dispatch(new LNDActions.FetchBalance('channels'));
    this.store.dispatch(new LNDActions.FetchNetwork());
    this.store.dispatch(new LNDActions.FetchAllChannels());
    this.store.dispatch(new LNDActions.FetchPendingChannels());
    this.store.dispatch(new LNDActions.FetchClosedChannels());
    this.store.dispatch(new LNDActions.FetchInvoices({num_max_invoices: 10, reversed: true}));
    this.store.dispatch(new LNDActions.FetchPayments());
    this.store.dispatch(new LNDActions.FetchFees()); //Fetches monthly forwarding history as well, to count total number of events
    let newRoute = this.location.path();
    if(newRoute.includes('/cl/')) {
      newRoute = newRoute.replace('/cl/', '/lnd/');
    } else if (newRoute.includes('/ecl/')) {
      newRoute = newRoute.replace('/ecl/', '/lnd/');
    }
    if(newRoute.includes('/unlock') || newRoute.includes('/login') || newRoute.includes('/error') || newRoute === '' || landingPage === 'HOME' || newRoute.includes('?access-key=')) {
      newRoute = '/lnd/home';
    }
    this.router.navigate([newRoute]);
  }

  handleErrorWithoutAlert(actionName: string, genericErrorMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new LNDActions.EffectError({ action: actionName, code: err.status.toString(), message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.error && typeof err.error.error.error.error.error === 'string') ? err.error.error.error.error.error : (err.error.error && err.error.error.error && err.error.error.error.error && typeof err.error.error.error.error === 'string') ? err.error.error.error.error : (err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error.error && typeof err.error.error === 'string') ? err.error.error : typeof err.error === 'string' ? err.error : genericErrorMessage}));
    }
  }

  handleErrorWithAlert(alertType: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {
    this.logger.error(err);
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.OpenAlert({
        data: {
          type: alertType,
          alertTitle: alertTitle,
          message: { code: err.status, message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.error && typeof err.error.error.error.error.error === 'string') ? err.error.error.error.error.error : (err.error.error && err.error.error.error && err.error.error.error.error && typeof err.error.error.error.error === 'string') ? err.error.error.error.error : (err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error.error && typeof err.error.error === 'string') ? err.error.error : typeof err.error === 'string' ? err.error : 'Unknown Error', URL: errURL },
          component: ErrorMessageComponent
        }
      }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
