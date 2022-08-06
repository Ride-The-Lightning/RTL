import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Subject, of } from 'rxjs';
import { map, mergeMap, catchError, takeUntil } from 'rxjs/operators';
import { Location } from '@angular/common';

import { environment, API_URL } from '../../../environments/environment';
import { LoggerService } from '../../shared/services/logger.service';
import { SessionService } from '../../shared/services/session.service';
import { CommonService } from '../../shared/services/common.service';
import { WebSocketClientService } from '../../shared/services/web-socket.service';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { GetInfo, OnChainBalance, Peer, Audit, Transaction, Invoice, Channel, ChannelStateUpdate, SaveChannel, UpdateChannel, CloseChannel, GetQueryRoutes, QueryRoutes, SendPayment, SendPaymentOnChain, CreateInvoice } from '../../shared/models/eclModels';
import { RTLActions, ECLActions, APICallStatusEnum, UI_MESSAGES, ECLWSEventTypeEnum } from '../../shared/services/consts-enums-functions';
import { closeAllDialogs, closeSpinner, logout, openAlert, openSnackBar, openSpinner, setApiUrl, setNodeData } from '../../store/rtl.actions';
import { ECLInvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';

import { RTLState } from '../../store/rtl.state';
import { fetchChannels, fetchFees, fetchInvoices, fetchOnchainBalance, fetchPayments, fetchPeers, sendPaymentStatus, setActiveChannels, setChannelsStatus, setInactiveChannels, setLightningBalance, setPeers, setPendingChannels, setQueryRoutes, updateECLAPICallStatus, updateChannelState, updateInvoice, updateRelayedPayment } from './ecl.actions';
import { allAPIsCallStatus } from './ecl.selector';
import { ApiCallsListECL } from '../../shared/models/apiCallsPayload';

@Injectable()
export class ECLEffects implements OnDestroy {

  CHILD_API_URL = API_URL + '/ecl';
  private flgInitialized = false;
  private flgReceivedPaymentUpdateFromWS = false;
  private latestPaymentRes = '';
  private rawChannelsList: Channel[] = [];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(
    private actions: Actions,
    private httpClient: HttpClient,
    private store: Store<RTLState>,
    private sessionService: SessionService,
    private commonService: CommonService,
    private logger: LoggerService,
    private router: Router,
    private wsService: WebSocketClientService,
    private location: Location
  ) {
    this.store.select(allAPIsCallStatus).pipe(takeUntil(this.unSubs[0])).subscribe((allApisCallStatus: ApiCallsListECL) => {
      if (
        ((allApisCallStatus.FetchInfo.status === APICallStatusEnum.COMPLETED || allApisCallStatus.FetchInfo.status === APICallStatusEnum.ERROR) &&
          (allApisCallStatus.FetchFees.status === APICallStatusEnum.COMPLETED || allApisCallStatus.FetchFees.status === APICallStatusEnum.ERROR) &&
          (allApisCallStatus.FetchOnchainBalance.status === APICallStatusEnum.COMPLETED || allApisCallStatus.FetchOnchainBalance.status === APICallStatusEnum.ERROR) &&
          (allApisCallStatus.FetchChannels.status === APICallStatusEnum.COMPLETED || allApisCallStatus.FetchChannels.status === APICallStatusEnum.ERROR)) &&
        !this.flgInitialized
      ) {
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.INITALIZE_NODE_DATA }));
        this.flgInitialized = true;
      }
    });
    this.wsService.eclWSMessages.pipe(
      takeUntil(this.unSubs[1])).
      subscribe((newMessage) => {
        this.logger.info('Received new message from the service: ' + JSON.stringify(newMessage));
        let snackBarMsg = '';
        if (newMessage) {
          switch (newMessage.type) {
            case ECLWSEventTypeEnum.PAYMENT_SENT:
              if (newMessage && newMessage.id && this.latestPaymentRes === newMessage.id) {
                this.flgReceivedPaymentUpdateFromWS = true;
                snackBarMsg = 'Payment Sent: ' + ((newMessage.paymentHash) ? ('with payment hash ' + newMessage.paymentHash) : JSON.stringify(newMessage));
                this.handleSendPaymentStatus(snackBarMsg);
              }
              break;
            case ECLWSEventTypeEnum.PAYMENT_FAILED:
              if (newMessage && newMessage.id && this.latestPaymentRes === newMessage.id) {
                this.flgReceivedPaymentUpdateFromWS = true;
                snackBarMsg = 'Payment Failed: ' + ((newMessage.failures && newMessage.failures.length && newMessage.failures.length > 0 && newMessage.failures[0].t) ? newMessage.failures[0].t : (newMessage.failures && newMessage.failures.length && newMessage.failures.length > 0 && newMessage.failures[0].e && newMessage.failures[0].e.failureMessage) ? newMessage.failures[0].e.failureMessage : JSON.stringify(newMessage));
                this.handleSendPaymentStatus(snackBarMsg);
              }
              break;
            case ECLWSEventTypeEnum.PAYMENT_RECEIVED:
              this.store.dispatch(updateInvoice({ payload: newMessage }));
              break;
            case ECLWSEventTypeEnum.PAYMENT_RELAYED:
              delete newMessage.source;
              this.store.dispatch(updateRelayedPayment({ payload: newMessage }));
              break;
            case ECLWSEventTypeEnum.CHANNEL_STATE_CHANGED:
              if ((<ChannelStateUpdate>newMessage).currentState === 'NORMAL' || (<ChannelStateUpdate>newMessage).currentState === 'CLOSED') {
                this.rawChannelsList = this.rawChannelsList.map((channel) => {
                  if (channel.channelId === (<ChannelStateUpdate>newMessage).channelId && channel.nodeId === (<ChannelStateUpdate>newMessage).remoteNodeId) {
                    channel.state = (<ChannelStateUpdate>newMessage).currentState;
                  }
                  return channel;
                });
                this.setChannelsAndStatusAndBalances();
              } else {
                this.store.dispatch(updateChannelState({ payload: newMessage }));
              }
              break;
            default:
              this.logger.info('Received Event from WS: ' + JSON.stringify(newMessage));
              break;
          }
        }
      });
  }

  infoFetchECL = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_INFO_ECL),
    mergeMap((action: { type: string, payload: { loadPage: string } }) => {
      this.flgInitialized = false;
      this.store.dispatch(setApiUrl({ payload: this.CHILD_API_URL }));
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_NODE_INFO }));
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchInfo', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<GetInfo>(this.CHILD_API_URL + environment.GETINFO_API).
        pipe(
          takeUntil(this.actions.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
            this.initializeRemainingData(info, action.payload.loadPage);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchInfo', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_NODE_INFO }));
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
    mergeMap(() => {
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchFees', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<Audit>(this.CHILD_API_URL + environment.FEES_API + '/fees').
        pipe(
          map((fees: any) => {
            this.logger.info(fees);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchFees', status: APICallStatusEnum.COMPLETED } }));
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
    mergeMap(() => {
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchPayments', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<Audit>(this.CHILD_API_URL + environment.FEES_API + '/payments').
        pipe(
          map((payments: any) => {
            this.logger.info(payments);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchPayments', status: APICallStatusEnum.COMPLETED } }));
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
    mergeMap((action: { type: string, payload: { fetchPayments: boolean } }) => {
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchChannels', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<Channel[]>(this.CHILD_API_URL + environment.CHANNELS_API).
        pipe(
          map((channelsRes: Channel[]) => {
            this.logger.info(channelsRes);
            this.rawChannelsList = channelsRes;
            this.setChannelsAndStatusAndBalances();
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchChannels', status: APICallStatusEnum.COMPLETED } }));
            if (action.payload && action.payload.fetchPayments) {
              this.store.dispatch(fetchPayments());
            }
            return { type: RTLActions.VOID };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchChannels', UI_MESSAGES.NO_SPINNER, 'Fetching Channels Failed.', err);
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  fetchOnchainBalance = createEffect(() => this.actions.pipe(
    ofType(ECLActions.FETCH_ONCHAIN_BALANCE_ECL),
    mergeMap(() => {
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchOnchainBalance', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<OnChainBalance>(this.CHILD_API_URL + environment.ON_CHAIN_API + '/balance');
    }),
    map((balance) => {
      this.logger.info(balance);
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchOnchainBalance', status: APICallStatusEnum.COMPLETED } }));
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
    mergeMap(() => {
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchPeers', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<Peer[]>(this.CHILD_API_URL + environment.PEERS_API).
        pipe(
          map((peers: Peer[]) => {
            this.logger.info(peers);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchPeers', status: APICallStatusEnum.COMPLETED } }));
            return {
              type: ECLActions.SET_PEERS_ECL,
              payload: peers || []
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
    mergeMap(() => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GENERATE_NEW_ADDRESS }));
      return this.httpClient.get(this.CHILD_API_URL + environment.ON_CHAIN_API).
        pipe(
          map((newAddress: any) => {
            this.logger.info(newAddress);
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GENERATE_NEW_ADDRESS }));
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
      map((action: { type: string, payload: string }) => {
        this.logger.info(action.payload);
        return action.payload;
      })),
    { dispatch: false }
  );

  saveNewPeer = createEffect(() => this.actions.pipe(
    ofType(ECLActions.SAVE_NEW_PEER_ECL),
    mergeMap((action: { type: string, payload: { id: string } }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.CONNECT_PEER }));
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'SaveNewPeer', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post<Peer[]>(this.CHILD_API_URL + environment.PEERS_API + ((action.payload.id.includes('@') ? '?uri=' : '?nodeId=') + action.payload.id), {}).
        pipe(
          map((postRes: Peer[]) => {
            this.logger.info(postRes);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'SaveNewPeer', status: APICallStatusEnum.COMPLETED } }));
            postRes = postRes || [];
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.CONNECT_PEER }));
            this.store.dispatch(setPeers({ payload: postRes }));
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
    mergeMap((action: { type: string, payload: { nodeId: string } }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.DISCONNECT_PEER }));
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.nodeId).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.DISCONNECT_PEER }));
            this.store.dispatch(openSnackBar({ payload: 'Disconnecting Peer!' }));
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
    mergeMap((action: { type: string, payload: SaveChannel }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.OPEN_CHANNEL }));
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'SaveNewChannel', status: APICallStatusEnum.INITIATED } }));
      const reqBody = action.payload.feeRate && action.payload.feeRate > 0 ?
        { nodeId: action.payload.nodeId, fundingSatoshis: action.payload.amount, channelFlags: +!action.payload.private, fundingFeerateSatByte: action.payload.feeRate } :
        { nodeId: action.payload.nodeId, fundingSatoshis: action.payload.amount, channelFlags: +!action.payload.private };
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, reqBody).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'SaveNewChannel', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(fetchPeers());
            this.store.dispatch(fetchOnchainBalance());
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.OPEN_CHANNEL }));
            this.store.dispatch(openSnackBar({ payload: 'Channel Added Successfully!' }));
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
    ofType(ECLActions.UPDATE_CHANNEL_ECL),
    mergeMap((action: { type: string, payload: UpdateChannel }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.UPDATE_CHAN_POLICY }));
      let queryParam = '?feeBaseMsat=' + action.payload.baseFeeMsat + '&feeProportionalMillionths=' + action.payload.feeRate;
      if (action.payload.nodeIds) {
        queryParam = queryParam + '&nodeIds=' + action.payload.nodeIds;
      } else if (action.payload.nodeId) {
        queryParam = queryParam + '&nodeId=' + action.payload.nodeId;
      } else if (action.payload.channelIds) {
        queryParam = queryParam + '&channelIds=' + action.payload.channelIds;
      } else {
        queryParam = queryParam + '&channelId=' + action.payload.channelId;
      }
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/updateRelayFee' + queryParam, {}).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.UPDATE_CHAN_POLICY }));
            if (action.payload.nodeIds || action.payload.channelIds) {
              this.store.dispatch(openSnackBar({ payload: 'Channels Updated Successfully.' }));
            } else {
              this.store.dispatch(openSnackBar({ payload: 'Channel Updated Successfully!' }));
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
    mergeMap((action: { type: string, payload: CloseChannel }) => {
      this.store.dispatch(openSpinner({ payload: ((action.payload.force) ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL) }));
      return this.httpClient.delete(this.CHILD_API_URL + environment.CHANNELS_API + '?channelId=' + action.payload.channelId + '&force=' + action.payload.force).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            setTimeout(() => {
              this.store.dispatch(closeSpinner({ payload: ((action.payload.force) ? UI_MESSAGES.FORCE_CLOSE_CHANNEL : UI_MESSAGES.CLOSE_CHANNEL) }));
              this.store.dispatch(fetchChannels({ payload: { fetchPayments: false } }));
              this.store.dispatch(openSnackBar({ payload: (action.payload.force ? 'Channel Force Closed Successfully!' : 'Channel Closed Successfully!') }));
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
    mergeMap((action: { type: string, payload: GetQueryRoutes }) => this.httpClient.get(this.CHILD_API_URL + environment.PAYMENTS_API + '/route?nodeId=' + action.payload.nodeId + '&amountMsat=' + action.payload.amount).
      pipe(
        map((qrRes: any) => {
          this.logger.info(qrRes);
          return {
            type: ECLActions.SET_QUERY_ROUTES_ECL,
            payload: qrRes
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(setQueryRoutes({ payload: [] }));
          this.handleErrorWithAlert('GetQueryRoutes', UI_MESSAGES.NO_SPINNER, 'Get Query Routes Failed', this.CHILD_API_URL + environment.PAYMENTS_API + '/route?nodeId=' + action.payload.nodeId + '&amountMsat=' + action.payload.amount, err);
          return of({ type: RTLActions.VOID });
        })
      ))
  ));

  setQueryRoutes = createEffect(
    () => this.actions.pipe(
      ofType(ECLActions.SET_QUERY_ROUTES_ECL),
      map((action: { type: string, payload: QueryRoutes[] }) => action.payload)),
    { dispatch: false }
  );

  sendPayment = createEffect(() => this.actions.pipe(
    ofType(ECLActions.SEND_PAYMENT_ECL),
    mergeMap((action: { type: string, payload: SendPayment }) => {
      this.flgReceivedPaymentUpdateFromWS = false;
      this.latestPaymentRes = '';
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.SEND_PAYMENT }));
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'SendPayment', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post(this.CHILD_API_URL + environment.PAYMENTS_API, action.payload).
        pipe(
          map((sendRes: any) => {
            this.logger.info(sendRes);
            this.latestPaymentRes = sendRes;
            setTimeout(() => {
              if (!this.flgReceivedPaymentUpdateFromWS) {
                this.handleSendPaymentStatus('Payment Submitted!');
              }
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
    mergeMap(() => {
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchTransactions', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<Transaction[]>(this.CHILD_API_URL + environment.ON_CHAIN_API + '/transactions?count=1000&skip=0');
    }),
    map((transactions) => {
      this.logger.info(transactions);
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchTransactions', status: APICallStatusEnum.COMPLETED } }));
      return {
        type: ECLActions.SET_TRANSACTIONS_ECL,
        payload: transactions || []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchTransactions', UI_MESSAGES.NO_SPINNER, 'Fetching Transactions Failed.', err);
      return of({ type: RTLActions.VOID });
    })
  ));

  SendOnchainFunds = createEffect(() => this.actions.pipe(
    ofType(ECLActions.SEND_ONCHAIN_FUNDS_ECL),
    mergeMap((action: { type: string, payload: SendPaymentOnChain }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.SEND_FUNDS }));
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'SendOnchainFunds', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post(this.CHILD_API_URL + environment.ON_CHAIN_API, action.payload).
        pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'SendOnchainFunds', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.SEND_FUNDS }));
            this.store.dispatch(fetchOnchainBalance());
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
    mergeMap((action: { type: string, payload: CreateInvoice }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.CREATE_INVOICE }));
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'CreateInvoice', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.post(this.CHILD_API_URL + environment.INVOICES_API, action.payload).
        pipe(
          map((postRes: Invoice) => {
            this.logger.info(postRes);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'CreateInvoice', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.CREATE_INVOICE }));
            postRes.timestamp = Math.round(new Date().getTime() / 1000);
            postRes.expiresAt = Math.round(postRes.timestamp + action.payload.expireIn);
            postRes.description = action.payload.description;
            postRes.status = 'unpaid';
            setTimeout(() => {
              this.store.dispatch(openAlert({
                payload: {
                  data: {
                    invoice: postRes,
                    newlyAdded: true,
                    component: ECLInvoiceInformationComponent
                  }
                }
              }));
            }, 100);
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
    mergeMap(() => {
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchInvoices', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get<Invoice[]>(this.CHILD_API_URL + environment.INVOICES_API).
        pipe(
          map((res: Invoice[]) => {
            this.logger.info(res);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'FetchInvoices', status: APICallStatusEnum.COMPLETED } }));
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
    mergeMap((action: { type: string, payload: string }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.SEARCHING_NODE }));
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/nodes/' + action.payload).
        pipe(
          map((resPeer) => {
            this.logger.info(resPeer);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.SEARCHING_NODE }));
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
    mergeMap((action: { type: string, payload: string }) => {
      this.store.dispatch(openSpinner({ payload: UI_MESSAGES.SEARCHING_INVOICE }));
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.INITIATED } }));
      return this.httpClient.get(this.CHILD_API_URL + environment.INVOICES_API + '/' + action.payload).
        pipe(
          map((resInvoice) => {
            this.logger.info(resInvoice);
            this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'Lookup', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.SEARCHING_INVOICE }));
            this.store.dispatch(updateInvoice({ payload: resInvoice }));
            return {
              type: ECLActions.SET_LOOKUP_ECL,
              payload: resInvoice
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('Lookup', UI_MESSAGES.SEARCHING_INVOICE, 'Invoice Lookup Failed', err);
            this.store.dispatch(openSnackBar({ payload: { message: 'Invoice Refresh Failed.', type: 'ERROR' } }));
            return of({ type: RTLActions.VOID });
          })
        );
    })
  ));

  setLookup = createEffect(
    () => this.actions.pipe(
      ofType(ECLActions.SET_LOOKUP_ECL),
      map((action: { type: string, payload: any }) => {
        this.logger.info(action.payload);
        return action.payload;
      })),
    { dispatch: false }
  );

  setChannelsAndStatusAndBalances() {
    let channelTotal = 0;
    let totalLocalBalance = 0;
    let totalRemoteBalance = 0;
    let lightningBalances = { localBalance: 0, remoteBalance: 0 };
    let activeChannels = [];
    const pendingChannels = [];
    const inactiveChannels = [];
    const channelStatus = { active: { channels: 0, capacity: 0 }, inactive: { channels: 0, capacity: 0 }, pending: { channels: 0, capacity: 0 } };
    this.rawChannelsList.forEach((channel, i) => {
      if (channel) {
        if (channel.state === 'NORMAL') {
          channelTotal = channel.toLocal + channel.toRemote;
          totalLocalBalance = totalLocalBalance + channel.toLocal;
          totalRemoteBalance = totalRemoteBalance + channel.toRemote;
          channel.balancedness = (channelTotal === 0) ? 1 : +(1 - Math.abs((channel.toLocal - channel.toRemote) / channelTotal)).toFixed(3);
          activeChannels.push(channel);
          channelStatus.active.channels = channelStatus.active.channels + 1;
          channelStatus.active.capacity = channelStatus.active.capacity + channel.toLocal;
        } else if (channel.state.includes('WAIT') || channel.state.includes('CLOSING') || channel.state.includes('SYNCING')) {
          channel.state = channel.state.replace(/_/g, ' ');
          pendingChannels.push(channel);
          channelStatus.pending.channels = channelStatus.pending.channels + 1;
          channelStatus.pending.capacity = channelStatus.pending.capacity + channel.toLocal;
        } else {
          channel.state = channel.state.replace(/_/g, ' ');
          inactiveChannels.push(channel);
          channelStatus.inactive.channels = channelStatus.inactive.channels + 1;
          channelStatus.inactive.capacity = channelStatus.inactive.capacity + channel.toLocal;
        }
      }
    });
    lightningBalances = { localBalance: totalLocalBalance, remoteBalance: totalRemoteBalance };
    activeChannels = this.commonService.sortDescByKey(activeChannels, 'balancedness');
    this.logger.info('Active Channels: ' + JSON.stringify(activeChannels));
    this.logger.info('Pending Channels: ' + JSON.stringify(pendingChannels));
    this.logger.info('Inactive Channels: ' + JSON.stringify(inactiveChannels));
    this.logger.info('Lightning Balances: ' + JSON.stringify(lightningBalances));
    this.logger.info('Channels Status: ' + JSON.stringify(channelStatus));
    this.logger.info('Channel, status and balances: ' + JSON.stringify({ active: activeChannels, pending: pendingChannels, inactive: inactiveChannels, balances: lightningBalances, status: channelStatus }));
    this.store.dispatch(setActiveChannels({ payload: activeChannels }));
    this.store.dispatch(setPendingChannels({ payload: pendingChannels }));
    this.store.dispatch(setInactiveChannels({ payload: inactiveChannels }));
    this.store.dispatch(setLightningBalance({ payload: lightningBalances }));
    this.store.dispatch(setChannelsStatus({ payload: channelStatus }));
  }

  handleSendPaymentStatus = (msg: string) => {
    this.store.dispatch(updateECLAPICallStatus({ payload: { action: 'SendPayment', status: APICallStatusEnum.COMPLETED } }));
    this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.SEND_PAYMENT }));
    this.store.dispatch(sendPaymentStatus({ payload: this.latestPaymentRes }));
    this.store.dispatch(fetchChannels({ payload: { fetchPayments: true } }));
    this.store.dispatch(openSnackBar({ payload: msg }));
  };

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
    this.store.dispatch(openSpinner({ payload: UI_MESSAGES.INITALIZE_NODE_DATA }));
    this.store.dispatch(setNodeData({ payload: node_data }));
    let newRoute = this.location.path();
    if (newRoute.includes('/lnd/')) {
      newRoute = newRoute.replace('/lnd/', '/ecl/');
    } else if (newRoute.includes('/cln/')) {
      newRoute = newRoute.replace('/cln/', '/ecl/');
    }
    if (newRoute.includes('/login') || newRoute.includes('/error') || newRoute === '' || landingPage === 'HOME' || newRoute.includes('?access-key=')) {
      newRoute = '/ecl/home';
    }
    this.router.navigate([newRoute]);
    this.store.dispatch(fetchInvoices());
    this.store.dispatch(fetchChannels({ payload: { fetchPayments: true } }));
    this.store.dispatch(fetchFees());
    this.store.dispatch(fetchOnchainBalance());
    this.store.dispatch(fetchPeers());
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
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: this.commonService.extractErrorMessage(err, genericErrorMessage) } }));
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
      this.store.dispatch(updateECLAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: errMsg, URL: errURL } }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
