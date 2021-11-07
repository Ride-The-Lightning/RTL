import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom, takeUntil } from 'rxjs/operators';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { environment, API_URL } from '../../../environments/environment';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';
import { SessionService } from '../../shared/services/session.service';
import { GetInfo, Fees, Balance, NetworkInfo, GraphNode, Transaction, SwitchReq, ListInvoices, PendingChannelsGroup, UTXO, ListPayments, SavePeer, SaveInvoice, SaveChannel, CloseChannel, FetchInvoices, FetchPayments, SendPayment, LightningNode, GetNewAddress, ChannelsTransaction, SwitchRes, GetQueryRoutes, QueryRoutes, InitWallet, ChannelLookup, SetRestoreChannelsList } from '../../shared/models/lndModels';
import { InvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { RTLActions, LNDActions, AlertTypeEnum, APICallStatusEnum, FEE_LIMIT_TYPES, PAGE_SIZE, UI_MESSAGES } from '../../shared/services/consts-enums-functions';
import { closeAllDialogs, closeSpinner, logout, openAlert, openSnackBar, openSpinner, setApiUrl, setNodeData } from '../../store/rtl.actions';
import { LNDState } from './lnd.state';
import { RootState, RTLState } from '../../store/rtl.state';

import { backupChannels, fetchAllChannels, fetchBalance, fetchClosedChannels, fetchFees, fetchInfoLND, fetchInvoices, fetchNetwork, fetchPayments, fetchPeers, fetchPendingChannels, fetchTransactions, getAllLightningTransactions, setForwardingHistory, setLookup, setPeers, setQueryRoutes, setRestoreChannelsList, setTotalInvoices, updateAPICallStatus, updateInvoice } from './lnd.actions';

@Injectable()
export class LNDEffects implements OnDestroy {

  dialogRef: any;
  CHILD_API_URL = API_URL + '/lnd';
  private flgInitialized = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions: Actions,
    private httpClient: HttpClient,
    private store: Store<RTLState>,
    private logger: LoggerService,
    private commonService: CommonService,
    private sessionService: SessionService,
    public dialog: MatDialog,
    private router: Router,
    private location: Location
  ) {
    this.store.select('lnd').
      pipe(takeUntil(this.unSubs[0])).
      subscribe((rtlStore) => {
        if (
          ((rtlStore.apisCallStatus.FetchInfo.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchInfo.status === APICallStatusEnum.ERROR) &&
            (rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.ERROR) &&
            (rtlStore.apisCallStatus.FetchBalanceBlockchain.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchBalanceBlockchain.status === APICallStatusEnum.ERROR) &&
            (rtlStore.apisCallStatus.FetchAllChannels.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchAllChannels.status === APICallStatusEnum.ERROR) &&
            (rtlStore.apisCallStatus.FetchPendingChannels.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchPendingChannels.status === APICallStatusEnum.ERROR)) &&
          !this.flgInitialized
        ) {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.INITALIZE_NODE_DATA }));
          this.flgInitialized = true;
        }
      });
  }

  infoFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_INFO_LND),
    mergeMap((payload: { loadPage: string }) => {
      this.flgInitialized = false;
      this.store.dispatch(setApiUrl({ payload: this.CHILD_API_URL }));
      this.store.dispatch(closeAllDialogs());
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_NODE_INFO }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchInfo', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<GetInfo>(this.CHILD_API_URL + environment.GETINFO_API).pipe(
        takeUntil(this.actions.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
        map((info) => {
          this.logger.info(info);
          if (info.chains && info.chains.length && info.chains[0] && (
            (typeof info.chains[0] === 'string' && info.chains[0].toLowerCase().indexOf('bitcoin') < 0) ||
            (typeof info.chains[0] === 'object' && info.chains[0].hasOwnProperty('chain') && info.chains[0].chain.toLowerCase().indexOf('bitcoin') < 0)
          )
          ) {
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchInfo', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeAllDialogs()); // Multiple UI_MESSAGES.GET_NODE_INFO after unlock & UI_MESSAGES.WAIT_SYNC_NODE
            this.store.dispatch(openAlert({
              payload: {
                data: {
                  type: AlertTypeEnum.ERROR,
                  alertTitle: 'Shitcoin Found',
                  titleMessage: 'Sorry Not Sorry, RTL is Bitcoin Only!'
                }
              }
            }));
            return { type: RTLActions.LOGOUT };
          } else if (!info.identity_pubkey) {
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchInfo', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeAllDialogs()); // Multiple UI_MESSAGES.GET_NODE_INFO after unlock & UI_MESSAGES.WAIT_SYNC_NODE
            this.sessionService.removeItem('lndUnlocked');
            this.logger.info('Redirecting to Unlock');
            this.router.navigate(['/lnd/wallet']);
            return {
              type: LNDActions.SET_INFO_LND,
              payload: {}
            };
          } else {
            info.lnImplementation = 'LND';
            this.initializeRemainingData(info, payload.loadPage);
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchInfo', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeAllDialogs()); // Multiple UI_MESSAGES.GET_NODE_INFO after unlock & UI_MESSAGES.WAIT_SYNC_NODE
            return {
              type: LNDActions.SET_INFO_LND,
              payload: info ? info : {}
            };
          }
        }),
        catchError((err) => {
          if (
            (typeof err.error.error === 'string' && err.error.error.includes('Not Found')) ||
            (typeof err.error.error === 'string' && err.error.error.includes('wallet locked')) ||
            err.status === 502
          ) {
            this.sessionService.removeItem('lndUnlocked');
            this.logger.info('Redirecting to Unlock');
            this.router.navigate(['/lnd/wallet']);
            this.handleErrorWithoutAlert('FetchInfo', UI_MESSAGES.GET_NODE_INFO, 'Fetching Node Info Failed.', err);
          } else if (typeof err.error.error === 'string' && err.error.error.includes('starting up') && err.status === 500) {
            setTimeout(() => {
              this.store.dispatch(fetchInfoLND({ payload: { loadPage: 'HOME' } }));
            }, 2000);
          } else {
            const code = this.commonService.extractErrorCode(err);
            const msg = (code === 503) ? 'Unable to Connect to LND Server.' : this.commonService.extractErrorMessage(err);
            this.router.navigate(['/error'], { state: { errorCode: code, errorMessage: msg } });
            this.handleErrorWithoutAlert('FetchInfo', UI_MESSAGES.GET_NODE_INFO, 'Fetching Node Info Failed.', { status: code, error: msg });
          }
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  peersFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_PEERS_LND),
    mergeMap(() => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchPeers', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.PEERS_API).pipe(
        map((peers: any) => {
          this.logger.info(peers);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchPeers', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_PEERS_LND,
            payload: peers ? peers : []
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchPeers', UI_MESSAGES.NO_SPINNER, 'Fetching Peers Failed.', err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  saveNewPeer = createEffect(() => this.actions.pipe(
    ofType(LNDActions.SAVE_NEW_PEER_LND),
    mergeMap((payload: SavePeer) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.CONNECT_PEER }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'SaveNewPeer', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post(this.CHILD_API_URL + environment.PEERS_API, { pubkey: payload.pubkey, host: payload.host, perm: payload.perm }).pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'SaveNewPeer', status: APICallStatusEnum.COMPLETED } }));
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.CONNECT_PEER }));
          this.store.dispatch(setPeers({ payload: ((postRes && postRes.length > 0) ? postRes : []) }));
          return {
            type: LNDActions.NEWLY_ADDED_PEER_LND,
            payload: { peer: postRes[0] }
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('SaveNewPeer', UI_MESSAGES.CONNECT_PEER, 'Peer Connection Failed.', err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  detachPeer = createEffect(() => this.actions.pipe(
    ofType(LNDActions.DETACH_PEER_LND),
    mergeMap((payload: { pubkey: string }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.DISCONNECT_PEER }));
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + payload.pubkey).pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.DISCONNECT_PEER }));
          this.store.dispatch(openSnackBar({ payload: 'Peer Disconnected Successfully.' }));
          return {
            type: LNDActions.REMOVE_PEER_LND,
            payload: { pubkey: payload.pubkey }
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('DetachPeer', UI_MESSAGES.DISCONNECT_PEER, 'Unable to Detach Peer. Try again later.', this.CHILD_API_URL + environment.PEERS_API + '/' + payload.pubkey, err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  saveNewInvoice = createEffect(() => this.actions.pipe(
    ofType(LNDActions.SAVE_NEW_INVOICE_LND),
    mergeMap((payload: SaveInvoice) => {
      this.store.dispatch(openSpinner({ payload: payload.uiMessage }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'SaveNewInvoice', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post(this.CHILD_API_URL + environment.INVOICES_API, {
        memo: payload.memo, amount: payload.invoiceValue, private: payload.private, expiry: payload.expiry
      }).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'SaveNewInvoice', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(fetchInvoices({ payload: { num_max_invoices: payload.pageSize, reversed: true } }));
            if (payload.openModal) {
              postRes.memo = payload.memo;
              postRes.value = payload.invoiceValue;
              postRes.expiry = payload.expiry;
              postRes.cltv_expiry = '144';
              postRes.private = payload.private;
              postRes.creation_date = Math.round(new Date().getTime() / 1000).toString();
              this.store.dispatch(closeSpinner({ payload: payload.uiMessage }));
              return {
                type: RTLActions.OPEN_ALERT,
                payload: {
                  data: {
                    invoice: postRes,
                    newlyAdded: true,
                    component: InvoiceInformationComponent
                  }
                }
              };
            } else {
              return {
                type: LNDActions.NEWLY_SAVED_INVOICE_LND,
                payload: { paymentRequest: postRes.payment_request }
              };
            }
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewInvoice', payload.uiMessage, 'Add Invoice Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    }))
  );

  openNewChannel = createEffect(() => this.actions.pipe(
    ofType(LNDActions.SAVE_NEW_CHANNEL_LND),
    mergeMap((payload: SaveChannel) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.OPEN_CHANNEL }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'SaveNewChannel', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, {
        node_pubkey: payload.selectedPeerPubkey, local_funding_amount: payload.fundingAmount, private: payload.private,
        trans_type: payload.transType, trans_type_value: payload.transTypeValue, spend_unconfirmed: payload.spendUnconfirmed
      }).pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'SaveNewChannel', status: APICallStatusEnum.COMPLETED } }));
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.OPEN_CHANNEL }));
          this.store.dispatch(fetchBalance({ payload: 'Blockchain' }));
          this.store.dispatch(fetchAllChannels());
          this.store.dispatch(backupChannels({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, channelPoint: 'ALL', showMessage: 'Channel Added Successfully!' } }));
          return {
            type: LNDActions.FETCH_PENDING_CHANNELS_LND
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('SaveNewChannel', UI_MESSAGES.OPEN_CHANNEL, 'Opening Channel Failed.', err);
          return of({ type: RTLActions.VOID });
        }));
    }))
  );

  updateChannel = createEffect(() => this.actions.pipe(
    ofType(LNDActions.UPDATE_CHANNEL_LND),
    mergeMap((payload: any) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.UPDATE_CHAN_POLICY }));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/chanPolicy',
        { baseFeeMsat: payload.baseFeeMsat, feeRate: payload.feeRate, timeLockDelta: payload.timeLockDelta, chanPoint: payload.chanPoint }
      ).pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.UPDATE_CHAN_POLICY }));
          if (payload.chanPoint === 'all') {
            this.store.dispatch(openSnackBar({ payload: 'All Channels Updated Successfully.' }));
          } else {
            this.store.dispatch(openSnackBar({ payload: 'Channel Updated Successfully!' }));
          }
          return {
            type: LNDActions.FETCH_ALL_CHANNELS_LND
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('UpdateChannels', UI_MESSAGES.UPDATE_CHAN_POLICY, 'Update Channel Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/chanPolicy', err);
          return of({ type: RTLActions.VOID });
        }));
    }))
  );

  closeChannel = createEffect(() => this.actions.pipe(
    ofType(LNDActions.CLOSE_CHANNEL_LND),
    mergeMap((payload: CloseChannel) => {
      this.store.dispatch(openSpinner({ payload: (payload.forcibly ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL) }));
      let reqUrl = this.CHILD_API_URL + environment.CHANNELS_API + '/' + payload.channelPoint + '?force=' + payload.forcibly;
      if (payload.targetConf) {
        reqUrl = reqUrl + '&target_conf=' + payload.targetConf;
      }
      if (payload.satPerByte) {
        reqUrl = reqUrl + '&sat_per_byte=' + payload.satPerByte;
      }
      return this.httpClient.delete(reqUrl).pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(closeSpinner({ payload: payload.forcibly ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL }));
          this.store.dispatch(fetchAllChannels());
          this.store.dispatch(fetchPendingChannels());
          this.store.dispatch(backupChannels({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, channelPoint: 'ALL', showMessage: postRes.message } }));
          return { type: RTLActions.VOID };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('CloseChannel', (payload.forcibly ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL), 'Unable to Close Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_API + '/' + payload.channelPoint + '?force=' + payload.forcibly, err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  backupChannels = createEffect(() => this.actions.pipe(
    ofType(LNDActions.BACKUP_CHANNELS_LND),
    mergeMap((payload: any) => {
      this.store.dispatch(openSpinner({ payload: payload.uiMessage }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'BackupChannels', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/' + payload.channelPoint).pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'BackupChannels', status: APICallStatusEnum.COMPLETED } }));
          this.store.dispatch(closeSpinner({ payload: payload.uiMessage }));
          this.store.dispatch(openSnackBar({ payload: payload.showMessage + ' ' + postRes.message }));
          return {
            type: LNDActions.BACKUP_CHANNELS_RES_LND,
            payload: postRes.message
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('BackupChannels', payload.uiMessage, payload.showMessage + ' Unable to Backup Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/' + payload.channelPoint, err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  verifyChannel = createEffect(() => this.actions.pipe(
    ofType(LNDActions.VERIFY_CHANNEL_LND),
    mergeMap((payload: { channelPoint: string }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.VERIFY_CHANNEL }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'VerifyChannel', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/verify/' + payload.channelPoint, {}).pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'VerifyChannel', status: APICallStatusEnum.COMPLETED } }));
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.VERIFY_CHANNEL }));
          this.store.dispatch(openSnackBar(postRes.message));
          return {
            type: LNDActions.VERIFY_CHANNEL_RES_LND,
            payload: postRes.message
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('VerifyChannel', UI_MESSAGES.VERIFY_CHANNEL, 'Unable to Verify Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/verify/' + payload.channelPoint, err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  restoreChannels = createEffect(() => this.actions.pipe(
    ofType(LNDActions.RESTORE_CHANNELS_LND),
    mergeMap((payload: { channelPoint: string }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.RESTORE_CHANNEL }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'RestoreChannels', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/restore/' + payload.channelPoint, {}).pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'RestoreChannels', status: APICallStatusEnum.COMPLETED } }));
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.RESTORE_CHANNEL }));
          this.store.dispatch(openSnackBar(postRes.message));
          this.store.dispatch(setRestoreChannelsList(postRes.list));
          return {
            type: LNDActions.RESTORE_CHANNELS_RES_LND,
            payload: postRes.message
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('RestoreChannels', UI_MESSAGES.RESTORE_CHANNEL, 'Unable to Restore Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/restore/' + payload.channelPoint, err);
          return of({ type: RTLActions.VOID });
        }));
    }))
  );

  fetchFees = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_FEES_LND),
    mergeMap(() => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchFees', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<Fees>(this.CHILD_API_URL + environment.FEES_API);
    }),
    map((fees) => {
      this.logger.info(fees);
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchFees', status: APICallStatusEnum.COMPLETED } }));
      if (fees.forwarding_events_history) {
        this.store.dispatch(setForwardingHistory({ payload: fees.forwarding_events_history }));
        delete fees.forwarding_events_history;
      }
      return {
        type: LNDActions.SET_FEES_LND,
        payload: fees ? fees : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchFees', UI_MESSAGES.NO_SPINNER, 'Fetching Fees Failed.', err);
      return of({ type: RTLActions.VOID });
    }))
  );

  balanceFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_BALANCE_LND),
    mergeMap((payload: string) => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchBalance' + payload, status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<Balance>(this.CHILD_API_URL + environment.BALANCE_API + '/' + payload).pipe(
        map((res: any) => {
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchBalance' + payload, status: APICallStatusEnum.COMPLETED } }));
          this.logger.info(res);
          const emptyRes = (payload === 'channels') ? { balance: '' } : { total_balance: '' };
          return {
            type: LNDActions.SET_BALANCE_LND,
            payload: res ? { target: payload, balance: res } : { target: payload, balance: emptyRes }
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchBalance' + payload, UI_MESSAGES.NO_SPINNER, 'Fetching' + this.commonService.titleCase(payload) + ' Balance Failed.', err);
          return of({ type: RTLActions.VOID });
        }));
    }))
  );

  networkInfoFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_NETWORK_LND),
    mergeMap(() => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchNetwork', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<NetworkInfo>(this.CHILD_API_URL + environment.NETWORK_API + '/info');
    }),
    map((networkInfo) => {
      this.logger.info(networkInfo);
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchNetwork', status: APICallStatusEnum.COMPLETED } }));
      return {
        type: LNDActions.SET_NETWORK_LND,
        payload: networkInfo ? networkInfo : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchNetwork', UI_MESSAGES.NO_SPINNER, 'Fetching Network Failed.', err);
      return of({ type: RTLActions.VOID });
    }))
  );

  channelsAllFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_ALL_CHANNELS_LND),
    mergeMap(() => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchAllChannels', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API).pipe(
        map((channels: any) => {
          this.logger.info(channels);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchAllChannels', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_ALL_CHANNELS_LND,
            payload: (channels && channels.channels && channels.channels.length > 0) ? channels.channels : []
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchAllChannels', UI_MESSAGES.NO_SPINNER, 'Fetching All Channels Failed.', err);
          return of({ type: RTLActions.VOID });
        }));
    }))
  );

  channelsPendingFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_PENDING_CHANNELS_LND),
    mergeMap(() => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchPendingChannels', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/pending').pipe(
        map((channels: any) => {
          this.logger.info(channels);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchPendingChannels', status: APICallStatusEnum.COMPLETED } }));
          const pendingChannels: PendingChannelsGroup = { open: { num_channels: 0, limbo_balance: 0 }, closing: { num_channels: 0, limbo_balance: 0 }, force_closing: { num_channels: 0, limbo_balance: 0 }, waiting_close: { num_channels: 0, limbo_balance: 0 }, total_channels: 0, total_limbo_balance: 0 };
          if (channels) {
            pendingChannels.total_limbo_balance = channels.total_limbo_balance;
            if (channels.pending_closing_channels) {
              pendingChannels.closing.num_channels = channels.pending_closing_channels.length;
              pendingChannels.total_channels = pendingChannels.total_channels + channels.pending_closing_channels.length;
              channels.pending_closing_channels.forEach((closingChannel) => {
                pendingChannels.closing.limbo_balance = +pendingChannels.closing.limbo_balance + (closingChannel.channel.local_balance ? +closingChannel.channel.local_balance : 0);
              });
            }
            if (channels.pending_force_closing_channels) {
              pendingChannels.force_closing.num_channels = channels.pending_force_closing_channels.length;
              pendingChannels.total_channels = pendingChannels.total_channels + channels.pending_force_closing_channels.length;
              channels.pending_force_closing_channels.forEach((closingChannel) => {
                pendingChannels.force_closing.limbo_balance = +pendingChannels.force_closing.limbo_balance + (closingChannel.channel.local_balance ? +closingChannel.channel.local_balance : 0);
              });
            }
            if (channels.pending_open_channels) {
              pendingChannels.open.num_channels = channels.pending_open_channels.length;
              pendingChannels.total_channels = pendingChannels.total_channels + channels.pending_open_channels.length;
              channels.pending_open_channels.forEach((openingChannel) => {
                pendingChannels.open.limbo_balance = +pendingChannels.open.limbo_balance + (openingChannel.channel.local_balance ? +openingChannel.channel.local_balance : 0);
              });
            }
            if (channels.waiting_close_channels) {
              pendingChannels.waiting_close.num_channels = channels.waiting_close_channels.length;
              pendingChannels.total_channels = pendingChannels.total_channels + channels.waiting_close_channels.length;
              channels.waiting_close_channels.forEach((closingChannel) => {
                pendingChannels.waiting_close.limbo_balance = +pendingChannels.waiting_close.limbo_balance + (closingChannel.channel.local_balance ? +closingChannel.channel.local_balance : 0);
              });
            }
          }
          return {
            type: LNDActions.SET_PENDING_CHANNELS_LND,
            payload: channels ? { channels: channels, pendingChannels: pendingChannels } : { channels: {}, pendingChannels: pendingChannels }
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchPendingChannels', UI_MESSAGES.NO_SPINNER, 'Fetching Pending Channels Failed.', err);
          return of({ type: RTLActions.VOID });
        }));
    }))
  );

  channelsClosedFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_CLOSED_CHANNELS_LND),
    mergeMap(() => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchClosedChannels', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/closed').pipe(
        map((channels: any) => {
          this.logger.info(channels);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchClosedChannels', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_CLOSED_CHANNELS_LND,
            payload: (channels && channels.channels && channels.channels.length > 0) ? channels.channels : []
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchClosedChannels', UI_MESSAGES.NO_SPINNER, 'Fetching Closed Channels Failed.', err);
          return of({ type: RTLActions.VOID });
        }));
    }))
  );

  invoicesFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_INVOICES_LND),
    mergeMap((payload: FetchInvoices) => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchInvoices', status: APICallStatusEnum.INITIATED } }));
      const num_max_invoices = (payload.num_max_invoices) ? payload.num_max_invoices : 100;
      const index_offset = (payload.index_offset) ? payload.index_offset : 0;
      const reversed = (payload.reversed) ? payload.reversed : false;
      return this.httpClient.get<ListInvoices>(this.CHILD_API_URL + environment.INVOICES_API + '?num_max_invoices=' + num_max_invoices + '&index_offset=' + index_offset + '&reversed=' + reversed).pipe(
        map((res: ListInvoices) => {
          this.logger.info(res);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchInvoices', status: APICallStatusEnum.COMPLETED } }));
          if (payload.reversed && !payload.index_offset) {
            this.store.dispatch(setTotalInvoices({ payload: +res.last_index_offset }));
          }
          return {
            type: LNDActions.SET_INVOICES_LND,
            payload: res
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchInvoices', UI_MESSAGES.NO_SPINNER, 'Fetching Invoices Failed.', err);
          return of({ type: RTLActions.VOID });
        }));
    }))
  );

  transactionsFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_TRANSACTIONS_LND),
    mergeMap(() => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchTransactions', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<Transaction[]>(this.CHILD_API_URL + environment.TRANSACTIONS_API);
    }),
    map((transactions) => {
      this.logger.info(transactions);
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchTransactions', status: APICallStatusEnum.COMPLETED } }));
      return {
        type: LNDActions.SET_TRANSACTIONS_LND,
        payload: (transactions && transactions.length > 0) ? transactions : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchTransactions', UI_MESSAGES.NO_SPINNER, 'Fetching Transactions Failed.', err);
      return of({ type: RTLActions.VOID });
    }))
  );

  utxosFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_UTXOS_LND),
    withLatestFrom(this.store.select('lnd')),
    mergeMap(([payload, lndData]: [any, LNDState]) => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchUTXOs', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<UTXO[]>(this.CHILD_API_URL + environment.WALLET_API + '/getUTXOs?max_confs=' + (lndData.information && lndData.information.block_height ? lndData.information.block_height : 1000000000));
    }),
    map((utxos) => {
      this.logger.info(utxos);
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchUTXOs', status: APICallStatusEnum.COMPLETED } }));
      return {
        type: LNDActions.SET_UTXOS_LND,
        payload: (utxos && utxos.length > 0) ? utxos : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchUTXOs', UI_MESSAGES.NO_SPINNER, 'Fetching UTXOs Failed.', err);
      return of({ type: RTLActions.VOID });
    }))
  );

  paymentsFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_PAYMENTS_LND),
    mergeMap((payload: FetchPayments) => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchPayments', status: APICallStatusEnum.INITIATED } }));
      const max_payments = (payload.max_payments) ? payload.max_payments : 100;
      const index_offset = (payload.index_offset) ? payload.index_offset : 0;
      const reversed = (payload.reversed) ? payload.reversed : false;
      return this.httpClient.get<ListPayments>(this.CHILD_API_URL + environment.PAYMENTS_API + '?max_payments=' + max_payments + '&index_offset=' + index_offset + '&reversed=' + reversed).
        pipe(map((res: ListPayments) => {
          this.logger.info(res);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchPayments', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_PAYMENTS_LND,
            payload: res
          };
        }), catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchPayments', UI_MESSAGES.NO_SPINNER, 'Fetching Payments Failed.', err);
          return of({
            type: LNDActions.SET_PAYMENTS_LND,
            payload: { payments: [] }
          });
        }));
    }))
  );

  sendPayment = createEffect(() => this.actions.pipe(
    ofType(LNDActions.SEND_PAYMENT_LND),
    mergeMap((payload: SendPayment) => {
      this.store.dispatch(openSpinner({ payload: payload.uiMessage }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'SendPayment', status: APICallStatusEnum.INITIATED } }));
      const queryHeaders = {};
      queryHeaders['paymentReq'] = payload.paymentReq;
      if (payload.paymentAmount) {
        queryHeaders['paymentAmount'] = payload.paymentAmount;
      }
      if (payload.outgoingChannel) {
        queryHeaders['outgoingChannel'] = payload.outgoingChannel.chan_id;
      }
      if (payload.allowSelfPayment) {
        queryHeaders['allowSelfPayment'] = payload.allowSelfPayment;
      } // Channel Rebalancing
      if (payload.lastHopPubkey) {
        queryHeaders['lastHopPubkey'] = payload.lastHopPubkey;
      }
      if (payload.feeLimitType && payload.feeLimitType !== FEE_LIMIT_TYPES[0]) {
        queryHeaders['feeLimit'] = {};
        queryHeaders['feeLimit'][payload.feeLimitType.id] = payload.feeLimit;
      }
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/transactions', queryHeaders).pipe(
        map((sendRes: any) => {
          this.logger.info(sendRes);
          this.store.dispatch(closeSpinner({ payload: payload.uiMessage }));
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'SendPayment', status: APICallStatusEnum.COMPLETED } }));
          if (sendRes.payment_error) {
            if (payload.allowSelfPayment) {
              this.store.dispatch(fetchInvoices({ payload: { num_max_invoices: PAGE_SIZE, reversed: true } }));
              return {
                type: LNDActions.SEND_PAYMENT_STATUS_LND,
                payload: sendRes
              };
            } else {
              if (payload.fromDialog) {
                this.handleErrorWithoutAlert('SendPayment', payload.uiMessage, 'Send Payment Failed.', sendRes.payment_error);
              } else {
                this.handleErrorWithAlert('SendPayment', payload.uiMessage, 'Send Payment Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/transactions', sendRes.payment_error);
              }
              return { type: RTLActions.VOID };
            }
          } else {
            this.store.dispatch(closeSpinner({ payload: payload.uiMessage }));
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'SendPayment', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(fetchAllChannels());
            this.store.dispatch(fetchPayments({ payload: { max_payments: PAGE_SIZE, reversed: true } }));
            if (payload.allowSelfPayment) {
              this.store.dispatch(fetchInvoices({ payload: { num_max_invoices: PAGE_SIZE, reversed: true } }));
            } else {
              let msg = 'Payment Sent Successfully.';
              if (sendRes.payment_route && sendRes.payment_route.total_fees_msat) {
                msg = 'Payment sent successfully with the total fee ' + sendRes.payment_route.total_fees_msat + ' (mSats).';
              }
              this.store.dispatch(openSnackBar({ payload: msg }));
            }
            return {
              type: LNDActions.SEND_PAYMENT_STATUS_LND,
              payload: sendRes
            };
          }
        }),
        catchError((err: any) => {
          this.logger.error('Error: ' + JSON.stringify(err));
          if (payload.allowSelfPayment) {
            this.handleErrorWithoutAlert('SendPayment', payload.uiMessage, 'Send Payment Failed.', err);
            this.store.dispatch(fetchInvoices({ payload: { num_max_invoices: PAGE_SIZE, reversed: true } }));
            return of({
              type: LNDActions.SEND_PAYMENT_STATUS_LND,
              payload: { error: this.commonService.extractErrorMessage(err) }
            });
          } else {
            if (payload.fromDialog) {
              this.handleErrorWithoutAlert('SendPayment', payload.uiMessage, 'Send Payment Failed.', err);
            } else {
              this.handleErrorWithAlert('SendPayment', payload.uiMessage, 'Send Payment Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/transactions', err);
            }
            return of({ type: RTLActions.VOID });
          }
        }));
    }))
  );

  graphNodeFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.FETCH_GRAPH_NODE_LND),
    mergeMap((payload: { pubkey: string }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_NODE_ADDRESS }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchGraphNode', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<GraphNode>(this.CHILD_API_URL + environment.NETWORK_API + '/node/' + payload.pubkey).pipe(
        map((graphNode: any) => {
          this.logger.info(graphNode);
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_NODE_ADDRESS }));
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchGraphNode', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_GRAPH_NODE_LND,
            payload: graphNode && graphNode.node ? { node: graphNode.node } : { node: null }
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchGraphNode', UI_MESSAGES.GET_NODE_ADDRESS, 'Fetching Graph Node Failed.', err);
          return of({ type: RTLActions.VOID });
        }));
    }))
  );

  setGraphNode = createEffect(
    () => this.actions.pipe(
      ofType(LNDActions.SET_GRAPH_NODE_LND),
      map((payload: { node: LightningNode }) => {
        this.logger.info(payload);
        return payload;
      })),
    { dispatch: false }
  );

  getNewAddress = createEffect(
    () => this.actions.pipe(
      ofType(LNDActions.GET_NEW_ADDRESS_LND),
      mergeMap((payload: GetNewAddress) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GENERATE_NEW_ADDRESS }));
        return this.httpClient.get(this.CHILD_API_URL + environment.NEW_ADDRESS_API + '?type=' + payload.addressId).pipe(
          map((newAddress: any) => {
            this.logger.info(newAddress);
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GENERATE_NEW_ADDRESS }));
            return {
              type: LNDActions.SET_NEW_ADDRESS_LND,
              payload: (newAddress && newAddress.address) ? newAddress.address : {}
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('GetNewAddress', UI_MESSAGES.GENERATE_NEW_ADDRESS, 'Generate New Address Failed', this.CHILD_API_URL + environment.NEW_ADDRESS_API + '?type=' + payload.addressId, err);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  setNewAddress = createEffect(
    () => this.actions.pipe(
      ofType(LNDActions.SET_NEW_ADDRESS_LND),
      map((payload: string) => {
        this.logger.info(payload);
        return payload;
      })),
    { dispatch: false }
  );

  SetChannelTransaction = createEffect(() => this.actions.pipe(
    ofType(LNDActions.SET_CHANNEL_TRANSACTION_LND),
    mergeMap((payload: ChannelsTransaction) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.SEND_FUNDS }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'SetChannelTransaction', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post(
        this.CHILD_API_URL + environment.TRANSACTIONS_API,
        { amount: payload.amount, address: payload.address, sendAll: payload.sendAll, fees: payload.fees, blocks: payload.blocks }
      ).pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'SetChannelTransaction', status: APICallStatusEnum.COMPLETED } }));
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.SEND_FUNDS }));
          this.store.dispatch(fetchTransactions());
          this.store.dispatch(fetchBalance({ payload: 'Blockchain' }));
          this.store.dispatch(fetchAllChannels());
          return {
            type: LNDActions.SET_CHANNEL_TRANSACTION_RES_LND,
            payload: postRes
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('SetChannelTransaction', UI_MESSAGES.SEND_FUNDS, 'Sending Fund Failed.', err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  fetchForwardingHistory = createEffect(() => this.actions.pipe(
    ofType(LNDActions.GET_FORWARDING_HISTORY_LND),
    mergeMap((payload: SwitchReq) => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'GetForwardingHistory', status: APICallStatusEnum.INITIATED } }));
      const queryHeaders: SwitchReq = {
        num_max_events: payload.num_max_events, index_offset: payload.index_offset, end_time: payload.end_time, start_time: payload.start_time
      };
      return this.httpClient.post(this.CHILD_API_URL + environment.SWITCH_API, queryHeaders).pipe(
        map((fhRes: any) => {
          this.logger.info(fhRes);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'GetForwardingHistory', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_FORWARDING_HISTORY_LND,
            payload: fhRes
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('GetForwardingHistory', UI_MESSAGES.NO_SPINNER, 'Get Forwarding History Failed', this.CHILD_API_URL + environment.SWITCH_API, err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  queryRoutesFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.GET_QUERY_ROUTES_LND),
    mergeMap((payload: GetQueryRoutes) => {
      let url = this.CHILD_API_URL + environment.NETWORK_API + '/routes/' + payload.destPubkey + '/' + payload.amount;
      if (payload.outgoingChanId) {
        url = url + '?outgoing_chan_id=' + payload.outgoingChanId;
      }
      return this.httpClient.get(url).pipe(
        map((qrRes: any) => {
          this.logger.info(qrRes);
          return {
            type: LNDActions.SET_QUERY_ROUTES_LND,
            payload: qrRes
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(setQueryRoutes({ payload: null }));
          this.handleErrorWithAlert('GetQueryRoutes', UI_MESSAGES.NO_SPINNER, 'Get Query Routes Failed', this.CHILD_API_URL + environment.NETWORK_API, err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  setQueryRoutes = createEffect(
    () => this.actions.pipe(
      ofType(LNDActions.SET_QUERY_ROUTES_LND),
      map((payload: QueryRoutes) => payload)),
    { dispatch: false }
  );

  genSeed = createEffect(() => this.actions.pipe(
    ofType(LNDActions.GEN_SEED_LND),
    mergeMap((payload: string) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GEN_SEED }));
      return this.httpClient.get(this.CHILD_API_URL + environment.WALLET_API + '/genseed/' + payload).pipe(
        map((postRes: any) => {
          this.logger.info('Generated GenSeed!');
          this.logger.info(postRes);
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GEN_SEED }));
          return {
            type: LNDActions.GEN_SEED_RESPONSE_LND,
            payload: postRes.cipher_seed_mnemonic
          };
        }),
        catchError((err) => {
          this.handleErrorWithAlert('GenSeed', UI_MESSAGES.GEN_SEED, 'Genseed Generation Failed', this.CHILD_API_URL + environment.WALLET_API + '/genseed/' + payload, err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  updateSelNodeOptions = createEffect(() => this.actions.pipe(
    ofType(RTLActions.UPDATE_SELECTED_NODE_OPTIONS),
    mergeMap(() => this.httpClient.get(this.CHILD_API_URL + environment.WALLET_API + '/updateSelNodeOptions').pipe(
      map((postRes: any) => {
        this.logger.info('Update Sel Node Successfull');
        this.logger.info(postRes);
        return {
          type: RTLActions.VOID
        };
      }),
      catchError((err) => {
        this.handleErrorWithAlert('UpdateSelectedNodeOptions', UI_MESSAGES.NO_SPINNER, 'Update macaroon for newly initialized node failed! Please check the macaroon path and restart the server!', 'Update Macaroon', err);
        return of({ type: RTLActions.VOID });
      })
    )))
  );

  genSeedResponse = createEffect(
    () => this.actions.pipe(
      ofType(LNDActions.GEN_SEED_RESPONSE_LND),
      map((payload: Array<string>) => payload)),
    { dispatch: false }
  );

  initWalletRes = createEffect(
    () => this.actions.pipe(
      ofType(LNDActions.INIT_WALLET_RESPONSE_LND),
      map((payload: string) => payload)),
    { dispatch: false }
  );

  initWallet = createEffect(() => this.actions.pipe(
    ofType(LNDActions.INIT_WALLET_LND),
    mergeMap((payload: InitWallet) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.INITIALIZE_WALLET }));
      return this.httpClient.post(
        this.CHILD_API_URL + environment.WALLET_API + '/wallet/initwallet',
        {
          wallet_password: payload.pwd,
          cipher_seed_mnemonic: payload.cipher ? payload.cipher : '',
          aezeed_passphrase: payload.passphrase ? payload.passphrase : ''
        }
      ).pipe(
        map((postRes) => {
          this.logger.info(postRes);
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.INITIALIZE_WALLET }));
          return {
            type: LNDActions.INIT_WALLET_RESPONSE_LND,
            payload: postRes
          };
        }),
        catchError((err) => {
          this.handleErrorWithAlert('InitWallet', UI_MESSAGES.INITIALIZE_WALLET, 'Wallet Initialization Failed', this.CHILD_API_URL + environment.WALLET_API + '/initwallet', err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  unlockWallet = createEffect(
    () => this.actions.pipe(
      ofType(LNDActions.UNLOCK_WALLET_LND),
      mergeMap((payload: { pwd: string }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.UNLOCK_WALLET }));
        return this.httpClient.post(this.CHILD_API_URL + environment.WALLET_API + '/wallet/unlockwallet', { wallet_password: payload.pwd }).pipe(
          map((postRes) => {
            this.logger.info(postRes);
            this.logger.info('Successfully Unlocked!');
            this.sessionService.setItem('lndUnlocked', 'true');
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.UNLOCK_WALLET }));
            this.store.dispatch(openSpinner({ payload: UI_MESSAGES.WAIT_SYNC_NODE }));
            setTimeout(() => {
              this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.WAIT_SYNC_NODE }));
              this.store.dispatch(fetchInfoLND({ payload: { loadPage: 'HOME' } }));
            }, 5000);
            return { type: RTLActions.VOID };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('UnlockWallet', UI_MESSAGES.UNLOCK_WALLET, 'Unlock Wallet Failed', this.CHILD_API_URL + environment.WALLET_API + '/unlockwallet', err);
            return of({ type: RTLActions.VOID });
          })
        );
      })),
    { dispatch: false }
  );

  peerLookup = createEffect(() => this.actions.pipe(
    ofType(LNDActions.PEER_LOOKUP_LND),
    mergeMap((payload: string) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.SEARCHING_NODE }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/node/' + payload).pipe(
        map((resPeer) => {
          this.logger.info(resPeer);
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.SEARCHING_NODE }));
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_LOOKUP_LND,
            payload: resPeer
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('Lookup', UI_MESSAGES.SEARCHING_NODE, 'Peer Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/node/' + payload, err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  channelLookup = createEffect(() => this.actions.pipe(
    ofType(LNDActions.CHANNEL_LOOKUP_LND),
    mergeMap((payload: ChannelLookup) => {
      this.store.dispatch(openSpinner({ payload: payload.uiMessage }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/edge/' + payload.channelID).pipe(
        map((resChannel) => {
          this.logger.info(resChannel);
          this.store.dispatch(closeSpinner({ payload: payload.uiMessage }));
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_LOOKUP_LND,
            payload: resChannel
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('Lookup', payload.uiMessage, 'Channel Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/edge/' + payload.channelID, err);
          this.store.dispatch(setLookup({ payload: null }));
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  invoiceLookup = createEffect(() => this.actions.pipe(
    ofType(LNDActions.INVOICE_LOOKUP_LND),
    mergeMap((payload: string) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.SEARCHING_INVOICE }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.INVOICES_API + '/' + payload).pipe(
        map((resInvoice) => {
          this.logger.info(resInvoice);
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.SEARCHING_INVOICE }));
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.COMPLETED } }));
          this.store.dispatch(updateInvoice({ payload: resInvoice }));
          return {
            type: LNDActions.SET_LOOKUP_LND,
            payload: resInvoice
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('Lookup', UI_MESSAGES.SEARCHING_INVOICE, 'Invoice Lookup Failed', err);
          this.store.dispatch(openSnackBar({ payload: { message: 'Invoice Refresh Failed.', type: 'ERROR' } }));
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  setLookup = createEffect(
    () => this.actions.pipe(
      ofType(LNDActions.SET_LOOKUP_LND),
      map((payload: any) => {
        this.logger.info(payload);
        return payload;
      })),
    { dispatch: false }
  );

  getRestoreChannelList = createEffect(() => this.actions.pipe(
    ofType(LNDActions.RESTORE_CHANNELS_LIST_LND),
    mergeMap(() => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'RestoreChannelsList', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_BACKUP_API + '/restore/list').pipe(
        map((resRestoreList) => {
          this.logger.info(resRestoreList);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'RestoreChannelsList', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_RESTORE_CHANNELS_LIST_LND,
            payload: (resRestoreList) ? resRestoreList : { all_restore_exists: false, files: [] }
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('RestoreChannelsList', UI_MESSAGES.NO_SPINNER, 'Restore Channels List Failed', this.CHILD_API_URL + environment.CHANNELS_BACKUP_API, err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  setRestoreChannelList = createEffect(
    () => this.actions.pipe(
      ofType(LNDActions.SET_RESTORE_CHANNELS_LIST_LND),
      map((payload: SetRestoreChannelsList) => {
        this.logger.info(payload);
        return payload;
      })),
    { dispatch: false }
  );

  allLightningTransactionsFetch = createEffect(() => this.actions.pipe(
    ofType(LNDActions.GET_ALL_LIGHTNING_TRANSATIONS_LND),
    mergeMap(() => {
      this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchLightningTransactions', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.PAYMENTS_API + '/alltransactions').pipe(
        map((respose: any) => {
          this.logger.info(respose);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchLightningTransactions', status: APICallStatusEnum.COMPLETED } }));
          return {
            type: LNDActions.SET_ALL_LIGHTNING_TRANSATIONS_LND,
            payload: respose
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchLightningTransactions', UI_MESSAGES.NO_SPINNER, 'Fetching All Lightning Transaction Failed.', err);
          return of({ type: RTLActions.VOID });
        })
      );
    }))
  );

  initializeRemainingData(info: any, landingPage: string) {
    this.sessionService.setItem('lndUnlocked', 'true');
    const node_data = {
      identity_pubkey: info.identity_pubkey,
      alias: info.alias,
      testnet: info.testnet,
      chains: info.chains,
      uris: info.uris,
      version: (!info.version) ? '' : info.version.split(' ')[0]
    };
    this.store.dispatch(openSpinner({ payload: UI_MESSAGES.INITALIZE_NODE_DATA }));
    this.store.dispatch(setNodeData({ payload: node_data }));
    let newRoute = this.location.path();
    if (newRoute.includes('/cl/')) {
      newRoute = newRoute.replace('/cl/', '/lnd/');
    } else if (newRoute.includes('/ecl/')) {
      newRoute = newRoute.replace('/ecl/', '/lnd/');
    }
    if (newRoute.includes('/unlock') || newRoute.includes('/login') || newRoute.includes('/error') || newRoute === '' || landingPage === 'HOME' || newRoute.includes('?access-key=')) {
      newRoute = '/lnd/home';
    }
    this.router.navigate([newRoute]);
    this.store.dispatch(fetchFees()); // Fetches monthly forwarding history as well, to count total number of events
    this.store.dispatch(fetchBalance({ payload: 'Blockchain' }));
    this.store.dispatch(fetchAllChannels());
    this.store.dispatch(fetchPendingChannels());
    this.store.dispatch(fetchClosedChannels());
    this.store.dispatch(fetchPeers());
    this.store.dispatch(fetchNetwork());
    this.store.dispatch(getAllLightningTransactions());
    this.store.dispatch(fetchInvoices({ payload: { num_max_invoices: 10, reversed: true } }));
    this.store.dispatch(fetchPayments({ payload: { max_payments: 10, reversed: true } }));
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, genericErrorMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(closeAllDialogs());
      this.store.dispatch(logout());
      this.store.dispatch(openSnackBar({ payload: 'Authentication Failed. Redirecting to Login.' }));
    } else {
      this.store.dispatch(closeSpinner({ payload: uiMessage }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: this.commonService.extractErrorMessage(err, genericErrorMessage) } }));
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
      const errMsg = this.commonService.extractErrorMessage(err);
      this.store.dispatch(openAlert({
        payload: {
          data: {
            type: 'ERROR',
            alertTitle: alertTitle,
            message: { code: err.status, message: errMsg, URL: errURL },
            component: ErrorMessageComponent
          }
        }
      }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: errMsg, URL: errURL } }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
