import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Subject, of } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom, takeUntil } from 'rxjs/operators';
import { Location } from '@angular/common';

import { environment, API_URL } from '../../../environments/environment';
import { LoggerService } from '../../shared/services/logger.service';
import { SessionService } from '../../shared/services/session.service';
import { CommonService } from '../../shared/services/common.service';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { GetInfo, Channel, OnChainBalance, LightningBalance, ChannelsStatus, ChannelStats, Peer, Audit, Transaction, Invoice } from '../../shared/models/eclrModels';
import * as fromRTLReducer from '../../store/rtl.reducers';
import * as fromECLRReducer from './eclr.reducers';
import * as ECLRActions from './eclr.actions';
import * as RTLActions from '../../store/rtl.actions';
import { ECLRInvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';

@Injectable()
export class ECLREffects implements OnDestroy {
  CHILD_API_URL = API_URL + '/eclr';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<fromRTLReducer.RTLState>,
    private sessionService: SessionService,
    private logger: LoggerService,
    private commonService: CommonService,
    private router: Router,
    private location: Location) { }

  @Effect()
  infoFetchECLR = this.actions$.pipe(
    ofType(ECLRActions.FETCH_INFO_ECLR),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [ECLRActions.FetchInfo, fromRTLReducer.RootState]) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('FetchInfo'));
      return this.httpClient.get<GetInfo>(this.CHILD_API_URL + environment.GETINFO_API)
        .pipe(
          takeUntil(this.actions$.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
            this.initializeRemainingData(info, action.payload.loadPage);
            return {
              type: ECLRActions.SET_INFO_ECLR,
              payload: info ? info : {}
            };
          }),
          catchError((err) => {
            const code = (err.error && err.error.error && err.error.error.message && err.error.error.message.code) ? err.error.error.message.code : (err.error && err.error.error && err.error.error.code) ? err.error.error.code : err.status ? err.status : '';
            const message = ((err.error && err.error.message) ? err.error.message + ' ' : '') + ((err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error && err.error.error && err.error.error.errno && typeof err.error.error.errno === 'string') ? err.error.error.errno : (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error : (err.error && typeof err.error === 'string') ? err.error : 'Unknown Error');
            this.router.navigate(['/error'], { state: { errorCode: code, errorMessage: message }});
            this.handleErrorWithoutAlert('FetchInfo', 'Fetching Node Info Failed.', err);            
            return of({type: RTLActions.VOID});
          })
        );
    }
  ));

  @Effect()
  fetchAudit = this.actions$.pipe(
    ofType(ECLRActions.FETCH_AUDIT_ECLR),
    mergeMap((action: ECLRActions.FetchAudit) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('FetchAudit'));
      return this.httpClient.get<Audit>(this.CHILD_API_URL + environment.FEES_API);
    }),
    map((audit: Audit) => {
      this.logger.info(audit);
      this.store.dispatch(new ECLRActions.SetPayments(audit.payments));
      return {
        type: ECLRActions.SET_FEES_ECLR,
        payload: audit && audit.fees ? audit.fees : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchAudit', 'Fetching Fees Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  channelsFetch = this.actions$.pipe(
    ofType(ECLRActions.FETCH_CHANNELS_ECLR),
    mergeMap((action: ECLRActions.FetchChannels) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('FetchChannels'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API)
        .pipe(map((channelsRes: {activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalances: LightningBalance, channelStatus: ChannelsStatus}) => {
          this.logger.info(channelsRes);
          this.store.dispatch(new ECLRActions.SetActiveChannels((channelsRes && channelsRes.activeChannels.length > 0) ? channelsRes.activeChannels : []));
          this.store.dispatch(new ECLRActions.SetPendingChannels((channelsRes && channelsRes.pendingChannels.length > 0) ? channelsRes.pendingChannels : []));
          this.store.dispatch(new ECLRActions.SetInactiveChannels((channelsRes && channelsRes.inactiveChannels.length > 0) ? channelsRes.inactiveChannels : []));
          this.store.dispatch(new ECLRActions.SetLightningBalance(channelsRes.lightningBalances));
          return {
            type: ECLRActions.SET_CHANNELS_STATUS_ECLR,
            payload: channelsRes.channelStatus
          };
        },
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchChannels', 'Fetching Channels Failed.', err);
          return of({type: RTLActions.VOID});
        })
      ));
    }
  ));

  @Effect()
  channelStatsFetch = this.actions$.pipe(
    ofType(ECLRActions.FETCH_CHANNEL_STATS_ECLR),
    mergeMap((action: ECLRActions.FetchChannelStats) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('FetchChannelStats'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/stats')
        .pipe(map((channelStats: ChannelStats[]) => {
          this.logger.info(channelStats);
          return {
            type: ECLRActions.SET_CHANNEL_STATS_ECLR,
            payload: (channelStats && channelStats.length > 0) ? channelStats : []
          };
        },
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchChannelStats', 'Fetching Channel Stats Failed.', err);
          return of({type: RTLActions.VOID});
        })
      ));
    }
  ));

  @Effect()
  fetchOnchainBalance = this.actions$.pipe(
    ofType(ECLRActions.FETCH_ONCHAIN_BALANCE_ECLR),
    mergeMap((action: ECLRActions.FetchOnchainBalance) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('FetchOnchainBalance'));
      return this.httpClient.get<OnChainBalance>(this.CHILD_API_URL + environment.ON_CHAIN_API + '/balance');
    }),
    map((balance) => {
      this.logger.info(balance);
      return {
        type: ECLRActions.SET_ONCHAIN_BALANCE_ECLR,
        payload: balance ? balance : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchOnchainBalance', 'Fetching Onchain Balances Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  peersFetch = this.actions$.pipe(
    ofType(ECLRActions.FETCH_PEERS_ECLR),
    mergeMap((action: ECLRActions.FetchPeers) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('FetchPeers'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PEERS_API)
        .pipe(
          map((peers: Peer[]) => {
            this.logger.info(peers);
            return {
              type: ECLRActions.SET_PEERS_ECLR ,
              payload: peers && peers.length ? peers : []
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
  getNewAddress = this.actions$.pipe(
    ofType(ECLRActions.GET_NEW_ADDRESS_ECLR),
    mergeMap((action: ECLRActions.GetNewAddress) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.ON_CHAIN_API)
        .pipe(map((newAddress: any) => {
          this.logger.info(newAddress);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: ECLRActions.SET_NEW_ADDRESS_ECLR,
            payload: newAddress
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('ERROR', 'Generate New Address Failed', this.CHILD_API_URL + environment.ON_CHAIN_API, err);
          return of({type: RTLActions.VOID});
        }));
    })
  );

  @Effect({ dispatch: false })
  setNewAddress = this.actions$.pipe(
    ofType(ECLRActions.SET_NEW_ADDRESS_ECLR),
    map((action: ECLRActions.SetNewAddress) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  saveNewPeer = this.actions$.pipe(
    ofType(ECLRActions.SAVE_NEW_PEER_ECLR),
    withLatestFrom(this.store.select('eclr')),
    mergeMap(([action, eclrData]: [ECLRActions.SaveNewPeer, fromECLRReducer.ECLRState]) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('SaveNewPeer'));
      return this.httpClient.post(this.CHILD_API_URL + environment.PEERS_API + ((action.payload.id.includes('@') ? '?uri=' : '?nodeId=') + action.payload.id), {})
        .pipe(
          map((postRes: Peer[]) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new ECLRActions.SetPeers((postRes && postRes.length) ? (postRes.filter(peer => peer.state !== 'DISCONNECTED')) : []));
            return {
              type: ECLRActions.NEWLY_ADDED_PEER_ECLR,
              payload: { peer: postRes[0] }
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
    ofType(ECLRActions.DETACH_PEER_ECLR),
    mergeMap((action: ECLRActions.DisconnectPeer) => {
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.nodeId)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Disconnecting Peer!'));
            return {
              type: ECLRActions.REMOVE_PEER_ECLR,
              payload: { nodeId: action.payload.nodeId }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('ERROR', 'Unable to Detach Peer. Try again later.', this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.nodeId, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
  ));

  @Effect()
  openNewChannel = this.actions$.pipe(
    ofType(ECLRActions.SAVE_NEW_CHANNEL_ECLR),
    mergeMap((action: ECLRActions.SaveNewChannel) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('SaveNewChannel'));
      const reqBody = action.payload.feeRate && action.payload.feeRate > 0 ? 
          { nodeId: action.payload.nodeId, fundingSatoshis: action.payload.amount, channelFlags: +!action.payload.private, fundingFeerateSatByte: action.payload.feeRate }
        : { nodeId: action.payload.nodeId, fundingSatoshis: action.payload.amount, channelFlags: +!action.payload.private}
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, reqBody)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new ECLRActions.FetchPeers());
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Channel Added Successfully!'));
            return {
              type: ECLRActions.FETCH_CHANNELS_ECLR
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
    ofType(ECLRActions.UPDATE_CHANNELS_ECLR),
    mergeMap((action: ECLRActions.UpdateChannels) => {
      let queryParam = '?feeBaseMsat=' + action.payload.baseFeeMsat + '&feeProportionalMillionths=' + action.payload.feeRate;
      if (action.payload.channelIds) {
        queryParam = queryParam + '&channelIds=' + action.payload.channelIds;
      } else {
        queryParam = queryParam + '&channelId=' + action.payload.channelId;        
      }
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/updateRelayFee' + queryParam, {})
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            if(action.payload.channelIds) {
              this.store.dispatch(new RTLActions.OpenSnackBar('Channels Updated Successfully.'));
            } else {
              this.store.dispatch(new RTLActions.OpenSnackBar('Channel Updated Successfully!'));
            }
            return {
              type: ECLRActions.FETCH_CHANNELS_ECLR
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('ERROR', 'Update Channel Failed', this.CHILD_API_URL + environment.CHANNELS_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
  ));

  @Effect()
  closeChannel = this.actions$.pipe(
    ofType(ECLRActions.CLOSE_CHANNEL_ECLR),
    mergeMap((action: ECLRActions.CloseChannel) => {
      return this.httpClient.delete(this.CHILD_API_URL + environment.CHANNELS_API + '?channelId=' + action.payload.channelId + '&force=' + action.payload.force)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            setTimeout(() => {
              this.store.dispatch(new RTLActions.CloseSpinner());
              this.store.dispatch(new ECLRActions.FetchChannels());
              this.store.dispatch(new RTLActions.OpenSnackBar('Channel Closed Successfully!'));
            }, 2000);
            return {
              type: RTLActions.VOID
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('ERROR', 'Unable to Close Channel. Try again later.', this.CHILD_API_URL + environment.CHANNELS_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
  ));

  @Effect()
  queryRoutesFetch = this.actions$.pipe(
    ofType(ECLRActions.GET_QUERY_ROUTES_ECLR),
    mergeMap((action: ECLRActions.GetQueryRoutes) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.PAYMENTS_API + '/route?nodeId=' + action.payload.nodeId + '&amountMsat=' + action.payload.amount)
        .pipe(
          map((qrRes: any) => {
            this.logger.info(qrRes);
            return {
              type: ECLRActions.SET_QUERY_ROUTES_ECLR,
              payload: qrRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new ECLRActions.SetQueryRoutes([]));
            this.handleErrorWithAlert('ERROR', 'Get Query Routes Failed', this.CHILD_API_URL + environment.PAYMENTS_API + '/route?nodeId=' + action.payload.nodeId + '&amountMsat=' + action.payload.amount, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect({ dispatch: false })
  setQueryRoutes = this.actions$.pipe(
    ofType(ECLRActions.SET_QUERY_ROUTES_ECLR),
    map((action: ECLRActions.SetQueryRoutes) => {
      return action.payload;
    })
  );

  @Effect()
  decodePayment = this.actions$.pipe(
    ofType(ECLRActions.DECODE_PAYMENT_ECLR),
    mergeMap((action: ECLRActions.DecodePayment) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('DecodePayment'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PAYMENTS_API + '/' + action.payload.routeParam)
        .pipe(
          map((decodedPayment) => {
            this.logger.info(decodedPayment);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: ECLRActions.SET_DECODED_PAYMENT_ECLR,
              payload: decodedPayment ? decodedPayment : {}
            };
          }),
          catchError((err: any) => {
            if (action.payload.fromDialog) {
              this.handleErrorWithoutAlert('DecodePayment', 'Decode Payment Failed.', err);
            } else {
              this.handleErrorWithAlert('ERROR', 'Decode Payment Failed', this.CHILD_API_URL + environment.PAYMENTS_API + '/' + action.payload.routeParam, err);
            }
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setDecodedPayment = this.actions$.pipe(
    ofType(ECLRActions.SET_DECODED_PAYMENT_ECLR),
    map((action: ECLRActions.SetDecodedPayment) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  sendPayment = this.actions$.pipe(
    ofType(ECLRActions.SEND_PAYMENT_ECLR),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [ECLRActions.SendPayment, any]) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('SendPayment'));      
      return this.httpClient.post(this.CHILD_API_URL + environment.PAYMENTS_API, action.payload)
        .pipe(
          map((sendRes: any) => {
            this.logger.info(sendRes);
            if (sendRes.error) {
              this.store.dispatch(new RTLActions.CloseSpinner());
              this.logger.error('Error: ' + sendRes.payment_error);
              const myErr = {status: sendRes.payment_error.status, error: sendRes.payment_error.error && sendRes.payment_error.error.error && typeof(sendRes.payment_error.error.error) === 'object' ? sendRes.payment_error.error.error : {error: sendRes.payment_error.error && sendRes.payment_error.error.error ? sendRes.payment_error.error.error : 'Unknown Error'}};
              if (action.payload.fromDialog) {
                this.handleErrorWithoutAlert('SendPayment', 'Send Payment Failed.', myErr);
              } else {
                this.handleErrorWithAlert('ERROR', 'Send Payment Failed', this.CHILD_API_URL + environment.PAYMENTS_API, myErr);
              }
              return of({type: RTLActions.VOID});
            } else {
              setTimeout(() => {
                this.store.dispatch(new ECLRActions.SendPaymentStatus(sendRes));
                this.store.dispatch(new RTLActions.CloseSpinner());
                this.store.dispatch(new ECLRActions.FetchChannels());
                this.store.dispatch(new ECLRActions.SetDecodedPayment({}));
                this.store.dispatch(new ECLRActions.FetchAudit());
                this.store.dispatch(new RTLActions.OpenSnackBar('Payment Sent Successfully!'));
              }, 3000);
              return { type: RTLActions.VOID };
            }
          }),
          catchError((err: any) => {
            this.logger.error('Error: ' + JSON.stringify(err));
            const myErr = {status: err.status, error: err.error && err.error.error && typeof(err.error.error) === 'object' ? err.error.error : {error: err.error && err.error.error ? err.error.error : 'Unknown Error'}};
            if (action.payload.fromDialog) {
              this.handleErrorWithoutAlert('SendPayment', 'Send Payment Failed.', myErr);
            } else {
              this.handleErrorWithAlert('ERROR', 'Send Payment Failed', this.CHILD_API_URL + environment.PAYMENTS_API, myErr);
            }
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  transactionsFetch = this.actions$.pipe(
    ofType(ECLRActions.FETCH_TRANSACTIONS_ECLR),
    mergeMap((action: ECLRActions.FetchTransactions) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('FetchTransactions'));
      return this.httpClient.get<Transaction[]>(this.CHILD_API_URL + environment.ON_CHAIN_API + '/transactions?count=1000&skip=0');
    }),
    map((transactions) => {
      this.logger.info(transactions);
      return {
        type: ECLRActions.SET_TRANSACTIONS_ECLR,
        payload: (transactions && transactions.length > 0) ? transactions : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchTransactions', 'Fetching Transactions Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  SendOnchainFunds = this.actions$.pipe(
    ofType(ECLRActions.SEND_ONCHAIN_FUNDS_ECLR),
    mergeMap((action: ECLRActions.SendOnchainFunds) => {
      this.store.dispatch(new ECLRActions.ClearEffectError('SendOnchainFunds'));
      return this.httpClient.post(this.CHILD_API_URL + environment.ON_CHAIN_API, action.payload)
      .pipe(map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.store.dispatch(new ECLRActions.FetchOnchainBalance());
        return {
          type: ECLRActions.SEND_ONCHAIN_FUNDS_RES_ECLR,
          payload: postRes
        };
      }),
      catchError((err: any) => {
        this.handleErrorWithoutAlert('SendOnchainFunds', 'Sending Fund Failed.', err);
        return of({type: RTLActions.VOID});
      }));
    })
  );

  @Effect()
  createInvoice = this.actions$.pipe(
  ofType(ECLRActions.CREATE_INVOICE_ECLR),
  mergeMap((action: ECLRActions.CreateInvoice) => {
    this.store.dispatch(new ECLRActions.ClearEffectError('CreateInvoice'));
    return this.httpClient.post(this.CHILD_API_URL + environment.INVOICES_API, action.payload)
      .pipe(map((postRes: Invoice) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          postRes.amount = action.payload.amountMsat;
          postRes.timestamp = new Date().getTime() / 1000;
          postRes.timestampStr = this.commonService.convertTimestampToDate(+postRes.timestamp);
          postRes.expiresAt = Math.round(postRes.timestamp + action.payload.expireIn);
          postRes.expiresAtStr = this.commonService.convertTimestampToDate(+postRes.expiresAt);
          postRes.description = action.payload.description;
          postRes.status = 'unpaid';
          this.store.dispatch(new RTLActions.OpenAlert({ data: { 
              invoice: postRes,
              newlyAdded: false,
              component: ECLRInvoiceInformationComponent
          }}));
          return {
            type: ECLRActions.FETCH_INVOICES_ECLR
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('CreateInvoice', 'Create Invoice Failed.', err);
          return of({type: RTLActions.VOID});
        })
      );
  }
  ));

  @Effect()
  invoicesFetch = this.actions$.pipe(
  ofType(ECLRActions.FETCH_INVOICES_ECLR),
  mergeMap((action: ECLRActions.FetchInvoices) => {
    this.store.dispatch(new ECLRActions.ClearEffectError('FetchInvoices'));
    return this.httpClient.get<Invoice[]>(this.CHILD_API_URL + environment.INVOICES_API)
      .pipe(map((res: Invoice[]) => {
        this.logger.info(res);
        return {
          type: ECLRActions.SET_INVOICES_ECLR,
          payload: res
        };
      }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchInvoices', 'Fetching Invoices Failed.', err);
          return of({type: RTLActions.VOID});
        }
      ));
  }));

  initializeRemainingData(info: any, landingPage: string) {
    this.sessionService.setItem('eclrUnlocked', 'true');
    const node_data = {
      identity_pubkey: info.nodeId,
      alias: info.alias,
      testnet: false,
      chains: info.publicAddresses,
      uris: info.uris,      
      version: info.version,
      currency_unit: 'BTC',
      smaller_currency_unit: 'Sats',
      numberOfPendingChannels: 0
    };
    this.store.dispatch(new RTLActions.SetNodeData(node_data));
    this.store.dispatch(new ECLRActions.FetchAudit());
    this.store.dispatch(new ECLRActions.FetchChannels());
    this.store.dispatch(new ECLRActions.FetchOnchainBalance());
    this.store.dispatch(new ECLRActions.FetchPeers());
    let newRoute = this.location.path();
    if(newRoute.includes('/lnd/')) {
      newRoute = newRoute.replace('/lnd/', '/eclr/');
    } else if (newRoute.includes('/cl/')) {
      newRoute = newRoute.replace('/cl/', '/eclr/');
    }
    if (newRoute.includes('/login') || newRoute.includes('/error') || newRoute === '' || landingPage === 'HOME' || newRoute.includes('?access-key=')) {
      newRoute = '/eclr/home';
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
      this.store.dispatch(new ECLRActions.EffectError({ action: actionName, code: err.status.toString(), message: (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error : genericErrorMessage }));
    }
  }

  handleErrorWithAlert(alerType: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {
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
          type: alerType,
          alertTitle: alertTitle,
          message: { code: err.status, message: (err.error.error && err.error.error.error && err.error.error.error.error && typeof err.error.error.error.error === 'string') ? err.error.error.error.error : (err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error : typeof err.error === 'string' ? err.error : 'Unknown Error', URL: errURL },
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
