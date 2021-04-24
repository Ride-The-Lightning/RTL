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
import { CLInvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';
import { GetInfo, Fees, Balance, LocalRemoteBalance, Payment, FeeRates, ListInvoices, Invoice, Peer } from '../../shared/models/clModels';

import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';
import * as CLActions from './cl.actions';
import * as fromCLReducers from '../store/cl.reducers';
import { AlertTypeEnum, CurrencyUnitEnum } from '../../shared/services/consts-enums-functions';

@Injectable()
export class CLEffects implements OnDestroy {
  CHILD_API_URL = API_URL + '/cl';
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
      this.store.select('cl')
      .pipe(takeUntil(this.unSubs[0]))
      .subscribe((rtlStore) => {
        if(rtlStore.initialAPIResponseStatus[0] === 'INCOMPLETE' && rtlStore.initialAPIResponseStatus.length > 9) { // Num of Initial APIs + 1
          rtlStore.initialAPIResponseStatus[0] = 'COMPLETE';
          this.store.dispatch(new RTLActions.CloseSpinner());
        }
      });
    }

  @Effect()
  infoFetchCL = this.actions$.pipe(
    ofType(CLActions.FETCH_INFO_CL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [CLActions.FetchInfo, fromRTLReducer.RootState]) => {
      this.store.dispatch(new CLActions.ClearEffectError('FetchInfo'));
      return this.httpClient.get<GetInfo>(this.CHILD_API_URL + environment.GETINFO_API)
        .pipe(
          takeUntil(this.actions$.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
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
  fetchFeesCL = this.actions$.pipe(
    ofType(CLActions.FETCH_FEES_CL),
    mergeMap((action: CLActions.FetchFees) => {
      this.store.dispatch(new CLActions.ClearEffectError('FetchFees'));
      return this.httpClient.get<Fees>(this.CHILD_API_URL + environment.FEES_API);
    }),
    map((fees) => {
      this.logger.info(fees);
      return {
        type: CLActions.SET_FEES_CL,
        payload: fees ? fees : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchFees', 'Fetching Fees Failed.', err);
      return of({type: RTLActions.VOID});
    }
    ));

  @Effect()
  fetchFeeRatesCL = this.actions$.pipe(
    ofType(CLActions.FETCH_FEE_RATES_CL),
    mergeMap((action: CLActions.FetchFeeRates) => {
      this.store.dispatch(new CLActions.ClearEffectError('FetchFeeRates'));
      return this.httpClient.get<FeeRates>(this.CHILD_API_URL + environment.NETWORK_API + '/feeRates/' + action.payload);
    }),
    map((feeRates) => {
      this.logger.info(feeRates);
      return {
        type: CLActions.SET_FEE_RATES_CL,
        payload: feeRates ? feeRates : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchFeeRates', 'Fetching Fee Rates Failed.', err);
      return of({type: RTLActions.VOID});
    }
    ));

  @Effect()
  fetchBalanceCL = this.actions$.pipe(
    ofType(CLActions.FETCH_BALANCE_CL),
    mergeMap((action: CLActions.FetchBalance) => {
      this.store.dispatch(new CLActions.ClearEffectError('FetchBalance'));
      return this.httpClient.get<Balance>(this.CHILD_API_URL + environment.BALANCE_API);
    }),
    map((balance) => {
      this.logger.info(balance);
      return {
        type: CLActions.SET_BALANCE_CL,
        payload: balance ? balance : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchBalance', 'Fetching Balances Failed.', err);
      return of({type: RTLActions.VOID});
    }
    ));

  @Effect()
  fetchLocalRemoteBalanceCL = this.actions$.pipe(
    ofType(CLActions.FETCH_LOCAL_REMOTE_BALANCE_CL),
    mergeMap((action: CLActions.FetchLocalRemoteBalance) => {
      this.store.dispatch(new CLActions.ClearEffectError('FetchLocalRemoteBalance'));
      return this.httpClient.get<LocalRemoteBalance>(this.CHILD_API_URL + environment.CHANNELS_API + '/localremotebalance');
    }),
    map((lrBalance) => {
      this.logger.info(lrBalance);
      return {
        type: CLActions.SET_LOCAL_REMOTE_BALANCE_CL,
        payload: lrBalance ? lrBalance : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchLocalRemoteBalance', 'Fetching Balances Failed.', err);
      return of({type: RTLActions.VOID});
    }
    ));

  @Effect()
  getNewAddressCL = this.actions$.pipe(
    ofType(CLActions.GET_NEW_ADDRESS_CL),
    mergeMap((action: CLActions.GetNewAddress) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.ON_CHAIN_API + '?type=' + action.payload.addressCode)
        .pipe(map((newAddress: any) => {
          this.logger.info(newAddress);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: CLActions.SET_NEW_ADDRESS_CL,
            payload: (newAddress && newAddress.address) ? newAddress.address : {}
          };
        }),
          catchError((err: any) => {
            this.handleErrorWithAlert('ERROR', 'Generate New Address Failed', this.CHILD_API_URL + environment.ON_CHAIN_API + '?type=' + action.payload.addressId, err);
            return of({type: RTLActions.VOID});
          }));
    })
  );

  @Effect({ dispatch: false })
  setNewAddressCL = this.actions$.pipe(
    ofType(CLActions.SET_NEW_ADDRESS_CL),
    map((action: CLActions.SetNewAddress) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  peersFetchCL = this.actions$.pipe(
    ofType(CLActions.FETCH_PEERS_CL),
    mergeMap((action: CLActions.FetchPeers) => {
      this.store.dispatch(new CLActions.ClearEffectError('FetchPeers'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PEERS_API)
        .pipe(
          map((peers: any) => {
            this.logger.info(peers);
            return {
              type: CLActions.SET_PEERS_CL ,
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
  saveNewPeerCL = this.actions$.pipe(
    ofType(CLActions.SAVE_NEW_PEER_CL),
    withLatestFrom(this.store.select('cl')),
    mergeMap(([action, clData]: [CLActions.SaveNewPeer, fromCLReducers.CLState]) => {
      this.store.dispatch(new CLActions.ClearEffectError('SaveNewPeer'));
      return this.httpClient.post(this.CHILD_API_URL + environment.PEERS_API, { id: action.payload.id })
        .pipe(
          map((postRes: Peer[]) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new CLActions.SetPeers((postRes && postRes.length > 0) ? postRes : []));
            return {
              type: CLActions.NEWLY_ADDED_PEER_CL,
              payload: {peer: postRes.find(peer => action.payload.id.indexOf(peer.id) === 0)}
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
  detachPeerCL = this.actions$.pipe(
    ofType(CLActions.DETACH_PEER_CL),
    mergeMap((action: CLActions.DetachPeer) => {
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.id + '?force=' + action.payload.force)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Peer Disconnected Successfully!'));
            return {
              type: CLActions.REMOVE_PEER_CL,
              payload: { id: action.payload.id }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('ERROR', 'Unable to Detach Peer. Try again later.', this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.id, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  channelsFetchCL = this.actions$.pipe(
    ofType(CLActions.FETCH_CHANNELS_CL),
    mergeMap((action: CLActions.FetchChannels) => {
      this.store.dispatch(new CLActions.ClearEffectError('FetchChannels'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/listChannels')
        .pipe(
          map((channels: any) => {
            this.logger.info(channels);
            this.store.dispatch(new CLActions.GetForwardingHistory());
            return {
              type: CLActions.SET_CHANNELS_CL,
              payload: (channels && channels.length > 0) ? channels : []
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
  openNewChannelCL = this.actions$.pipe(
    ofType(CLActions.SAVE_NEW_CHANNEL_CL),
    mergeMap((action: CLActions.SaveNewChannel) => {
      this.store.dispatch(new CLActions.ClearEffectError('SaveNewChannel'));
      let newPayload = {id: action.payload.peerId, satoshis: action.payload.satoshis, feeRate: action.payload.feeRate, announce: action.payload.announce, minconf: (action.payload.minconf) ? action.payload.minconf : null};
      if (action.payload.utxos) { newPayload['utxos'] = action.payload.utxos; }
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, newPayload)
      .pipe(map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.store.dispatch(new RTLActions.OpenSnackBar('Channel Added Successfully!'));
        this.store.dispatch(new CLActions.FetchBalance());
        this.store.dispatch(new CLActions.FetchUTXOs());
        return {
          type: CLActions.FETCH_CHANNELS_CL
        };
      }),
      catchError((err: any) => {
        this.handleErrorWithoutAlert('SaveNewChannel', 'Opening Channel Failed.', err);
        return of({type: RTLActions.VOID});
      }));
    }
    ));

  @Effect()
  updateChannelCL = this.actions$.pipe(
    ofType(CLActions.UPDATE_CHANNELS_CL),
    mergeMap((action: CLActions.UpdateChannels) => {
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/setChannelFee',
        { id: action.payload.channelId, base: action.payload.baseFeeMsat, ppm: action.payload.feeRate })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
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
            this.handleErrorWithAlert('ERROR', 'Update Channel Failed', this.CHILD_API_URL + environment.CHANNELS_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  closeChannelCL = this.actions$.pipe(
    ofType(CLActions.CLOSE_CHANNEL_CL),
    mergeMap((action: CLActions.CloseChannel) => {
      const queryParam = action.payload.force ? '?force=' + action.payload.force : '';
      return this.httpClient.delete(this.CHILD_API_URL + environment.CHANNELS_API + '/' + action.payload.channelId + queryParam)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new CLActions.FetchChannels());
            this.store.dispatch(new RTLActions.OpenSnackBar('Channel Closed Successfully!'));
            return {
              type: CLActions.REMOVE_CHANNEL_CL,
              payload: { channelId: action.payload.channelId }
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
  paymentsFetchCL = this.actions$.pipe(
    ofType(CLActions.FETCH_PAYMENTS_CL),
    mergeMap((action: CLActions.FetchPayments) => {
      this.store.dispatch(new CLActions.ClearEffectError('FetchPayments'));
      return this.httpClient.get<Payment[]>(this.CHILD_API_URL + environment.PAYMENTS_API);
    }),
    map((payments) => {
      this.logger.info(payments);
      return {
        type: CLActions.SET_PAYMENTS_CL,
        payload: payments ? payments : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchPayments', 'Fetching Payments Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  decodePaymentCL = this.actions$.pipe(
    ofType(CLActions.DECODE_PAYMENT_CL),
    mergeMap((action: CLActions.DecodePayment) => {
      this.store.dispatch(new CLActions.ClearEffectError('DecodePayment'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PAYMENTS_API + '/' + action.payload.routeParam)
        .pipe(
          map((decodedPayment) => {
            this.logger.info(decodedPayment);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: CLActions.SET_DECODED_PAYMENT_CL,
              payload: decodedPayment ? decodedPayment : {}
            };
          }),
          catchError((err: any) => {
            if (action.payload.fromDialog) {
              this.handleErrorWithoutAlert('DecodePayment', 'Decode Payment Failed.', err);
            } else {
              this.handleErrorWithAlert('ERROR', 'Decode Payment Failed', this.CHILD_API_URL + environment.PAYMENTS_API + '/' + action.payload, err);
            }
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setDecodedPaymentCL = this.actions$.pipe(
    ofType(CLActions.SET_DECODED_PAYMENT_CL),
    map((action: CLActions.SetDecodedPayment) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  sendPaymentCL = this.actions$.pipe(
    ofType(CLActions.SEND_PAYMENT_CL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [CLActions.SendPayment, any]) => {
      this.store.dispatch(new CLActions.ClearEffectError('SendPayment'));
      let paymentUrl = (action.payload.pubkey && action.payload.pubkey !== '') ? this.CHILD_API_URL + environment.PAYMENTS_API + '/keysend' : this.CHILD_API_URL + environment.PAYMENTS_API + '/invoice';
      return this.httpClient.post(paymentUrl, action.payload).pipe(
        map((sendRes: any) => {
          this.logger.info(sendRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          if (sendRes.error) {
            this.logger.error('Error: ' + sendRes.payment_error);
            const myErr = {status: sendRes.payment_error.status, error: sendRes.payment_error.error && sendRes.payment_error.error.error && typeof(sendRes.payment_error.error.error) === 'object' ? sendRes.payment_error.error.error : {error: sendRes.payment_error.error && sendRes.payment_error.error.error ? sendRes.payment_error.error.error : 'Unknown Error'}};
            if (action.payload.fromDialog) {
              this.handleErrorWithoutAlert('SendPayment', 'Send Payment Failed.', myErr);
            } else {
              this.handleErrorWithAlert('ERROR', 'Send Payment Failed', this.CHILD_API_URL + environment.PAYMENTS_API, myErr);
            }
            return of({type: RTLActions.VOID});
          } else {
            this.store.dispatch(new RTLActions.OpenSnackBar('Payment Sent Successfully!'));
            this.store.dispatch(new CLActions.FetchChannels());
            this.store.dispatch(new CLActions.FetchBalance());
            this.store.dispatch(new CLActions.FetchPayments());
            this.store.dispatch(new CLActions.SetDecodedPayment({}));
            return {
              type: CLActions.SEND_PAYMENT_STATUS_CL,
              payload: sendRes
            };
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
        }));
    })
  );

  @Effect()
  queryRoutesFetchCL = this.actions$.pipe(
    ofType(CLActions.GET_QUERY_ROUTES_CL),
    mergeMap((action: CLActions.GetQueryRoutes) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/getRoute/' + action.payload.destPubkey + '/' + action.payload.amount)
        .pipe(
          map((qrRes: any) => {
            this.logger.info(qrRes);
            return {
              type: CLActions.SET_QUERY_ROUTES_CL,
              payload: qrRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new CLActions.SetQueryRoutes({ routes: [] }));
            this.handleErrorWithAlert('ERROR', 'Get Query Routes Failed', this.CHILD_API_URL + environment.NETWORK_API + '/getRoute/' + action.payload.destPubkey + '/' + action.payload.amount, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect({ dispatch: false })
  setQueryRoutesCL = this.actions$.pipe(
    ofType(CLActions.SET_QUERY_ROUTES_CL),
    map((action: CLActions.SetQueryRoutes) => {
      return action.payload;
    })
  );

  @Effect()
  peerLookupCL = this.actions$.pipe(
    ofType(CLActions.PEER_LOOKUP_CL),
    mergeMap((action: CLActions.PeerLookup) => {
      this.store.dispatch(new CLActions.ClearEffectError('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/listNode/' + action.payload)
        .pipe(
          map((resPeer) => {
            this.logger.info(resPeer);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: CLActions.SET_LOOKUP_CL,
              payload: resPeer
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new CLActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Peer Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/listNode/' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  channelLookupCL = this.actions$.pipe(
    ofType(CLActions.CHANNEL_LOOKUP_CL),
    mergeMap((action: CLActions.ChannelLookup) => {
      this.store.dispatch(new CLActions.ClearEffectError('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/listChannel/' + action.payload.shortChannelID)
        .pipe(
          map((resChannel) => {
            this.logger.info(resChannel);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: CLActions.SET_LOOKUP_CL,
              payload: resChannel
            };
          }),
          catchError((err: any) => {
            if(action.payload.showError) {
              this.store.dispatch(new CLActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
              this.handleErrorWithAlert('ERROR', 'Channel Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/listChannel/' + action.payload.shortChannelID, err);
            } else {
              this.store.dispatch(new RTLActions.CloseSpinner());
            }
            this.store.dispatch(new CLActions.SetLookup([]));
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  invoiceLookupCL = this.actions$.pipe(
    ofType(CLActions.INVOICE_LOOKUP_CL),
    mergeMap((action: CLActions.InvoiceLookup) => {
      this.store.dispatch(new CLActions.ClearEffectError('Lookup'));
      return this.httpClient.get(this.CHILD_API_URL + environment.INVOICES_API + '/listInvoice?label=' + action.payload)
        .pipe(
          map((resInvoice) => {
            this.logger.info(resInvoice);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: CLActions.SET_LOOKUP_CL,
              payload: resInvoice
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new CLActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Invoice Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/listInvoice?label=' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setLookupCL = this.actions$.pipe(
    ofType(CLActions.SET_LOOKUP_CL),
    map((action: CLActions.SetLookup) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  fetchForwardingHistoryCL = this.actions$.pipe(
    ofType(CLActions.GET_FORWARDING_HISTORY_CL),
    mergeMap((action: CLActions.GetForwardingHistory) => {
      this.store.dispatch(new CLActions.ClearEffectError('GetForwardingHistory'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/listForwards')
        .pipe(
          map((fhRes: any) => {
            this.logger.info(fhRes);
            return {
              type: CLActions.SET_FORWARDING_HISTORY_CL,
              payload: fhRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new CLActions.EffectError({ action: 'GetForwardingHistory', code: err.status, message: err.error.error }));
            this.handleErrorWithAlert('ERROR', 'Get Forwarding History Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/listForwards', err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  deleteExpiredInvoiceCL = this.actions$.pipe(
    ofType(CLActions.DELETE_EXPIRED_INVOICE_CL),
    mergeMap((action: CLActions.DeleteExpiredInvoice) => {
      const queryStr = (action.payload) ?  '?maxexpiry=' + action.payload : '';
      return this.httpClient.delete(this.CHILD_API_URL + environment.INVOICES_API + queryStr)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Invoices Deleted Successfully!'));
            return {
              type: CLActions.FETCH_INVOICES_CL ,
              payload: { num_max_invoices: 100, reversed: true }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('ERROR', 'Delete Invoice Failed', this.CHILD_API_URL + environment.INVOICES_API, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  saveNewInvoiceCL = this.actions$.pipe(
    ofType(CLActions.SAVE_NEW_INVOICE_CL),
    mergeMap((action: CLActions.SaveNewInvoice) => {
      this.store.dispatch(new CLActions.ClearEffectError('SaveNewInvoice'));
      return this.httpClient.post(this.CHILD_API_URL + environment.INVOICES_API, {
        label: action.payload.label, amount: action.payload.amount, description: action.payload.description, expiry: action.payload.expiry, private: action.payload.private
      })
        .pipe(
          map((postRes: Invoice) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            postRes.msatoshi = action.payload.amount;
            postRes.label = action.payload.label;
            postRes.expires_at = Math.round((new Date().getTime() / 1000) + action.payload.expiry);
            postRes.expires_at_str = this.commonService.convertTimestampToDate(+postRes.expires_at);
            postRes.description = action.payload.description;
            postRes.status = 'unpaid';
            this.store.dispatch(new RTLActions.OpenAlert({ data: { 
                invoice: postRes,
                newlyAdded: false,
                component: CLInvoiceInformationComponent
            }}));
            return {
              type: CLActions.FETCH_INVOICES_CL ,
              payload: { num_max_invoices: 100, reversed: true }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewInvoice', 'Add Invoice Failed.', err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  invoicesFetchCL = this.actions$.pipe(
  ofType(CLActions.FETCH_INVOICES_CL),
  mergeMap((action: CLActions.FetchInvoices) => {
    this.store.dispatch(new CLActions.ClearEffectError('FetchInvoices'));
    const num_max_invoices = (action.payload.num_max_invoices) ? action.payload.num_max_invoices : 100;
    const index_offset = (action.payload.index_offset) ? action.payload.index_offset : 0;
    const reversed = (action.payload.reversed) ? action.payload.reversed : false;
    return this.httpClient.get<ListInvoices>(this.CHILD_API_URL + environment.INVOICES_API + '?num_max_invoices=' + num_max_invoices + '&index_offset=' + index_offset + '&reversed=' + reversed)
      .pipe(map((res: ListInvoices) => {
        this.logger.info(res);
        this.store.dispatch(new CLActions.SetTotalInvoices(res.invoices ? res.invoices.length : 0));
        return {
          type: CLActions.SET_INVOICES_CL,
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
  SetChannelTransactionCL = this.actions$.pipe(
    ofType(CLActions.SET_CHANNEL_TRANSACTION_CL),
    mergeMap((action: CLActions.SetChannelTransaction) => {
      this.store.dispatch(new CLActions.ClearEffectError('SetChannelTransaction'));
      return this.httpClient.post(this.CHILD_API_URL + environment.ON_CHAIN_API, action.payload)
      .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.store.dispatch(new CLActions.FetchBalance());
        this.store.dispatch(new CLActions.FetchUTXOs());
        return {
          type: CLActions.SET_CHANNEL_TRANSACTION_RES_CL,
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
  utxosFetch = this.actions$.pipe(
    ofType(CLActions.FETCH_UTXOS_CL),
    mergeMap((action: CLActions.FetchUTXOs) => {
      this.store.dispatch(new CLActions.ClearEffectError('FetchUTXOs'));
      return this.httpClient.get(this.CHILD_API_URL + environment.ON_CHAIN_API + '/utxos');
    }),
    map((utxos: any) => {
      this.logger.info(utxos);
      return {
        type: CLActions.SET_UTXOS_CL,
        payload: (utxos && utxos.outputs && utxos.outputs.length > 0) ? utxos.outputs : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchUTXOs', 'Fetching UTXOs Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

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
      currency_unit: CurrencyUnitEnum.BTC,
      smaller_currency_unit: CurrencyUnitEnum.SATS,
      numberOfPendingChannels: info.num_pending_channels
    };
    this.store.dispatch(new RTLActions.OpenSpinner('Initializing Node Data...'));
    this.store.dispatch(new RTLActions.SetNodeData(node_data));
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
  
  handleErrorWithoutAlert(actionName: string, genericErrorMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new CLActions.EffectError({ action: actionName, code: err.status.toString(), message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.message && typeof err.error.error.error.error.message === 'string') ? err.error.error.error.error.message : (err.error.error && err.error.error.error && err.error.error.error.message && typeof err.error.error.error.message === 'string') ? err.error.error.error.message : (err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message : (err.error.message && typeof err.error.message === 'string') ? err.error.message : typeof err.error === 'string' ? err.error : genericErrorMessage }));
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
          message: { code: err.status, message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.message && typeof err.error.error.error.error.message === 'string') ? err.error.error.error.error.message : (err.error.error && err.error.error.error && err.error.error.error.message && typeof err.error.error.error.message === 'string') ? err.error.error.error.message : (err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message : (err.error.message && typeof err.error.message === 'string') ? err.error.message : typeof err.error === 'string' ? err.error : 'Unknown Error', URL: errURL },
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
