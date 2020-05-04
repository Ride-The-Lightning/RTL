import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom, takeUntil } from 'rxjs/operators';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material';

import { environment, API_URL } from '../../../environments/environment';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';
import { SessionService } from '../../shared/services/session.service';
import { GetInfo, GetInfoChain, Fees, Balance, NetworkInfo, Payment, GraphNode, Transaction, SwitchReq, ListInvoices, PendingChannelsGroup } from '../../shared/models/lndModels';
import { InvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { CurrencyUnitEnum, FEE_LIMIT_TYPES, PAGE_SIZE } from '../../shared/services/consts-enums-functions';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';
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
    private location: Location) { }

  @Effect()
  infoFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_INFO),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [RTLActions.FetchInfo, fromRTLReducer.RootState]) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchInfo'));
      return this.httpClient.get<GetInfo>(this.CHILD_API_URL + environment.GETINFO_API)
        .pipe(
          takeUntil(this.actions$.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
            if (!info.identity_pubkey) {
              this.sessionService.removeItem('lndUnlocked');
              this.logger.info('Redirecting to Unlock');
              this.router.navigate(['/lnd/wallet']);
              return {
                type: RTLActions.SET_INFO,
                payload: {}
              };
            } else {
              info.lnImplementation = 'LND';    
              this.initializeRemainingData(info, action.payload.loadPage);
              return {
                type: RTLActions.SET_INFO,
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
    ofType(RTLActions.FETCH_PEERS),
    mergeMap((action: RTLActions.FetchPeers) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchPeers'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PEERS_API)
        .pipe(
          map((peers: any) => {
            this.logger.info(peers);
            return {
              type: RTLActions.SET_PEERS,
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
    ofType(RTLActions.SAVE_NEW_PEER),
    withLatestFrom(this.store.select('lnd')),
    mergeMap(([action, lndData]: [RTLActions.SaveNewPeer, fromLNDReducers.LNDState]) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('SaveNewPeer'));
      return this.httpClient.post(this.CHILD_API_URL + environment.PEERS_API, { pubkey: action.payload.pubkey, host: action.payload.host, perm: action.payload.perm })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.SetPeers((postRes && postRes.length > 0) ? postRes : []));
            return {
              type: RTLActions.NEWLY_ADDED_PEER,
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
    ofType(RTLActions.DETACH_PEER),
    mergeMap((action: RTLActions.DetachPeer) => {
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.pubkey)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Peer Disconnected Successfully.'));
            return {
              type: RTLActions.REMOVE_PEER,
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
    ofType(RTLActions.SAVE_NEW_INVOICE),
    mergeMap((action: RTLActions.SaveNewInvoice) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('SaveNewInvoice'));
      return this.httpClient.post(this.CHILD_API_URL + environment.INVOICES_API, {
        memo: action.payload.memo, amount: action.payload.invoiceValue, private: action.payload.private, expiry: action.payload.expiry
      })
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.FetchInvoices({ num_max_invoices: action.payload.pageSize, reversed: true }));
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
              type: RTLActions.NEWLY_SAVED_INVOICE,
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
    ofType(RTLActions.SAVE_NEW_CHANNEL),
    mergeMap((action: RTLActions.SaveNewChannel) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('SaveNewChannel'));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, {
        node_pubkey: action.payload.selectedPeerPubkey, local_funding_amount: action.payload.fundingAmount, private: action.payload.private,
        trans_type: action.payload.transType, trans_type_value: action.payload.transTypeValue, spend_unconfirmed: action.payload.spendUnconfirmed
      })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.FetchBalance('blockchain'));
            this.store.dispatch(new RTLActions.FetchAllChannels());
            this.store.dispatch(new RTLActions.BackupChannels({ channelPoint: 'ALL', showMessage: 'Channel Added Successfully!' }));
            return {
              type: RTLActions.FETCH_PENDING_CHANNELS
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
    ofType(RTLActions.UPDATE_CHANNELS),
    mergeMap((action: RTLActions.UpdateChannels) => {
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
              type: RTLActions.FETCH_ALL_CHANNELS
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
    ofType(RTLActions.CLOSE_CHANNEL),
    mergeMap((action: RTLActions.CloseChannel) => {
      let reqUrl = this.CHILD_API_URL + environment.CHANNELS_API + '/' + action.payload.channelPoint + '?force=' + action.payload.forcibly;
      if(action.payload.targetConf) { reqUrl = reqUrl + '&target_conf=' + action.payload.targetConf; }
      if(action.payload.satPerByte) { reqUrl = reqUrl + '&sat_per_byte=' + action.payload.satPerByte; }
      return this.httpClient.delete(reqUrl)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.FetchBalance('channels'));
            this.store.dispatch(new RTLActions.FetchBalance('blockchain'));
            this.store.dispatch(new RTLActions.FetchAllChannels());
            if (action.payload.forcibly) {
              this.store.dispatch(new RTLActions.FetchPendingChannels());
            } else {
              this.store.dispatch(new RTLActions.FetchClosedChannels());
            }
            this.store.dispatch(new RTLActions.BackupChannels({ channelPoint: 'ALL', showMessage: 'Channel Closed Successfully!' }));
            return {
              type: RTLActions.REMOVE_CHANNEL,
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
    ofType(RTLActions.BACKUP_CHANNELS),
    mergeMap((action: RTLActions.BackupChannels) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('BackupChannels'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/' + action.payload.channelPoint)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar(action.payload.showMessage + ' ' + postRes.message));
            return {
              type: RTLActions.BACKUP_CHANNELS_RES,
              payload: postRes.message
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorLnd({ action: 'BackupChannels', code: err.status, message: err.error.error }));
            this.handleErrorWithAlert('ERROR', action.payload.showMessage + ' ' + 'Unable to Backup Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/' + action.payload.channelPoint, err);
            return of({type: RTLActions.VOID});
          })
        );
      }
  ));

  @Effect()
  verifyChannels = this.actions$.pipe(
    ofType(RTLActions.VERIFY_CHANNELS),
    mergeMap((action: RTLActions.VerifyChannels) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('VerifyChannels'));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/verify/' + action.payload.channelPoint, {})
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar(postRes.message));
            return {
              type: RTLActions.VERIFY_CHANNELS_RES,
              payload: postRes.message
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorLnd({ action: 'VerifyChannels', code: err.status, message: err.error.error }));
            this.handleErrorWithAlert('ERROR', 'Unable to Verify Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/verify/' + action.payload.channelPoint, err);
            return of({type: RTLActions.VOID});
          })
        );
      }
    ));

    @Effect()
    restoreChannels = this.actions$.pipe(
      ofType(RTLActions.RESTORE_CHANNELS),
      mergeMap((action: RTLActions.RestoreChannels) => {
        this.store.dispatch(new RTLActions.ClearEffectErrorLnd('RestoreChannels'));
        return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/restore/' + action.payload.channelPoint, {})
          .pipe(
            map((postRes: any) => {
              this.logger.info(postRes);
              this.store.dispatch(new RTLActions.CloseSpinner());
              this.store.dispatch(new RTLActions.OpenSnackBar(postRes.message));
              this.store.dispatch(new RTLActions.SetRestoreChannelsList(postRes.list));
              return {
                type: RTLActions.RESTORE_CHANNELS_RES,
                payload: postRes.message
              };
            }),
            catchError((err: any) => {
              this.store.dispatch(new RTLActions.EffectErrorLnd({ action: 'RestoreChannels', code: err.status, message: err.error.error }));
              this.handleErrorWithAlert('ERROR', 'Unable to Restore Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/restore/' + action.payload.channelPoint, err);
              return of({type: RTLActions.VOID});
          })
        );
      }
  ));
  
  @Effect()
  fetchFees = this.actions$.pipe(
    ofType(RTLActions.FETCH_FEES),
    mergeMap((action: RTLActions.FetchFees) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchFees'));
      return this.httpClient.get<Fees>(this.CHILD_API_URL + environment.FEES_API);
    }),
    map((fees) => {
      this.logger.info(fees);
      if(fees.forwarding_events_history) {
        this.store.dispatch(new RTLActions.SetForwardingHistory(fees.forwarding_events_history));
        delete fees.forwarding_events_history;
      }
      return {
        type: RTLActions.SET_FEES,
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
    ofType(RTLActions.FETCH_BALANCE),
    mergeMap((action: RTLActions.FetchBalance) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchBalance/' + action.payload));
      return this.httpClient.get<Balance>(this.CHILD_API_URL + environment.BALANCE_API + '/' + action.payload)
        .pipe(
          map((res: any) => {
            if (action.payload === 'channels') {
              this.store.dispatch(new RTLActions.FetchBalance('blockchain'));
            }
            this.logger.info(res);
            const emptyRes = (action.payload === 'channels') ? { balance: '', btc_balance: '' } : { total_balance: '', btc_total_balance: '' };
            return {
              type: RTLActions.SET_BALANCE,
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
    ofType(RTLActions.FETCH_NETWORK),
    mergeMap((action: RTLActions.FetchNetwork) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchNetwork'));
      return this.httpClient.get<NetworkInfo>(this.CHILD_API_URL + environment.NETWORK_API + '/info');
    }),
    map((networkInfo) => {
      this.logger.info(networkInfo);
      return {
        type: RTLActions.SET_NETWORK,
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
    ofType(RTLActions.FETCH_ALL_CHANNELS),
    mergeMap((action: RTLActions.FetchAllChannels) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchChannels/all'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API)
        .pipe(
          map((channels: any) => {
            this.logger.info(channels);
            return {
              type: RTLActions.SET_ALL_CHANNELS,
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
    ofType(RTLActions.FETCH_PENDING_CHANNELS),
    mergeMap((action: RTLActions.FetchPendingChannels) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchChannels/pending'));
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
              type: RTLActions.SET_PENDING_CHANNELS,
              payload: channels ? { channels: channels, pendingChannels: pendingChannels } : {channels: {}, pendingChannels: pendingChannels}
            };
          },
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchChannels/pending', 'Fetching Pending Channels Failed.', err);
            return of({type: RTLActions.VOID});
          })
      ));
    }
  ));

  @Effect()
  channelsClosedFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_CLOSED_CHANNELS),
    mergeMap((action: RTLActions.FetchClosedChannels) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchChannels/closed'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/closed')
        .pipe(
          map((channels: any) => {
            this.logger.info(channels);
            return {
              type: RTLActions.SET_CLOSED_CHANNELS,
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
    ofType(RTLActions.FETCH_INVOICES),
    mergeMap((action: RTLActions.FetchInvoices) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchInvoices'));
      const num_max_invoices = (action.payload.num_max_invoices) ? action.payload.num_max_invoices : 100;
      const index_offset = (action.payload.index_offset) ? action.payload.index_offset : 0;
      const reversed = (action.payload.reversed) ? action.payload.reversed : false;
      return this.httpClient.get<ListInvoices>(this.CHILD_API_URL + environment.INVOICES_API + '?num_max_invoices=' + num_max_invoices + '&index_offset=' + index_offset + '&reversed=' + reversed)
        .pipe(map((res: ListInvoices) => {
          this.logger.info(res);
          if (action.payload.reversed && !action.payload.index_offset) {
            this.store.dispatch(new RTLActions.SetTotalInvoices(+res.last_index_offset));
          }
          return {
            type: RTLActions.SET_INVOICES,
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
    ofType(RTLActions.FETCH_TRANSACTIONS),
    mergeMap((action: RTLActions.FetchTransactions) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchTransactions'));
      return this.httpClient.get<Transaction[]>(this.CHILD_API_URL + environment.TRANSACTIONS_API);
    }),
    map((transactions) => {
      this.logger.info(transactions);
      return {
        type: RTLActions.SET_TRANSACTIONS,
        payload: (transactions && transactions.length > 0) ? transactions : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchTransactions', 'Fetching Transactions Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  paymentsFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_PAYMENTS),
    mergeMap((action: RTLActions.FetchPayments) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchPayments'));
      return this.httpClient.get<Payment[]>(this.CHILD_API_URL + environment.PAYMENTS_API);
    }),
    map((payments) => {
      this.logger.info(payments);
      return {
        type: RTLActions.SET_PAYMENTS,
        payload: payments ? payments : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchPayments', 'Fetching Payments Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  decodePayment = this.actions$.pipe(
    ofType(RTLActions.DECODE_PAYMENT),
    mergeMap((action: RTLActions.DecodePayment) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('DecodePayment'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PAYREQUEST_API + '/' + action.payload.routeParam)
        .pipe(
          map((decodedPayment) => {
            this.logger.info(decodedPayment);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.SET_DECODED_PAYMENT,
              payload: decodedPayment ? decodedPayment : {}
            };
          }),
          catchError((err: any) => {
            if (action.payload.fromDialog) {
              this.handleErrorWithoutAlert('DecodePayment', 'Decode Payment Failed.', err);
            } else {
              this.handleErrorWithAlert('ERROR', 'Decode Payment Failed', this.CHILD_API_URL + environment.PAYREQUEST_API + '/' + action.payload.routeParam, err);
            }
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setDecodedPayment = this.actions$.pipe(
    ofType(RTLActions.SET_DECODED_PAYMENT),
    map((action: RTLActions.SetDecodedPayment) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  sendPayment = this.actions$.pipe(
    ofType(RTLActions.SEND_PAYMENT),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [RTLActions.SendPayment, any]) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('SendPayment'));
      let queryHeaders = {};
      if (action.payload.outgoingChannel) { queryHeaders['outgoingChannel'] = action.payload.outgoingChannel.chan_id; }
      if (action.payload.allowSelfPayment) { queryHeaders['allowSelfPayment'] = action.payload.allowSelfPayment; } // Channel Rebalancing
      if (action.payload.lastHopPubkey) { queryHeaders['lastHopPubkey'] = action.payload.lastHopPubkey; }
      if(action.payload.feeLimitType && action.payload.feeLimitType !== FEE_LIMIT_TYPES[0]) {
        queryHeaders['feeLimit'] = {};
        queryHeaders['feeLimit'][action.payload.feeLimitType.id] = action.payload.feeLimit;
      }
      if (action.payload.zeroAmtInvoice) {
        queryHeaders['paymentDecoded'] = action.payload.paymentDecoded;
      } else {
        queryHeaders['paymentReq'] = action.payload.paymentReq;
      }
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/transactions', queryHeaders)
        .pipe(
          map((sendRes: any) => {
            this.logger.info(sendRes);
            if (sendRes.payment_error) {
              if (action.payload.allowSelfPayment) { 
                this.store.dispatch(new RTLActions.FetchInvoices({ num_max_invoices: PAGE_SIZE, reversed: true }));
                return {
                  type: RTLActions.SEND_PAYMENT_STATUS,
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
              this.store.dispatch(new RTLActions.SetDecodedPayment({}));
              this.store.dispatch(new RTLActions.FetchAllChannels());
              this.store.dispatch(new RTLActions.FetchBalance('channels'));
              this.store.dispatch(new RTLActions.FetchPayments());
              if (action.payload.allowSelfPayment) { 
                this.store.dispatch(new RTLActions.FetchInvoices({ num_max_invoices: PAGE_SIZE, reversed: true }));
              } else {
                this.store.dispatch(new RTLActions.CloseSpinner());
                let msg = 'Payment Sent Successfully.';
                if(sendRes.payment_route && sendRes.payment_route.total_fees_msat) {
                  msg = 'Payment sent successfully with the total fee ' + sendRes.payment_route.total_fees_msat + ' (mSats).';
                }
                this.store.dispatch(new RTLActions.OpenSnackBar(msg));
              }
              return {
                type: RTLActions.SEND_PAYMENT_STATUS,
                payload: sendRes
              };
            }
          }),
          catchError((err: any) => {
            if (action.payload.allowSelfPayment) { 
              this.store.dispatch(new RTLActions.FetchInvoices({ num_max_invoices: PAGE_SIZE, reversed: true }));
              return of({
                type: RTLActions.SEND_PAYMENT_STATUS,
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
    ofType(RTLActions.FETCH_GRAPH_NODE),
    mergeMap((action: RTLActions.FetchGraphNode) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('FetchGraphNode'));
      return this.httpClient.get<GraphNode>(this.CHILD_API_URL + environment.NETWORK_API + '/node/' + action.payload.pubkey)
        .pipe(map((graphNode: any) => {
          this.logger.info(graphNode);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SET_GRAPH_NODE,
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
    ofType(RTLActions.SET_GRAPH_NODE),
    map((action: RTLActions.SetGraphNode) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  getNewAddress = this.actions$.pipe(
    ofType(RTLActions.GET_NEW_ADDRESS),
    mergeMap((action: RTLActions.GetNewAddress) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.NEW_ADDRESS_API + '?type=' + action.payload.addressId)
        .pipe(map((newAddress: any) => {
          this.logger.info(newAddress);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SET_NEW_ADDRESS,
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
    ofType(RTLActions.SET_NEW_ADDRESS),
    map((action: RTLActions.SetNewAddress) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  SetChannelTransaction = this.actions$.pipe(
    ofType(RTLActions.SET_CHANNEL_TRANSACTION),
    mergeMap((action: RTLActions.SetChannelTransaction) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('SetChannelTransaction'));
      return this.httpClient.post(this.CHILD_API_URL + environment.TRANSACTIONS_API,
        { amount: action.payload.amount, address: action.payload.address, sendAll: action.payload.sendAll, fees: action.payload.fees, blocks: action.payload.blocks }
      )
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.FetchTransactions());            
            this.store.dispatch(new RTLActions.FetchBalance('blockchain'));
            return {
              type: RTLActions.SET_CHANNEL_TRANSACTION_RES,
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
    ofType(RTLActions.GET_FORWARDING_HISTORY),
    mergeMap((action: RTLActions.GetForwardingHistory) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('GetForwardingHistory'));
      const queryHeaders: SwitchReq = {
        num_max_events: action.payload.num_max_events, index_offset: action.payload.index_offset, end_time: action.payload.end_time, start_time: action.payload.start_time
      };
      return this.httpClient.post(this.CHILD_API_URL + environment.SWITCH_API, queryHeaders)
        .pipe(
          map((fhRes: any) => {
            this.logger.info(fhRes);
            return {
              type: RTLActions.SET_FORWARDING_HISTORY,
              payload: fhRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorLnd({ action: 'GetForwardingHistory', code: err.status, message: err.error.error }));
            this.handleErrorWithAlert('ERROR', 'Get Forwarding History Failed', this.CHILD_API_URL + environment.SWITCH_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  queryRoutesFetch = this.actions$.pipe(
    ofType(RTLActions.GET_QUERY_ROUTES),
    mergeMap((action: RTLActions.GetQueryRoutes) => {
      let url = this.CHILD_API_URL + environment.NETWORK_API + '/routes/' + action.payload.destPubkey + '/' + action.payload.amount;
      if (action.payload.outgoingChanId) { url = url + '?outgoing_chan_id=' + action.payload.outgoingChanId; }
      return this.httpClient.get(url)
        .pipe(
          map((qrRes: any) => {
            this.logger.info(qrRes);
            return {
              type: RTLActions.SET_QUERY_ROUTES,
              payload: qrRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.SetQueryRoutes({}));
            this.handleErrorWithAlert('ERROR', 'Get Query Routes Failed', this.CHILD_API_URL + environment.NETWORK_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect({ dispatch: false })
  setQueryRoutes = this.actions$.pipe(
    ofType(RTLActions.SET_QUERY_ROUTES),
    map((action: RTLActions.SetQueryRoutes) => {
      return action.payload;
    })
  );

  @Effect()
  genSeed = this.actions$.pipe(
    ofType(RTLActions.GEN_SEED),
    mergeMap((action: RTLActions.GenSeed) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.WALLET_API + '/genseed/' + action.payload)
        .pipe(
          map((postRes: any) => {
            this.logger.info('Generated GenSeed!');
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.GEN_SEED_RESPONSE,
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
    ofType(RTLActions.GEN_SEED_RESPONSE),
    map((action: RTLActions.GenSeedResponse) => {
      return action.payload;
    })
  );

  @Effect({ dispatch: false })
  initWalletRes = this.actions$.pipe(
    ofType(RTLActions.INIT_WALLET_RESPONSE),
    map((action: RTLActions.InitWalletResponse) => {
      return action.payload;
    })
  );

  @Effect()
  initWallet = this.actions$.pipe(
    ofType(RTLActions.INIT_WALLET),
    mergeMap((action: RTLActions.InitWallet) => {
      return this.httpClient.post(this.CHILD_API_URL + environment.WALLET_API + '/initwallet',
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
              type: RTLActions.INIT_WALLET_RESPONSE,
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
    ofType(RTLActions.UNLOCK_WALLET),
    mergeMap((action: RTLActions.UnlockWallet) => {
      return this.httpClient.post(this.CHILD_API_URL + environment.WALLET_API + '/unlockwallet', { wallet_password: action.payload.pwd })
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
              this.store.dispatch(new RTLActions.FetchInfo({loadPage: 'HOME'}));
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
    ofType(RTLActions.PEER_LOOKUP),
    mergeMap((action: RTLActions.PeerLookup) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/node/' + action.payload)
        .pipe(
          map((resPeer) => {
            this.logger.info(resPeer);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.SET_LOOKUP,
              payload: resPeer
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorLnd({ action: 'Lookup', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Peer Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/node/' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  channelLookup = this.actions$.pipe(
    ofType(RTLActions.CHANNEL_LOOKUP),
    mergeMap((action: RTLActions.ChannelLookup) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/edge/' + action.payload)
        .pipe(
          map((resChannel) => {
            this.logger.info(resChannel);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.SET_LOOKUP,
              payload: resChannel
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorLnd({ action: 'Lookup', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Channel Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/edge/' + action.payload, err);
            this.store.dispatch(new RTLActions.SetLookup({}));
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  invoiceLookup = this.actions$.pipe(
    ofType(RTLActions.INVOICE_LOOKUP),
    mergeMap((action: RTLActions.InvoiceLookup) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.INVOICES_API + '/' + action.payload)
        .pipe(
          map((resInvoice) => {
            this.logger.info(resInvoice);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.SET_LOOKUP,
              payload: resInvoice
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorLnd({ action: 'Lookup', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Invoice Lookup Failed', this.CHILD_API_URL + environment.INVOICES_API + '/' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setLookup = this.actions$.pipe(
    ofType(RTLActions.SET_LOOKUP),
    map((action: RTLActions.SetLookup) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );


  @Effect()
  getRestoreChannelList = this.actions$.pipe(
    ofType(RTLActions.RESTORE_CHANNELS_LIST),
    mergeMap((action: RTLActions.RestoreChannelsList) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('RestoreChannelsList'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/restore/list')
        .pipe(
          map((resRestoreList) => {
            this.logger.info(resRestoreList);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.SET_RESTORE_CHANNELS_LIST,
              payload: (resRestoreList) ? resRestoreList : {all_restore_exists: false, files: []}
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorLnd({ action: 'RestoreChannelsList', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Restore Channels List Failed', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setRestoreChannelList = this.actions$.pipe(
    ofType(RTLActions.SET_RESTORE_CHANNELS_LIST),
    map((action: RTLActions.SetRestoreChannelsList) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  getLoopSwaps = this.actions$.pipe(
    ofType(RTLActions.FETCH_LOOP_SWAPS),
    mergeMap((action: RTLActions.FetchLoopSwaps) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorLnd('LoopSwaps'));
      return this.httpClient.get(this.CHILD_API_URL + environment.LOOP_API + '/swaps')
        .pipe(
          map((swaps: any) => {
            this.logger.info(swaps);
            return {
              type: RTLActions.SET_LOOP_SWAPS,
              payload: swaps
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('LoopSwaps', 'Fetching Swaps Failed.', err);
            return of({type: RTLActions.VOID});
          })
        );
      }
    ));

    initializeRemainingData(info: any, landingPage: string) {
    this.sessionService.setItem('lndUnlocked', 'true');
    if (info.chains) {
      if (typeof info.chains[0] === 'string') {
        info.smaller_currency_unit = (info.chains[0].toString().toLowerCase().indexOf('bitcoin') < 0) ? CurrencyUnitEnum.LITOSHIS : CurrencyUnitEnum.SATS;
        info.currency_unit = (info.chains[0].toString().toLowerCase().indexOf('bitcoin') < 0) ? CurrencyUnitEnum.LTC : CurrencyUnitEnum.BTC;
      } else if (typeof info.chains[0] === 'object' && info.chains[0].hasOwnProperty('chain')) {
        const getInfoChain = <GetInfoChain>info.chains[0];
        info.smaller_currency_unit = (getInfoChain.chain.toLowerCase().indexOf('bitcoin') < 0) ? CurrencyUnitEnum.LITOSHIS : CurrencyUnitEnum.SATS;
        info.currency_unit = (getInfoChain.chain.toLowerCase().indexOf('bitcoin') < 0) ? CurrencyUnitEnum.LTC : CurrencyUnitEnum.BTC;
      }
      info.version = (!info.version) ? '' : info.version.split(' ')[0];
    } else {
      info.smaller_currency_unit = CurrencyUnitEnum.SATS;
      info.currency_unit = CurrencyUnitEnum.BTC;
      info.version = (!info.version) ? '' : info.version.split(' ')[0];
    }
    const node_data = {
      identity_pubkey: info.identity_pubkey,
      alias: info.alias, 
      testnet: info.testnet, 
      chains: info.chains,
      uris: info.uris,
      version: info.version, 
      currency_unit: info.currency_unit, 
      smaller_currency_unit: info.smaller_currency_unit
    };
    this.store.dispatch(new RTLActions.SetNodeData(node_data));
    this.store.dispatch(new RTLActions.FetchPeers());
    this.store.dispatch(new RTLActions.FetchBalance('channels'));
    this.store.dispatch(new RTLActions.FetchNetwork());
    this.store.dispatch(new RTLActions.FetchAllChannels());
    this.store.dispatch(new RTLActions.FetchPendingChannels());
    this.store.dispatch(new RTLActions.FetchClosedChannels());
    this.store.dispatch(new RTLActions.FetchInvoices({num_max_invoices: 10, reversed: true}));
    this.store.dispatch(new RTLActions.FetchPayments());
    this.store.dispatch(new RTLActions.FetchFees()); //Fetches monthly forwarding history as well, to count total number of events
    let newRoute = this.location.path();
    if(newRoute.includes('/cl/')) {
      newRoute = newRoute.replace('/cl/', '/lnd/');
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
      this.store.dispatch(new RTLActions.EffectErrorLnd({ action: actionName, code: err.status.toString(), message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.error && typeof err.error.error.error.error.error === 'string') ? err.error.error.error.error.error : (err.error.error && err.error.error.error && err.error.error.error.error && typeof err.error.error.error.error === 'string') ? err.error.error.error.error : (err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error.error && typeof err.error.error === 'string') ? err.error.error : typeof err.error === 'string' ? err.error : genericErrorMessage}));
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
