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
import { GetInfo, Channel, OnChainBalance, LightningBalance, ChannelsStatus, ChannelStats, Peer, Audit, Transaction, Invoice } from '../../shared/models/eclModels';
import * as fromRTLReducer from '../../store/rtl.reducers';
import * as fromECLReducer from './ecl.reducers';
import * as ECLActions from './ecl.actions';
import * as RTLActions from '../../store/rtl.actions';
import { ECLInvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';

@Injectable()
export class ECLEffects implements OnDestroy {
  CHILD_API_URL = API_URL + '/ecl';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<fromRTLReducer.RTLState>,
    private sessionService: SessionService,
    private logger: LoggerService,
    private commonService: CommonService,
    private router: Router,
    private location: Location) {
      this.store.select('ecl')
      .pipe(takeUntil(this.unSubs[0]))
      .subscribe((rtlStore) => {
        if(rtlStore.initialAPIResponseStatus[0] === 'INCOMPLETE' && rtlStore.initialAPIResponseStatus.length > 5) { // Num of Initial APIs + 1
          rtlStore.initialAPIResponseStatus[0] = 'COMPLETE';
          this.store.dispatch(new RTLActions.CloseSpinner());
        }
      });
    }

  @Effect()
  infoFetchECL = this.actions$.pipe(
    ofType(ECLActions.FETCH_INFO_ECL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [ECLActions.FetchInfo, fromRTLReducer.RootState]) => {
      this.store.dispatch(new ECLActions.ClearEffectError('FetchInfo'));
      return this.httpClient.get<GetInfo>(this.CHILD_API_URL + environment.GETINFO_API)
        .pipe(
          takeUntil(this.actions$.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
            this.initializeRemainingData(info, action.payload.loadPage);
            return {
              type: ECLActions.SET_INFO_ECL,
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
  fetchFees = this.actions$.pipe(
    ofType(ECLActions.FETCH_FEES_ECL),
    mergeMap((action: ECLActions.FetchFees) => {
      this.store.dispatch(new ECLActions.ClearEffectError('FetchFees'));
      return this.httpClient.get<Audit>(this.CHILD_API_URL + environment.FEES_API + '/fees')
      .pipe(map((fees: any) => {
          this.logger.info(fees);
          return {
            type: ECLActions.SET_FEES_ECL,
            payload: fees ? fees : {}
          };
        },
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchFees', 'Fetching Fees Failed.', err);
          return of({type: RTLActions.VOID});
        })
      ));
    }
  ));

  @Effect()
  fetchPayments = this.actions$.pipe(
    ofType(ECLActions.FETCH_PAYMENTS_ECL),
    mergeMap((action: ECLActions.FetchPayments) => {
      this.store.dispatch(new ECLActions.ClearEffectError('FetchPayments'));
      return this.httpClient.get<Audit>(this.CHILD_API_URL + environment.FEES_API + '/payments')
      .pipe(map((payments: any) => {
          this.logger.info(payments);
          return {
            type: ECLActions.SET_PAYMENTS_ECL,
            payload: payments ? payments : {}
          };
        },
        catchError((err: any) => {
          this.handleErrorWithoutAlert('FetchPayments', 'Fetching Payments Failed.', err);
          return of({type: RTLActions.VOID});
        })
      ));
    }
  ));

  @Effect()
  channelsFetch = this.actions$.pipe(
    ofType(ECLActions.FETCH_CHANNELS_ECL),
    mergeMap((action: ECLActions.FetchChannels) => {
      this.store.dispatch(new ECLActions.ClearEffectError('FetchChannels'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API)
        .pipe(map((channelsRes: {activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalances: LightningBalance, channelStatus: ChannelsStatus}) => {
          this.logger.info(channelsRes);
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
    ofType(ECLActions.FETCH_CHANNEL_STATS_ECL),
    mergeMap((action: ECLActions.FetchChannelStats) => {
      this.store.dispatch(new ECLActions.ClearEffectError('FetchChannelStats'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/stats')
        .pipe(map((channelStats: ChannelStats[]) => {
          this.logger.info(channelStats);
          return {
            type: ECLActions.SET_CHANNEL_STATS_ECL,
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
    ofType(ECLActions.FETCH_ONCHAIN_BALANCE_ECL),
    mergeMap((action: ECLActions.FetchOnchainBalance) => {
      this.store.dispatch(new ECLActions.ClearEffectError('FetchOnchainBalance'));
      return this.httpClient.get<OnChainBalance>(this.CHILD_API_URL + environment.ON_CHAIN_API + '/balance');
    }),
    map((balance) => {
      this.logger.info(balance);
      return {
        type: ECLActions.SET_ONCHAIN_BALANCE_ECL,
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
    ofType(ECLActions.FETCH_PEERS_ECL),
    mergeMap((action: ECLActions.FetchPeers) => {
      this.store.dispatch(new ECLActions.ClearEffectError('FetchPeers'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PEERS_API)
        .pipe(
          map((peers: Peer[]) => {
            this.logger.info(peers);
            return {
              type: ECLActions.SET_PEERS_ECL ,
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
    ofType(ECLActions.GET_NEW_ADDRESS_ECL),
    mergeMap((action: ECLActions.GetNewAddress) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.ON_CHAIN_API)
        .pipe(map((newAddress: any) => {
          this.logger.info(newAddress);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: ECLActions.SET_NEW_ADDRESS_ECL,
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
    ofType(ECLActions.SET_NEW_ADDRESS_ECL),
    map((action: ECLActions.SetNewAddress) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  saveNewPeer = this.actions$.pipe(
    ofType(ECLActions.SAVE_NEW_PEER_ECL),
    withLatestFrom(this.store.select('ecl')),
    mergeMap(([action, eclData]: [ECLActions.SaveNewPeer, fromECLReducer.ECLState]) => {
      this.store.dispatch(new ECLActions.ClearEffectError('SaveNewPeer'));
      return this.httpClient.post(this.CHILD_API_URL + environment.PEERS_API + ((action.payload.id.includes('@') ? '?uri=' : '?nodeId=') + action.payload.id), {})
        .pipe(
          map((postRes: Peer[]) => {
            this.logger.info(postRes);
            postRes = (postRes && postRes.length) ? postRes : [];
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new ECLActions.SetPeers(postRes));
            return {
              type: ECLActions.NEWLY_ADDED_PEER_ECL,
              payload: { peer: postRes.find(peer => peer.nodeId === (action.payload.id.includes('@') ? action.payload.id.substring(0, action.payload.id.indexOf('@')) : action.payload.id)) }
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
    ofType(ECLActions.DETACH_PEER_ECL),
    mergeMap((action: ECLActions.DisconnectPeer) => {
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.nodeId)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Disconnecting Peer!'));
            return {
              type: ECLActions.REMOVE_PEER_ECL,
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
    ofType(ECLActions.SAVE_NEW_CHANNEL_ECL),
    mergeMap((action: ECLActions.SaveNewChannel) => {
      this.store.dispatch(new ECLActions.ClearEffectError('SaveNewChannel'));
      const reqBody = action.payload.feeRate && action.payload.feeRate > 0 ? 
          { nodeId: action.payload.nodeId, fundingSatoshis: action.payload.amount, channelFlags: +!action.payload.private, fundingFeerateSatByte: action.payload.feeRate }
        : { nodeId: action.payload.nodeId, fundingSatoshis: action.payload.amount, channelFlags: +!action.payload.private}
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, reqBody)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new ECLActions.FetchPeers());
            this.store.dispatch(new ECLActions.FetchOnchainBalance());
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Channel Added Successfully!'));
            return {
              type: ECLActions.FETCH_CHANNELS_ECL,
              payload: { fetchPayments: false }
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
    ofType(ECLActions.UPDATE_CHANNELS_ECL),
    mergeMap((action: ECLActions.UpdateChannels) => {
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
              type: ECLActions.FETCH_CHANNELS_ECL,
              payload: { fetchPayments: false }
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
    ofType(ECLActions.CLOSE_CHANNEL_ECL),
    mergeMap((action: ECLActions.CloseChannel) => {
      return this.httpClient.delete(this.CHILD_API_URL + environment.CHANNELS_API + '?channelId=' + action.payload.channelId + '&force=' + action.payload.force)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            setTimeout(() => {
              this.store.dispatch(new RTLActions.CloseSpinner());
              this.store.dispatch(new ECLActions.FetchChannels({fetchPayments: false}));
              this.store.dispatch(new RTLActions.OpenSnackBar(action.payload.force ? 'Channel Force Closed Successfully!' : 'Channel Closed Successfully!'));
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
    ofType(ECLActions.GET_QUERY_ROUTES_ECL),
    mergeMap((action: ECLActions.GetQueryRoutes) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.PAYMENTS_API + '/route?nodeId=' + action.payload.nodeId + '&amountMsat=' + action.payload.amount)
        .pipe(
          map((qrRes: any) => {
            this.logger.info(qrRes);
            return {
              type: ECLActions.SET_QUERY_ROUTES_ECL,
              payload: qrRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new ECLActions.SetQueryRoutes([]));
            this.handleErrorWithAlert('ERROR', 'Get Query Routes Failed', this.CHILD_API_URL + environment.PAYMENTS_API + '/route?nodeId=' + action.payload.nodeId + '&amountMsat=' + action.payload.amount, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect({ dispatch: false })
  setQueryRoutes = this.actions$.pipe(
    ofType(ECLActions.SET_QUERY_ROUTES_ECL),
    map((action: ECLActions.SetQueryRoutes) => {
      return action.payload;
    })
  );

  @Effect()
  sendPayment = this.actions$.pipe(
    ofType(ECLActions.SEND_PAYMENT_ECL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [ECLActions.SendPayment, any]) => {
      this.store.dispatch(new ECLActions.ClearEffectError('SendPayment'));      
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
                this.store.dispatch(new ECLActions.SendPaymentStatus(sendRes));
                this.store.dispatch(new RTLActions.CloseSpinner());
                this.store.dispatch(new ECLActions.FetchChannels({fetchPayments: true}));
                this.store.dispatch(new ECLActions.FetchPayments());
                this.store.dispatch(new RTLActions.OpenSnackBar('Payment Submitted!'));
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
    ofType(ECLActions.FETCH_TRANSACTIONS_ECL),
    mergeMap((action: ECLActions.FetchTransactions) => {
      this.store.dispatch(new ECLActions.ClearEffectError('FetchTransactions'));
      return this.httpClient.get<Transaction[]>(this.CHILD_API_URL + environment.ON_CHAIN_API + '/transactions?count=1000&skip=0');
    }),
    map((transactions) => {
      this.logger.info(transactions);
      return {
        type: ECLActions.SET_TRANSACTIONS_ECL,
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
    ofType(ECLActions.SEND_ONCHAIN_FUNDS_ECL),
    mergeMap((action: ECLActions.SendOnchainFunds) => {
      this.store.dispatch(new ECLActions.ClearEffectError('SendOnchainFunds'));
      return this.httpClient.post(this.CHILD_API_URL + environment.ON_CHAIN_API, action.payload)
      .pipe(map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.store.dispatch(new ECLActions.FetchOnchainBalance());
        return {
          type: ECLActions.SEND_ONCHAIN_FUNDS_RES_ECL,
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
  ofType(ECLActions.CREATE_INVOICE_ECL),
  mergeMap((action: ECLActions.CreateInvoice) => {
    this.store.dispatch(new ECLActions.ClearEffectError('CreateInvoice'));
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
              component: ECLInvoiceInformationComponent
          }}));
          return {
            type: ECLActions.FETCH_INVOICES_ECL
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
  ofType(ECLActions.FETCH_INVOICES_ECL),
  mergeMap((action: ECLActions.FetchInvoices) => {
    this.store.dispatch(new ECLActions.ClearEffectError('FetchInvoices'));
    return this.httpClient.get<Invoice[]>(this.CHILD_API_URL + environment.INVOICES_API)
      .pipe(map((res: Invoice[]) => {
        this.logger.info(res);
        return {
          type: ECLActions.SET_INVOICES_ECL,
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
  peerLookup = this.actions$.pipe(
    ofType(ECLActions.PEER_LOOKUP_ECL),
    mergeMap((action: ECLActions.PeerLookup) => {
      this.store.dispatch(new ECLActions.ClearEffectError('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/nodes/' + action.payload)
        .pipe(
          map((resPeer) => {
            this.logger.info(resPeer);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: ECLActions.SET_LOOKUP_ECL,
              payload: resPeer
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new ECLActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Peer Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/nodes/' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setLookup = this.actions$.pipe(
    ofType(ECLActions.SET_LOOKUP_ECL),
    map((action: ECLActions.SetLookup) => {
      this.logger.info(action.payload);
      return action.payload;
    })
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
      currency_unit: 'BTC',
      smaller_currency_unit: 'Sats',
      numberOfPendingChannels: 0
    };
    this.store.dispatch(new RTLActions.OpenSpinner('Initializing Node Data...'));
    this.store.dispatch(new RTLActions.SetNodeData(node_data));
    this.store.dispatch(new ECLActions.FetchChannels({fetchPayments: true}));
    this.store.dispatch(new ECLActions.FetchFees());
    this.store.dispatch(new ECLActions.FetchOnchainBalance());
    this.store.dispatch(new ECLActions.FetchPeers());
    let newRoute = this.location.path();
    if(newRoute.includes('/lnd/')) {
      newRoute = newRoute.replace('/lnd/', '/ecl/');
    } else if (newRoute.includes('/cl/')) {
      newRoute = newRoute.replace('/cl/', '/ecl/');
    }
    if (newRoute.includes('/login') || newRoute.includes('/error') || newRoute === '' || landingPage === 'HOME' || newRoute.includes('?access-key=')) {
      newRoute = '/ecl/home';
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
      this.store.dispatch(new ECLActions.EffectError({ action: actionName, code: err.status.toString(), message: (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error : genericErrorMessage }));
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
