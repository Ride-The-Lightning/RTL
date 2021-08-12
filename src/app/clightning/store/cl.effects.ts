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
import { CommonService } from '../../shared/services/common.service';
import { SessionService } from '../../shared/services/session.service';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { CLInvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';
import { GetInfo, Fees, Balance, LocalRemoteBalance, Payment, FeeRates, ListInvoices, Invoice, Peer } from '../../shared/models/clModels';
import { AlertTypeEnum, APICallStatusEnum, UI_MESSAGES } from '../../shared/services/consts-enums-functions';

import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';
import * as CLActions from './cl.actions';
import * as fromCLReducers from '../store/cl.reducers';

@Injectable()
export class CLEffects implements OnDestroy {
  CHILD_API_URL = API_URL + '/cl';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions: Actions,
    private httpClient: HttpClient,
    private store: Store<fromRTLReducer.RTLState>,
    private sessionService: SessionService,
    private commonService: CommonService,
    private logger: LoggerService,
    private router: Router,
    private location: Location) { 
      this.store.select('cl')
      .pipe(takeUntil(this.unSubs[0]))
      .subscribe((rtlStore) => {
        if (
          (rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.ERROR) &&
          (rtlStore.apisCallStatus.FetchChannels.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchChannels.status === APICallStatusEnum.ERROR) &&
          (rtlStore.apisCallStatus.FetchBalance.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchBalance.status === APICallStatusEnum.ERROR) &&
          (rtlStore.apisCallStatus.FetchLocalRemoteBalance.status === APICallStatusEnum.COMPLETED || rtlStore.apisCallStatus.FetchLocalRemoteBalance.status === APICallStatusEnum.ERROR)
        ) {
          this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.INITALIZE_NODE_DATA));
        }
      });
    }

  infoFetchCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_INFO_CL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [CLActions.FetchInfo, fromRTLReducer.RootState]) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchInfo', status: APICallStatusEnum.INITIATED}));
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_NODE_INFO));
      return this.httpClient.get<GetInfo>(this.CHILD_API_URL + environment.GETINFO_API)
        .pipe(
          takeUntil(this.actions.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
            this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchInfo', status: APICallStatusEnum.COMPLETED}));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_NODE_INFO));
            if (info.chains && info.chains.length && info.chains[0]
              && (typeof info.chains[0] === 'object' && info.chains[0].hasOwnProperty('chain') && info.chains[0].chain.toLowerCase().indexOf('bitcoin') < 0)
            ) {
              this.store.dispatch(new RTLActions.CloseAllDialogs());
              this.store.dispatch(new RTLActions.OpenAlert({ data: {
                type: AlertTypeEnum.ERROR,
                alertTitle: 'Shitcoin Found',
                titleMessage: 'Sorry Not Sorry, RTL is Bitcoin Only!'
              }}));
              return {
                type: RTLActions.LOGOUT
              };
            } else {
              this.initializeRemainingData(info, action.payload.loadPage);
              return {
                type: CLActions.SET_INFO_CL,
                payload: info ? info : {}
              };
            }
          }),
          catchError((err) => {
            const code = this.commonService.extractErrorCode(err);
            const msg = (code === 'ETIMEDOUT') ? 'Unable to Connect to C-Lightning Server.' : this.commonService.extractErrorMessage(err);
            this.router.navigate(['/error'], { state: { errorCode: code, errorMessage: msg}});
            this.handleErrorWithoutAlert('FetchInfo', UI_MESSAGES.GET_NODE_INFO, 'Fetching Node Info Failed.', {status: code, error: msg});
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  fetchFeesCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_FEES_CL),
    mergeMap((action: CLActions.FetchFees) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchFees', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get<Fees>(this.CHILD_API_URL + environment.FEES_API);
    }),
    map((fees) => {
      this.logger.info(fees);
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchFees', status: APICallStatusEnum.COMPLETED}));
      return {
        type: CLActions.SET_FEES_CL,
        payload: fees ? fees : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchFees', UI_MESSAGES.NO_SPINNER, 'Fetching Fees Failed.', err);
      return of({type: RTLActions.VOID});
    }))
  );

  fetchFeeRatesCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_FEE_RATES_CL),
    mergeMap((action: CLActions.FetchFeeRates) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchFeeRates' + action.payload, status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get<FeeRates>(this.CHILD_API_URL + environment.NETWORK_API + '/feeRates/' + action.payload)
      .pipe(map((feeRates) => {
        this.logger.info(feeRates);
        this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchFeeRates' + action.payload, status: APICallStatusEnum.COMPLETED}));
        return {
          type: CLActions.SET_FEE_RATES_CL,
          payload: feeRates ? feeRates : {}
        };
      }),
      catchError((err: any) => {
        this.handleErrorWithoutAlert('FetchFeeRates' + action.payload, UI_MESSAGES.NO_SPINNER, 'Fetching Fee Rates Failed.', err);
        return of({type: RTLActions.VOID});
      }));
    }))
  );

  fetchBalanceCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_BALANCE_CL),
    mergeMap((action: CLActions.FetchBalance) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchBalance', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get<Balance>(this.CHILD_API_URL + environment.BALANCE_API);
    }),
    map((balance) => {
      this.logger.info(balance);
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchBalance', status: APICallStatusEnum.COMPLETED}));      
      return {
        type: CLActions.SET_BALANCE_CL,
        payload: balance ? balance : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchBalance', UI_MESSAGES.NO_SPINNER, 'Fetching Balances Failed.', err);
      return of({type: RTLActions.VOID});
    }))
  );

  fetchLocalRemoteBalanceCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_LOCAL_REMOTE_BALANCE_CL),
    mergeMap((action: CLActions.FetchLocalRemoteBalance) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchLocalRemoteBalance', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get<LocalRemoteBalance>(this.CHILD_API_URL + environment.CHANNELS_API + '/localremotebalance');
    }),
    map((lrBalance) => {
      this.logger.info(lrBalance);
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchLocalRemoteBalance', status: APICallStatusEnum.COMPLETED}));
      return {
        type: CLActions.SET_LOCAL_REMOTE_BALANCE_CL,
        payload: lrBalance ? lrBalance : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchLocalRemoteBalance', UI_MESSAGES.NO_SPINNER, 'Fetching Balances Failed.', err);
      return of({type: RTLActions.VOID});
    }))
  );

  getNewAddressCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.GET_NEW_ADDRESS_CL),
    mergeMap((action: CLActions.GetNewAddress) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GENERATE_NEW_ADDRESS));
      return this.httpClient.get(this.CHILD_API_URL + environment.ON_CHAIN_API + '?type=' + action.payload.addressCode)
        .pipe(map((newAddress: any) => {
          this.logger.info(newAddress);
          this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GENERATE_NEW_ADDRESS));
          return {
            type: CLActions.SET_NEW_ADDRESS_CL,
            payload: (newAddress && newAddress.address) ? newAddress.address : {}
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('GenerateNewAddress', UI_MESSAGES.GENERATE_NEW_ADDRESS, 'Generate New Address Failed', this.CHILD_API_URL + environment.ON_CHAIN_API + '?type=' + action.payload.addressId, err);
          return of({type: RTLActions.VOID});
        }));
    }))
  );

  setNewAddressCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.SET_NEW_ADDRESS_CL),
    map((action: CLActions.SetNewAddress) => {
      this.logger.info(action.payload);
      return action.payload;
    })),
    { dispatch: false }
  );

  peersFetchCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_PEERS_CL),
    mergeMap((action: CLActions.FetchPeers) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchPeers', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(this.CHILD_API_URL + environment.PEERS_API)
        .pipe(
          map((peers: any) => {
            this.logger.info(peers);
            this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchPeers', status: APICallStatusEnum.COMPLETED}));
            return {
              type: CLActions.SET_PEERS_CL,
              payload: peers ? peers : []
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchPeers', UI_MESSAGES.NO_SPINNER, 'Fetching Peers Failed.', err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  saveNewPeerCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.SAVE_NEW_PEER_CL),
    withLatestFrom(this.store.select('cl')),
    mergeMap(([action, clData]: [CLActions.SaveNewPeer, fromCLReducers.CLState]) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.CONNECT_PEER));
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SaveNewPeer', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.post(this.CHILD_API_URL + environment.PEERS_API, { id: action.payload.id })
        .pipe(
          map((postRes: Peer[]) => {
            this.logger.info(postRes);
            this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SaveNewPeer', status: APICallStatusEnum.COMPLETED}));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.CONNECT_PEER));
            this.store.dispatch(new CLActions.SetPeers((postRes && postRes.length > 0) ? postRes : []));
            return {
              type: CLActions.NEWLY_ADDED_PEER_CL,
              payload: {peer: postRes.find(peer => action.payload.id.indexOf(peer.id) === 0)}
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewPeer', UI_MESSAGES.CONNECT_PEER, 'Peer Connection Failed.', err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  detachPeerCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.DETACH_PEER_CL),
    mergeMap((action: CLActions.DetachPeer) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.DISCONNECT_PEER));
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.id + '?force=' + action.payload.force)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.DISCONNECT_PEER));
            this.store.dispatch(new RTLActions.OpenSnackBar('Peer Disconnected Successfully!'));
            return {
              type: CLActions.REMOVE_PEER_CL,
              payload: { id: action.payload.id }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('PeerDisconnect', UI_MESSAGES.DISCONNECT_PEER, 'Unable to Detach Peer. Try again later.', this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.id, err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  channelsFetchCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_CHANNELS_CL),
    mergeMap((action: CLActions.FetchChannels) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchChannels', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/listChannels');
    }),
    map((channels: any) => {
      this.logger.info(channels);
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchChannels', status: APICallStatusEnum.COMPLETED}));
      this.store.dispatch(new CLActions.GetForwardingHistory());
      return {
        type: CLActions.SET_CHANNELS_CL,
        payload: (channels && channels.length > 0) ? channels : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchChannels', UI_MESSAGES.NO_SPINNER, 'Fetching Channels Failed.', err);
      return of({type: RTLActions.VOID});
    }))
  );

  openNewChannelCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.SAVE_NEW_CHANNEL_CL),
    mergeMap((action: CLActions.SaveNewChannel) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.OPEN_CHANNEL));
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SaveNewChannel', status: APICallStatusEnum.INITIATED}));
      let newPayload = {id: action.payload.peerId, satoshis: action.payload.satoshis, feeRate: action.payload.feeRate, announce: action.payload.announce, minconf: (action.payload.minconf) ? action.payload.minconf : null};
      if (action.payload.utxos) { newPayload['utxos'] = action.payload.utxos; }
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, newPayload)
      .pipe(map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SaveNewChannel', status: APICallStatusEnum.COMPLETED}));
        this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.OPEN_CHANNEL));
        this.store.dispatch(new RTLActions.OpenSnackBar('Channel Added Successfully!'));
        this.store.dispatch(new CLActions.FetchBalance());
        this.store.dispatch(new CLActions.FetchUTXOs());
        return {
          type: CLActions.FETCH_CHANNELS_CL
        };
      }),
      catchError((err: any) => {
        this.handleErrorWithoutAlert('SaveNewChannel', UI_MESSAGES.OPEN_CHANNEL, 'Opening Channel Failed.', err);
        return of({type: RTLActions.VOID});
      }));
    }))
  );

  updateChannelCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.UPDATE_CHANNELS_CL),
    mergeMap((action: CLActions.UpdateChannels) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.UPDATE_CHAN_POLICY));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/setChannelFee',
        { id: action.payload.channelId, base: action.payload.baseFeeMsat, ppm: action.payload.feeRate })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.UPDATE_CHAN_POLICY));
            if(action.payload.channelId === 'all') {
              this.store.dispatch(new RTLActions.OpenSnackBar({message:'All Channels Updated Successfully. Fee policy updates may take some time to reflect on the channel.', duration: 5000}));
            } else {
              this.store.dispatch(new RTLActions.OpenSnackBar({message:'Channel Updated Successfully. Fee policy updates may take some time to reflect on the channel.', duration: 5000}));
            }
            return {
              type: CLActions.FETCH_CHANNELS_CL
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('UpdateChannel', UI_MESSAGES.UPDATE_CHAN_POLICY, 'Update Channel Failed', this.CHILD_API_URL + environment.CHANNELS_API, err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  closeChannelCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.CLOSE_CHANNEL_CL),
    mergeMap((action: CLActions.CloseChannel) => {
      this.store.dispatch(new RTLActions.OpenSpinner(action.payload.force ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL));
      const queryParam = action.payload.force ? '?force=' + action.payload.force : '';
      return this.httpClient.delete(this.CHILD_API_URL + environment.CHANNELS_API + '/' + action.payload.channelId + queryParam)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner(action.payload.force ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL));
            this.store.dispatch(new CLActions.FetchChannels());
            this.store.dispatch(new RTLActions.OpenSnackBar('Channel Closed Successfully!'));
            return {
              type: CLActions.REMOVE_CHANNEL_CL,
              payload: { channelId: action.payload.channelId }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('CloseChannel', (action.payload.force ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL), 'Unable to Close Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_API, err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  paymentsFetchCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_PAYMENTS_CL),
    mergeMap((action: CLActions.FetchPayments) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchPayments', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get<Payment[]>(this.CHILD_API_URL + environment.PAYMENTS_API);
    }),
    map((payments) => {
      this.logger.info(payments);
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchPayments', status: APICallStatusEnum.COMPLETED}));
      return {
        type: CLActions.SET_PAYMENTS_CL,
        payload: payments ? payments : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchPayments', UI_MESSAGES.NO_SPINNER, 'Fetching Payments Failed.', err);
      return of({type: RTLActions.VOID});
    }))
  );

  decodePaymentCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.DECODE_PAYMENT_CL),
    mergeMap((action: CLActions.DecodePayment) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.DECODE_PAYMENT));
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'DecodePayment', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(this.CHILD_API_URL + environment.PAYMENTS_API + '/' + action.payload.routeParam)
        .pipe(
          map((decodedPayment) => {
            this.logger.info(decodedPayment);
            this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'DecodePayment', status: APICallStatusEnum.COMPLETED}));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.DECODE_PAYMENT));
            return {
              type: CLActions.SET_DECODED_PAYMENT_CL,
              payload: decodedPayment ? decodedPayment : {}
            };
          }),
          catchError((err: any) => {
            if (action.payload.fromDialog) {
              this.handleErrorWithoutAlert('DecodePayment', UI_MESSAGES.DECODE_PAYMENT, 'Decode Payment Failed.', err);
            } else {
              this.handleErrorWithAlert('DecodePayment', UI_MESSAGES.DECODE_PAYMENT, 'Decode Payment Failed', this.CHILD_API_URL + environment.PAYMENTS_API + '/' + action.payload, err);
            }
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  setDecodedPaymentCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.SET_DECODED_PAYMENT_CL),
    map((action: CLActions.SetDecodedPayment) => {
      this.logger.info(action.payload);
      return action.payload;
    })),
    { dispatch: false }
  );

  sendPaymentCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.SEND_PAYMENT_CL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [CLActions.SendPayment, any]) => {
      this.store.dispatch(new RTLActions.OpenSpinner(action.payload.uiMessage));
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SendPayment', status: APICallStatusEnum.INITIATED}));
      let paymentUrl = (action.payload.pubkey && action.payload.pubkey !== '') ? this.CHILD_API_URL + environment.PAYMENTS_API + '/keysend' : this.CHILD_API_URL + environment.PAYMENTS_API + '/invoice';
      return this.httpClient.post(paymentUrl, action.payload).pipe(
        map((sendRes: any) => {
          this.logger.info(sendRes);
          this.store.dispatch(new RTLActions.CloseSpinner(action.payload.uiMessage));
          this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SendPayment', status: APICallStatusEnum.COMPLETED}));
          this.store.dispatch(new RTLActions.OpenSnackBar('Payment Sent Successfully!'));
          this.store.dispatch(new CLActions.FetchChannels());
          this.store.dispatch(new CLActions.FetchBalance());
          this.store.dispatch(new CLActions.FetchPayments());
          this.store.dispatch(new CLActions.SetDecodedPayment({}));
          return {
            type: CLActions.SEND_PAYMENT_STATUS_CL,
            payload: sendRes
          };
        }),
        catchError((err: any) => {
          this.logger.error('Error: ' + JSON.stringify(err));
          if (action.payload.fromDialog) {
            this.handleErrorWithoutAlert('SendPayment', action.payload.uiMessage, 'Send Payment Failed.', err);
          } else {
            this.handleErrorWithAlert('SendPayment', action.payload.uiMessage, 'Send Payment Failed', this.CHILD_API_URL + environment.PAYMENTS_API, err);
          }
          return of({type: RTLActions.VOID});
        }));
    }))
  );

  queryRoutesFetchCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.GET_QUERY_ROUTES_CL),
    mergeMap((action: CLActions.GetQueryRoutes) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'GetQueryRoutes', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/getRoute/' + action.payload.destPubkey + '/' + action.payload.amount)
        .pipe(
          map((qrRes: any) => {
            this.logger.info(qrRes);
            this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'GetQueryRoutes', status: APICallStatusEnum.COMPLETED}));
            return {
              type: CLActions.SET_QUERY_ROUTES_CL,
              payload: qrRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new CLActions.SetQueryRoutes({ routes: [] }));
            this.handleErrorWithAlert('GetQueryRoutes', UI_MESSAGES.NO_SPINNER, 'Get Query Routes Failed', this.CHILD_API_URL + environment.NETWORK_API + '/getRoute/' + action.payload.destPubkey + '/' + action.payload.amount, err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  setQueryRoutesCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.SET_QUERY_ROUTES_CL),
    map((action: CLActions.SetQueryRoutes) => {
      return action.payload;
    })),
    { dispatch: false }
  );

  peerLookupCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.PEER_LOOKUP_CL),
    mergeMap((action: CLActions.PeerLookup) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.SEARCHING_NODE));
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'Lookup', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/listNode/' + action.payload)
        .pipe(
          map((resPeer) => {
            this.logger.info(resPeer);
            this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'Lookup', status: APICallStatusEnum.COMPLETED}));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.SEARCHING_NODE));
            return {
              type: CLActions.SET_LOOKUP_CL,
              payload: resPeer
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('Lookup', UI_MESSAGES.SEARCHING_NODE, 'Peer Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/listNode/' + action.payload, err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  channelLookupCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.CHANNEL_LOOKUP_CL),
    mergeMap((action: CLActions.ChannelLookup) => {
      this.store.dispatch(new RTLActions.OpenSpinner(action.payload.uiMessage));
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'Lookup', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/listChannel/' + action.payload.shortChannelID)
        .pipe(
          map((resChannel) => {
            this.logger.info(resChannel);
            this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'Lookup', status: APICallStatusEnum.COMPLETED}));
            this.store.dispatch(new RTLActions.CloseSpinner(action.payload.uiMessage));
            return {
              type: CLActions.SET_LOOKUP_CL,
              payload: resChannel
            };
          }),
          catchError((err: any) => {
            if(action.payload.showError) {
              this.handleErrorWithAlert('Lookup', action.payload.uiMessage, 'Channel Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/listChannel/' + action.payload.shortChannelID, err);
            } else {
              this.store.dispatch(new RTLActions.CloseSpinner(action.payload.uiMessage));
            }
            this.store.dispatch(new CLActions.SetLookup([]));
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  setLookupCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.SET_LOOKUP_CL),
    map((action: CLActions.SetLookup) => {
      this.logger.info(action.payload);
      return action.payload;
    })),
    { dispatch: false }
  );

  fetchForwardingHistoryCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.GET_FORWARDING_HISTORY_CL),
    mergeMap((action: CLActions.GetForwardingHistory) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'GetForwardingHistory', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/listForwards')
        .pipe(
          map((fhRes: any) => {
            this.logger.info(fhRes);
            this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'GetForwardingHistory', status: APICallStatusEnum.COMPLETED}));
            return {
              type: CLActions.SET_FORWARDING_HISTORY_CL,
              payload: fhRes
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('GetForwardingHistory', UI_MESSAGES.NO_SPINNER, 'Get Forwarding History Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/listForwards', err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  deleteExpiredInvoiceCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.DELETE_EXPIRED_INVOICE_CL),
    mergeMap((action: CLActions.DeleteExpiredInvoice) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.DELETE_INVOICE));
      const queryStr = (action.payload) ?  '?maxexpiry=' + action.payload : '';
      return this.httpClient.delete(this.CHILD_API_URL + environment.INVOICES_API + queryStr)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.DELETE_INVOICE));
            this.store.dispatch(new RTLActions.OpenSnackBar('Invoices Deleted Successfully!'));
            return {
              type: CLActions.FETCH_INVOICES_CL,
              payload: { num_max_invoices: 1000000, reversed: true }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('DeleteInvoices', UI_MESSAGES.DELETE_INVOICE, 'Delete Invoice Failed', this.CHILD_API_URL + environment.INVOICES_API, err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  saveNewInvoiceCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.SAVE_NEW_INVOICE_CL),
    mergeMap((action: CLActions.SaveNewInvoice) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.ADD_INVOICE));
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SaveNewInvoice', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.post(this.CHILD_API_URL + environment.INVOICES_API, {
        label: action.payload.label, amount: action.payload.amount, description: action.payload.description, expiry: action.payload.expiry, private: action.payload.private
      })
      .pipe(
          map((postRes: Invoice) => {
            this.logger.info(postRes);
            this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SaveNewInvoice', status: APICallStatusEnum.COMPLETED}));
            this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.ADD_INVOICE));
            postRes.msatoshi = action.payload.amount;
            postRes.label = action.payload.label;
            postRes.expires_at = Math.round((new Date().getTime() / 1000) + action.payload.expiry);
            postRes.description = action.payload.description;
            postRes.status = 'unpaid';
            this.store.dispatch(new RTLActions.OpenAlert({ data: { 
                invoice: postRes,
                newlyAdded: false,
                component: CLInvoiceInformationComponent
            }}));
            return {
              type: CLActions.ADD_INVOICE_CL,
              payload: postRes
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewInvoice', UI_MESSAGES.ADD_INVOICE, 'Add Invoice Failed.', err);
            return of({type: RTLActions.VOID});
        }));
    }))
  );

  invoicesFetchCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_INVOICES_CL),
    mergeMap((action: CLActions.FetchInvoices) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchInvoices', status: APICallStatusEnum.INITIATED}));
      const num_max_invoices = (action.payload.num_max_invoices) ? action.payload.num_max_invoices : 1000000;
      const index_offset = (action.payload.index_offset) ? action.payload.index_offset : 0;
      const reversed = (action.payload.reversed) ? action.payload.reversed : true;
      return this.httpClient.get<ListInvoices>(this.CHILD_API_URL + environment.INVOICES_API + '?num_max_invoices=' + num_max_invoices + '&index_offset=' + index_offset + '&reversed=' + reversed)
        .pipe(map((res: ListInvoices) => {
          this.logger.info(res);
          this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchInvoices', status: APICallStatusEnum.COMPLETED}));
          return {
            type: CLActions.SET_INVOICES_CL,
            payload: res
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchInvoices', UI_MESSAGES.NO_SPINNER, 'Fetching Invoices Failed.', err);
          return of({type: RTLActions.VOID});
        }));
    }))
  );

  SetChannelTransactionCL = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.SET_CHANNEL_TRANSACTION_CL),
    mergeMap((action: CLActions.SetChannelTransaction) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.SEND_FUNDS));
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SetChannelTransaction', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.post(this.CHILD_API_URL + environment.ON_CHAIN_API, action.payload)
      .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'SetChannelTransaction', status: APICallStatusEnum.COMPLETED}));
        this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.SEND_FUNDS));
        this.store.dispatch(new CLActions.FetchBalance());
        this.store.dispatch(new CLActions.FetchUTXOs());
        return {
          type: CLActions.SET_CHANNEL_TRANSACTION_RES_CL,
          payload: postRes
        };
      }),
      catchError((err: any) => {
        this.handleErrorWithoutAlert('SetChannelTransaction', UI_MESSAGES.SEND_FUNDS, 'Sending Fund Failed.', err);
        return of({type: RTLActions.VOID});
      }));
    }))
  );

  utxosFetch = createEffect(() => 
    this.actions.pipe(
    ofType(CLActions.FETCH_UTXOS_CL),
    mergeMap((action: CLActions.FetchUTXOs) => {
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchUTXOs', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(this.CHILD_API_URL + environment.ON_CHAIN_API + '/utxos');
    }),
    map((utxos: any) => {
      this.logger.info(utxos);
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: 'FetchUTXOs', status: APICallStatusEnum.COMPLETED}));
      return {
        type: CLActions.SET_UTXOS_CL,
        payload: (utxos && utxos.outputs && utxos.outputs.length > 0) ? utxos.outputs : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchUTXOs', UI_MESSAGES.NO_SPINNER, 'Fetching UTXOs Failed.', err);
      return of({type: RTLActions.VOID});
    }))
  );

  initializeRemainingData(info: any, landingPage: string) {
    this.sessionService.setItem('clUnlocked', 'true');
    const node_data = {
      identity_pubkey: info.id,
      alias: info.alias,
      testnet: (info.network.toLowerCase() === 'testnet') ? true : false,
      chains: info.chains,
      uris: info.uris,      
      version: info.version,
      api_version: info.api_version,
      numberOfPendingChannels: info.num_pending_channels
    };
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.INITALIZE_NODE_DATA));
    this.store.dispatch(new RTLActions.SetNodeData(node_data));
    this.store.dispatch(new CLActions.FetchInvoices({num_max_invoices: 1000000, index_offset: 0, reversed: true}));
    this.store.dispatch(new CLActions.FetchFees());
    this.store.dispatch(new CLActions.FetchChannels());
    this.store.dispatch(new CLActions.FetchBalance());
    this.store.dispatch(new CLActions.FetchLocalRemoteBalance());
    this.store.dispatch(new CLActions.FetchFeeRates('perkw'));
    this.store.dispatch(new CLActions.FetchFeeRates('perkb'));
    this.store.dispatch(new CLActions.FetchPeers());
    this.store.dispatch(new CLActions.FetchUTXOs());
    this.store.dispatch(new CLActions.FetchPayments());
    let newRoute = this.location.path();
    if(newRoute.includes('/lnd/')) {
      newRoute = newRoute.replace('/lnd/', '/cl/');
    } else if (newRoute.includes('/ecl/')) {
      newRoute = newRoute.replace('/ecl/', '/cl/');
    }
    if (newRoute.includes('/login') || newRoute.includes('/error') || newRoute === '' || landingPage === 'HOME' || newRoute.includes('?access-key=')) {
      newRoute = '/cl/home';
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
      const errMsg = this.commonService.extractErrorMessage(err, genericErrorMessage);
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: errMsg}));
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
      this.store.dispatch(new CLActions.UpdateAPICallStatus({action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: errMsg, URL: errURL}));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
