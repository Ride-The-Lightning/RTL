import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Subject, of } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom, takeUntil } from 'rxjs/operators';
import { Location } from '@angular/common';

import { environment, API_URL } from '../../../environments/environment';
import { LoggerService } from '../../shared/services/logger.service';
import { SessionService } from '../../shared/services/session.service';
import { CommonService } from '../../shared/services/common.service';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { GetInfo, OnChainBalance, ChannelStats, Peer, Audit, Transaction, Invoice, GetChannelsRes } from '../../shared/models/eclModels';
import { APICallStatusEnum, UI_MESSAGES } from '../../shared/services/consts-enums-functions';
import { ECLInvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';

import * as fromRTLReducer from '../../store/rtl.reducers';
import * as fromECLReducer from './ecl.reducers';
import * as ECLActions from './ecl.actions';
import * as RTLActions from '../../store/rtl.actions';

@Injectable()
export class ECLEffects implements OnDestroy {

  CHILD_API_URL = API_URL + '/ecl';
  private flgInitialized = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions: Actions,
    private httpClient: HttpClient,
    private store: Store<fromRTLReducer.RTLState>,
    private sessionService: SessionService,
    private commonService: CommonService,
    private logger: LoggerService,
    private router: Router,
    private location: Location
  ) {
    this.store.select('ecl').
      pipe(takeUntil(this.unSubs[0])).
      subscribe((rtlStore) => {
        if (
          ((rtlStore.apisCallStatus.FetchInfo.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchInfo.status === APICallStatusEnum.ERROR) &&
          (rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.ERROR) &&
          (rtlStore.apisCallStatus.FetchOnchainBalance.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchOnchainBalance.status === APICallStatusEnum.ERROR) &&
          (rtlStore.apisCallStatus.FetchChannels.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchChannels.status === APICallStatusEnum.ERROR)) &&
          !this.flgInitialized
        ) {
          this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.INITALIZE_NODE_DATA));
          this.flgInitialized = true;
        }
      });
  }

  infoFetchECL = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_INFO_ECL),
    mergeMap((action: ECLActions.FetchInfo) => {
      this.flgInitialized = false;
      this.store.dispatch(new RTLActions.SetApiUrl(this.CHILD_API_URL));
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_NODE_INFO));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchInfo', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get<GetInfo>(this.CHILD_API_URL + environment.GETINFO_API).
        pipe(
          takeUntil(this.actions.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
            this.initializeRemainingData(info, action.payload.loadPage);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchInfo', status: APICallStatusEnum.COMPLETED }));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_NODE_INFO));
            return {
              type: ECLActions.SET_INFO_ECL,
              payload: info ? info : {}
            };
          }),
          catchError((err) => {
            const code = this.commonService.extractErrorCode(err);
            const msg = (code === 503) ? 'Unable to Connect to Eclair Server.' : this.commonService.extractErrorMessage(err);
            this.router.navigate(['/error'], { state: { errorCode: code, errorMessage: msg } });
            this.handleErrorWithoutAlert('FetchInfo', UI_MESSAGES.GET_NODE_INFO, 'Fetching Node Info Failed.', { status: code, error: msg });
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  fetchFees = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_FEES_ECL),
    mergeMap((action: ECLActions.FetchFees) => {
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchFees', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get<Audit>(this.CHILD_API_URL + environment.FEES_API + '/fees').
        pipe(
          map((fees: any) => {
            this.logger.info(fees);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchFees', status: APICallStatusEnum.COMPLETED }));
            return {
              type: ECLActions.SET_FEES_ECL,
              payload: fees ? fees : {}
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchFees', UI_MESSAGES.NO_SPINNER, 'Fetching Fees Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  fetchPayments = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_PAYMENTS_ECL),
    mergeMap((action: ECLActions.FetchPayments) => {
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchPayments', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get<Audit>(this.CHILD_API_URL + environment.FEES_API + '/payments').
        pipe(
          map((payments: any) => {
            this.logger.info(payments);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchPayments', status: APICallStatusEnum.COMPLETED }));
            return {
              type: ECLActions.SET_PAYMENTS_ECL,
              payload: payments ? payments : {}
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchPayments', UI_MESSAGES.NO_SPINNER, 'Fetching Payments Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  channelsFetch = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_CHANNELS_ECL),
    mergeMap((action: ECLActions.FetchChannels) => {
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchChannels', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get<GetChannelsRes>(this.CHILD_API_URL + environment.CHANNELS_API).
        pipe(
          map((channelsRes: GetChannelsRes) => {
            this.logger.info(channelsRes);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchChannels', status: APICallStatusEnum.COMPLETED }));
            this.store.dispatch(new ECLActions.SetActiveChannels((channelsRes && channelsRes.activeChannels.length > 0) ? channelsRes.activeChannels : []));
            this.store.dispatch(new ECLActions.SetPendingChannels((channelsRes && channelsRes.pendingChannels.length > 0) ? channelsRes.pendingChannels : []));
            this.store.dispatch(new ECLActions.SetInactiveChannels((channelsRes && channelsRes.inactiveChannels.length > 0) ? channelsRes.inactiveChannels : []));
            this.store.dispatch(new ECLActions.SetLightningBalance(channelsRes.lightningBalances));
            if (action.payload && action.payload.fetchPayments) {
              this.store.dispatch(new ECLActions.FetchPayments());
            }
            return {
              type: ECLActions.SET_CHANNELS_STATUS_ECL,
              payload: channelsRes.channelStatus
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchChannels', UI_MESSAGES.NO_SPINNER, 'Fetching Channels Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  channelStatsFetch = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_CHANNEL_STATS_ECL),
    mergeMap((action: ECLActions.FetchChannelStats) => {
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchChannelStats', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get<ChannelStats[]>(this.CHILD_API_URL + environment.CHANNELS_API + '/stats').
        pipe(
          map((channelStats: ChannelStats[]) => {
            this.logger.info(channelStats);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchChannelStats', status: APICallStatusEnum.COMPLETED }));
            return {
              type: ECLActions.SET_CHANNEL_STATS_ECL,
              payload: (channelStats && channelStats.length > 0) ? channelStats : []
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchChannelStats', UI_MESSAGES.NO_SPINNER, 'Fetching Channel Stats Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  fetchOnchainBalance = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_ONCHAIN_BALANCE_ECL),
    mergeMap((action: ECLActions.FetchOnchainBalance) => {
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchOnchainBalance', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get<OnChainBalance>(this.CHILD_API_URL + environment.ON_CHAIN_API + '/balance');
    }),
    map((balance) => {
      this.logger.info(balance);
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchOnchainBalance', status: APICallStatusEnum.COMPLETED }));
      return {
        type: ECLActions.SET_ONCHAIN_BALANCE_ECL,
        payload: balance ? balance : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchOnchainBalance', UI_MESSAGES.NO_SPINNER, 'Fetching Onchain Balances Failed.', err);
      return of({ type: RTLActions.VOID });
    })
  ));

  peersFetch = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_PEERS_ECL),
    mergeMap((action: ECLActions.FetchPeers) => {
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchPeers', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get<Peer[]>(this.CHILD_API_URL + environment.PEERS_API).
        pipe(
          map((peers: Peer[]) => {
            this.logger.info(peers);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchPeers', status: APICallStatusEnum.COMPLETED }));
            return {
              type: ECLActions.SET_PEERS_ECL,
              payload: peers && peers.length ? peers : []
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchPeers', UI_MESSAGES.NO_SPINNER, 'Fetching Peers Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  getNewAddress = createEffect(() => this.actions.pipe(
    ofType(ECLActions.GET_NEW_ADDRESS_ECL),
    mergeMap((action: ECLActions.GetNewAddress) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GENERATE_NEW_ADDRESS));
      return this.httpClient.get(this.CHILD_API_URL + environment.ON_CHAIN_API).
        pipe(
          map((newAddress: any) => {
            this.logger.info(newAddress);
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GENERATE_NEW_ADDRESS));
            return {
              type: ECLActions.SET_NEW_ADDRESS_ECL,
              payload: newAddress
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('GetNewAddress', UI_MESSAGES.GENERATE_NEW_ADDRESS, 'Generate New Address Failed', this.CHILD_API_URL + environment.ON_CHAIN_API, err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  setNewAddress = createEffect(
    () => this.actions.pipe(
      ofType(ECLActions.SET_NEW_ADDRESS_ECL),
      map((action: ECLActions.SetNewAddress) => {
        this.logger.info(action.payload);
        return action.payload;
      })),
    { dispatch: false }
  );

  saveNewPeer = createEffect(() => this.actions.pipe(
    ofType(ECLActions.SAVE_NEW_PEER_ECL),
    withLatestFrom(this.store.select('ecl')),
    mergeMap(([action, eclData]: [ECLActions.SaveNewPeer, fromECLReducer.ECLState]) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.CONNECT_PEER));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'SaveNewPeer', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.post<Peer[]>(this.CHILD_API_URL + environment.PEERS_API + ((action.payload.id.includes('@') ? '?uri=' : '?nodeId=') + action.payload.id), {}).
        pipe(
          map((postRes: Peer[]) => {
            this.logger.info(postRes);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'SaveNewPeer', status: APICallStatusEnum.COMPLETED }));
            postRes = (postRes && postRes.length) ? postRes : [];
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.CONNECT_PEER));
            this.store.dispatch(new ECLActions.SetPeers(postRes));
            return {
              type: ECLActions.NEWLY_ADDED_PEER_ECL,
              payload: { peer: postRes.find((peer) => peer.nodeId === (action.payload.id.includes('@') ? action.payload.id.substring(0, action.payload.id.indexOf('@')) : action.payload.id)) }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewPeer', UI_MESSAGES.CONNECT_PEER, 'Peer Connection Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  detachPeer = createEffect(() => this.actions.pipe(
    ofType(ECLActions.DETACH_PEER_ECL),
    mergeMap((action: ECLActions.DisconnectPeer) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.DISCONNECT_PEER));
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.nodeId).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.DISCONNECT_PEER));
            this.store.dispatch(new RTLActions.OpenSnackBar('Disconnecting Peer!'));
            return {
              type: ECLActions.REMOVE_PEER_ECL,
              payload: { nodeId: action.payload.nodeId }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('DisconnectPeer', UI_MESSAGES.DISCONNECT_PEER, 'Unable to Detach Peer. Try again later.', this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.nodeId, err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  openNewChannel = createEffect(() => this.actions.pipe(
    ofType(ECLActions.SAVE_NEW_CHANNEL_ECL),
    mergeMap((action: ECLActions.SaveNewChannel) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.OPEN_CHANNEL));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'SaveNewChannel', status: APICallStatusEnum.INITIATED }));
      const reqBody = action.payload.feeRate && action.payload.feeRate > 0 ?
        { nodeId: action.payload.nodeId, fundingSatoshis: action.payload.amount, channelFlags: +!action.payload.private, fundingFeerateSatByte: action.payload.feeRate } :
        { nodeId: action.payload.nodeId, fundingSatoshis: action.payload.amount, channelFlags: +!action.payload.private };
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, reqBody).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'SaveNewChannel', status: APICallStatusEnum.COMPLETED }));
            this.store.dispatch(new ECLActions.FetchPeers());
            this.store.dispatch(new ECLActions.FetchOnchainBalance());
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.OPEN_CHANNEL));
            this.store.dispatch(new RTLActions.OpenSnackBar('Channel Added Successfully!'));
            return {
              type: ECLActions.FETCH_CHANNELS_ECL,
              payload: { fetchPayments: false }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewChannel', UI_MESSAGES.OPEN_CHANNEL, 'Opening Channel Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  updateChannel = createEffect(() => this.actions.pipe(
    ofType(ECLActions.UPDATE_CHANNELS_ECL),
    mergeMap((action: ECLActions.UpdateChannels) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.UPDATE_CHAN_POLICY));
      let queryParam = '?feeBaseMsat=' + action.payload.baseFeeMsat + '&feeProportionalMillionths=' + action.payload.feeRate;
      if (action.payload.channelIds) {
        queryParam = queryParam + '&channelIds=' + action.payload.channelIds;
      } else {
        queryParam = queryParam + '&channelId=' + action.payload.channelId;
      }
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/updateRelayFee' + queryParam, {}).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.UPDATE_CHAN_POLICY));
            if (action.payload.channelIds) {
              this.store.dispatch(new RTLActions.OpenSnackBar('Channels Updated Successfully.'));
            } else {
              this.store.dispatch(new RTLActions.OpenSnackBar('Channel Updated Successfully!'));
            }
            return {
              type: ECLActions.FETCH_CHANNELS_ECL,
              payload: { fetchPayments: false }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('UpdateChannels', UI_MESSAGES.UPDATE_CHAN_POLICY, 'Update Channel Failed', this.CHILD_API_URL + environment.CHANNELS_API, err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  closeChannel = createEffect(() => this.actions.pipe(
    ofType(ECLActions.CLOSE_CHANNEL_ECL),
    mergeMap((action: ECLActions.CloseChannel) => {
      this.store.dispatch(new RTLActions.OpenSpinner((action.payload.force) ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL));
      return this.httpClient.delete(this.CHILD_API_URL + environment.CHANNELS_API + '?channelId=' + action.payload.channelId + '&force=' + action.payload.force).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            setTimeout(() => {
              this.store.dispatch(new RTLActions.CloseSpinner((action.payload.force) ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL));
              this.store.dispatch(new ECLActions.FetchChannels({ fetchPayments: false }));
              this.store.dispatch(new RTLActions.OpenSnackBar(action.payload.force ? 'Channel Force Closed Successfully!' : 'Channel Closed Successfully!'));
            }, 2000);
            return {
              type: RTLActions.VOID
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('CloseChannel', ((action.payload.force) ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL), 'Unable to Close Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_API, err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  queryRoutesFetch = createEffect(() => this.actions.pipe(
    ofType(ECLActions.GET_QUERY_ROUTES_ECL),
    mergeMap((action: ECLActions.GetQueryRoutes) => this.httpClient.get(this.CHILD_API_URL + environment.PAYMENTS_API + '/route?nodeId=' + action.payload.nodeId + '&amountMsat=' + action.payload.amount).
      pipe(
        map((qrRes: any) => {
          this.logger.info(qrRes);
          return {
            type: ECLActions.SET_QUERY_ROUTES_ECL,
            payload: qrRes
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new ECLActions.SetQueryRoutes([]));
          this.handleErrorWithAlert('GetQueryRoutes', UI_MESSAGES.NO_SPINNER, 'Get Query Routes Failed', this.CHILD_API_URL + environment.PAYMENTS_API + '/route?nodeId=' + action.payload.nodeId + '&amountMsat=' + action.payload.amount, err);
          return of({ type: RTLActions.VOID });
        })
      ))
  ));

  setQueryRoutes = createEffect(
    () => this.actions.pipe(
      ofType(ECLActions.SET_QUERY_ROUTES_ECL),
      map((action: ECLActions.SetQueryRoutes) => action.payload)),
    { dispatch: false }
  );

  sendPayment = createEffect(() => this.actions.pipe(
    ofType(ECLActions.SEND_PAYMENT_ECL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [ECLActions.SendPayment, any]) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.SEND_PAYMENT));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'SendPayment', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.post(this.CHILD_API_URL + environment.PAYMENTS_API, action.payload).
        pipe(
          map((sendRes: any) => {
            this.logger.info(sendRes);
            setTimeout(() => {
              this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'SendPayment', status: APICallStatusEnum.COMPLETED }));
              this.store.dispatch(new ECLActions.SendPaymentStatus(sendRes));
              this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.SEND_PAYMENT));
              this.store.dispatch(new ECLActions.FetchChannels({ fetchPayments: true }));
              this.store.dispatch(new ECLActions.FetchPayments());
              this.store.dispatch(new RTLActions.OpenSnackBar('Payment Submitted!'));
            }, 3000);
            return { type: RTLActions.VOID };
          }),
          catchError((err: any) => {
            this.logger.error('Error: ' + JSON.stringify(err));
            if (action.payload.fromDialog) {
              this.handleErrorWithoutAlert('SendPayment', UI_MESSAGES.SEND_PAYMENT, 'Send Payment Failed.', err);
            } else {
              this.handleErrorWithAlert('SendPayment', UI_MESSAGES.SEND_PAYMENT, 'Send Payment Failed', this.CHILD_API_URL + environment.PAYMENTS_API, err);
            }
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  transactionsFetch = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_TRANSACTIONS_ECL),
    mergeMap((action: ECLActions.FetchTransactions) => {
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchTransactions', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get<Transaction[]>(this.CHILD_API_URL + environment.ON_CHAIN_API + '/transactions?count=1000&skip=0');
    }),
    map((transactions) => {
      this.logger.info(transactions);
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchTransactions', status: APICallStatusEnum.COMPLETED }));
      return {
        type: ECLActions.SET_TRANSACTIONS_ECL,
        payload: (transactions && transactions.length > 0) ? transactions : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchTransactions', UI_MESSAGES.NO_SPINNER, 'Fetching Transactions Failed.', err);
      return of({ type: RTLActions.VOID });
    })
  ));

  SendOnchainFunds = createEffect(() => this.actions.pipe(
    ofType(ECLActions.SEND_ONCHAIN_FUNDS_ECL),
    mergeMap((action: ECLActions.SendOnchainFunds) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.SEND_FUNDS));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'SendOnchainFunds', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.post(this.CHILD_API_URL + environment.ON_CHAIN_API, action.payload).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'SendOnchainFunds', status: APICallStatusEnum.COMPLETED }));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.SEND_FUNDS));
            this.store.dispatch(new ECLActions.FetchOnchainBalance());
            return {
              type: ECLActions.SEND_ONCHAIN_FUNDS_RES_ECL,
              payload: postRes
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SendOnchainFunds', UI_MESSAGES.SEND_FUNDS, 'Sending Fund Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  createInvoice = createEffect(() => this.actions.pipe(
    ofType(ECLActions.CREATE_INVOICE_ECL),
    mergeMap((action: ECLActions.CreateInvoice) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.CREATE_INVOICE));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'CreateInvoice', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.post(this.CHILD_API_URL + environment.INVOICES_API, action.payload).
        pipe(
          map((postRes: Invoice) => {
            this.logger.info(postRes);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'CreateInvoice', status: APICallStatusEnum.COMPLETED }));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.CREATE_INVOICE));
            postRes.timestamp = new Date().getTime() / 1000;
            postRes.expiresAt = Math.round(postRes.timestamp + action.payload.expireIn);
            postRes.description = action.payload.description;
            postRes.status = 'unpaid';
            this.store.dispatch(new RTLActions.OpenAlert({
              data: {
                invoice: postRes,
                newlyAdded: false,
                component: ECLInvoiceInformationComponent
              }
            }));
            return {
              type: ECLActions.ADD_INVOICE_ECL,
              payload: postRes
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('CreateInvoice', UI_MESSAGES.CREATE_INVOICE, 'Create Invoice Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  invoicesFetch = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_INVOICES_ECL),
    mergeMap((action: ECLActions.FetchInvoices) => {
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchInvoices', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get<Invoice[]>(this.CHILD_API_URL + environment.INVOICES_API).
        pipe(
          map((res: Invoice[]) => {
            this.logger.info(res);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'FetchInvoices', status: APICallStatusEnum.COMPLETED }));
            return {
              type: ECLActions.SET_INVOICES_ECL,
              payload: res
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchInvoices', UI_MESSAGES.NO_SPINNER, 'Fetching Invoices Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  peerLookup = createEffect(() => this.actions.pipe(
    ofType(ECLActions.PEER_LOOKUP_ECL),
    mergeMap((action: ECLActions.PeerLookup) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.SEARCHING_NODE));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'Lookup', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/nodes/' + action.payload).
        pipe(
          map((resPeer) => {
            this.logger.info(resPeer);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'Lookup', status: APICallStatusEnum.COMPLETED }));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.SEARCHING_NODE));
            return {
              type: ECLActions.SET_LOOKUP_ECL,
              payload: resPeer
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('Lookup', UI_MESSAGES.SEARCHING_NODE, 'Peer Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/nodes/' + action.payload, err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  invoiceLookup = createEffect(() => this.actions.pipe(
    ofType(ECLActions.INVOICE_LOOKUP_ECL),
    mergeMap((action: ECLActions.InvoiceLookup) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.SEARCHING_INVOICE));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'Lookup', status: APICallStatusEnum.INITIATED }));
      return this.httpClient.get(this.CHILD_API_URL + environment.INVOICES_API + '/' + action.payload).
        pipe(
          map((resInvoice) => {
            this.logger.info(resInvoice);
            this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: 'Lookup', status: APICallStatusEnum.COMPLETED }));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.SEARCHING_INVOICE));
            this.store.dispatch(new ECLActions.UpdateInvoice(resInvoice));
            return {
              type: ECLActions.SET_LOOKUP_ECL,
              payload: resInvoice
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('Lookup', UI_MESSAGES.SEARCHING_INVOICE, 'Invoice Lookup Failed', err);
            this.store.dispatch(new RTLActions.OpenSnackBar({ message: 'Invoice Refresh Failed.', type: 'ERROR' }));
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  setLookup = createEffect(
    () => this.actions.pipe(
      ofType(ECLActions.SET_LOOKUP_ECL),
      map((action: ECLActions.SetLookup) => {
        this.logger.info(action.payload);
        return action.payload;
      })),
    { dispatch: false }
  );

  initializeRemainingData(info: any, landingPage: string) {
    this.sessionService.setItem('eclUnlocked', 'true');
    const node_data = {
      identity_pubkey: info.nodeId,
      alias: info.alias,
      testnet: info.network === 'testnet',
      chains: info.publicAddresses,
      uris: info.uris,
      version: info.version,
      numberOfPendingChannels: 0
    };
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.INITALIZE_NODE_DATA));
    this.store.dispatch(new RTLActions.SetNodeData(node_data));
    this.store.dispatch(new ECLActions.FetchInvoices());
    this.store.dispatch(new ECLActions.FetchChannels({ fetchPayments: true }));
    this.store.dispatch(new ECLActions.FetchFees());
    this.store.dispatch(new ECLActions.FetchOnchainBalance());
    this.store.dispatch(new ECLActions.FetchPeers());
    let newRoute = this.location.path();
    if (newRoute.includes('/lnd/')) {
      newRoute = newRoute.replace('/lnd/', '/ecl/');
    } else if (newRoute.includes('/cl/')) {
      newRoute = newRoute.replace('/cl/', '/ecl/');
    }
    if (newRoute.includes('/login') || newRoute.includes('/error') || newRoute === '' || landingPage === 'HOME' || newRoute.includes('?access-key=')) {
      newRoute = '/ecl/home';
    }
    this.router.navigate([newRoute]);
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, genericErrorMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner(uiMessage));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: this.commonService.extractErrorMessage(err, genericErrorMessage) }));
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
      const errMsg = this.commonService.extractErrorMessage(err);
      this.store.dispatch(new RTLActions.OpenAlert({
        data: {
          type: 'ERROR',
          alertTitle: alertTitle,
          message: { code: err.status, message: errMsg, URL: errURL },
          component: ErrorMessageComponent
        }
      }));
      this.store.dispatch(new ECLActions.UpdateAPICallStatus({ action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: errMsg, URL: errURL }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
