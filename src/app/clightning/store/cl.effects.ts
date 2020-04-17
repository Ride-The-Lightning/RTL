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
import { CLOpenChannelComponent } from '../peers-channels/channels/open-channel-modal/open-channel.component';
import { GetInfoCL, FeesCL, BalanceCL, LocalRemoteBalanceCL, PaymentCL, FeeRatesCL, ListInvoicesCL, InvoiceCL, PeerCL } from '../../shared/models/clModels';
import { AlertTypeEnum } from '../../shared/services/consts-enums-functions';
import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';
import * as fromCLReducers from '../store/cl.reducers';

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
    private location: Location) { }

  @Effect()
  infoFetchCL = this.actions$.pipe(
    ofType(RTLActions.FETCH_INFO_CL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [RTLActions.FetchInfoCL, fromRTLReducer.RootState]) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchInfoCL'));
      return this.httpClient.get<GetInfoCL>(this.CHILD_API_URL + environment.GETINFO_API)
        .pipe(
          takeUntil(this.actions$.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
            this.initializeRemainingData(info, action.payload.loadPage);
            return {
              type: RTLActions.SET_INFO_CL,
              payload: info ? info : {}
            };
          }),
          catchError((err) => {
            const code = (err.error && err.error.error && err.error.error.message && err.error.error.message.code) ? err.error.error.message.code : (err.error && err.error.error && err.error.error.code) ? err.error.error.code : err.status ? err.status : '';
            const message = ((err.error && err.error.message) ? err.error.message + ' ' : '') + ((err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error && err.error.error && err.error.error.errno && typeof err.error.error.errno === 'string') ? err.error.error.errno : (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error : (err.error && typeof err.error === 'string') ? err.error : 'Unknown Error');
            this.router.navigate(['/error'], { state: { errorCode: code, errorMessage: message }});
            this.handleErrorWithoutAlert('FetchInfoCL', 'Fetching Node Info Failed.', err);            
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  fetchFeesCL = this.actions$.pipe(
    ofType(RTLActions.FETCH_FEES_CL),
    mergeMap((action: RTLActions.FetchFeesCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchFeesCL'));
      return this.httpClient.get<FeesCL>(this.CHILD_API_URL + environment.FEES_API);
    }),
    map((fees) => {
      this.logger.info(fees);
      return {
        type: RTLActions.SET_FEES_CL,
        payload: fees ? fees : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchFeesCL', 'Fetching Fees Failed.', err);
      return of({type: RTLActions.VOID});
    }
    ));

  @Effect()
  fetchFeeRatesCL = this.actions$.pipe(
    ofType(RTLActions.FETCH_FEE_RATES_CL),
    mergeMap((action: RTLActions.FetchFeeRatesCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchFeeRatesCL'));
      return this.httpClient.get<FeeRatesCL>(this.CHILD_API_URL + environment.NETWORK_API + '/feeRates/' + action.payload);
    }),
    map((feeRates) => {
      this.logger.info(feeRates);
      return {
        type: RTLActions.SET_FEE_RATES_CL,
        payload: feeRates ? feeRates : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchFeeRatesCL', 'Fetching Fee Rates Failed.', err);
      return of({type: RTLActions.VOID});
    }
    ));

  @Effect()
  fetchBalanceCL = this.actions$.pipe(
    ofType(RTLActions.FETCH_BALANCE_CL),
    mergeMap((action: RTLActions.FetchBalanceCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchBalanceCL'));
      return this.httpClient.get<BalanceCL>(this.CHILD_API_URL + environment.BALANCE_API);
    }),
    map((balance) => {
      this.logger.info(balance);
      return {
        type: RTLActions.SET_BALANCE_CL,
        payload: balance ? balance : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchBalanceCL', 'Fetching Balances Failed.', err);
      return of({type: RTLActions.VOID});
    }
    ));

  @Effect()
  fetchLocalRemoteBalanceCL = this.actions$.pipe(
    ofType(RTLActions.FETCH_LOCAL_REMOTE_BALANCE_CL),
    mergeMap((action: RTLActions.FetchLocalRemoteBalanceCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchLocalRemoteBalanceCL'));
      return this.httpClient.get<LocalRemoteBalanceCL>(this.CHILD_API_URL + environment.CHANNELS_API + '/localremotebalance');
    }),
    map((lrBalance) => {
      this.logger.info(lrBalance);
      return {
        type: RTLActions.SET_LOCAL_REMOTE_BALANCE_CL,
        payload: lrBalance ? lrBalance : {}
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchLocalRemoteBalanceCL', 'Fetching Balances Failed.', err);
      return of({type: RTLActions.VOID});
    }
    ));

  @Effect()
  getNewAddressCL = this.actions$.pipe(
    ofType(RTLActions.GET_NEW_ADDRESS_CL),
    mergeMap((action: RTLActions.GetNewAddressCL) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.ON_CHAIN_API + '?type=' + action.payload.addressCode)
        .pipe(map((newAddress: any) => {
          this.logger.info(newAddress);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SET_NEW_ADDRESS_CL,
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
    ofType(RTLActions.SET_NEW_ADDRESS_CL),
    map((action: RTLActions.SetNewAddressCL) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  peersFetchCL = this.actions$.pipe(
    ofType(RTLActions.FETCH_PEERS_CL),
    mergeMap((action: RTLActions.FetchPeersCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchPeersCL'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PEERS_API)
        .pipe(
          map((peers: any) => {
            this.logger.info(peers);
            return {
              type: RTLActions.SET_PEERS_CL,
              payload: peers ? peers : []
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchPeersCL', 'Fetching Peers Failed.', err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  saveNewPeerCL = this.actions$.pipe(
    ofType(RTLActions.SAVE_NEW_PEER_CL),
    withLatestFrom(this.store.select('cl')),
    mergeMap(([action, clData]: [RTLActions.SaveNewPeerCL, fromCLReducers.CLState]) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('SaveNewPeerCL'));
      return this.httpClient.post(this.CHILD_API_URL + environment.PEERS_API, { id: action.payload.id })
        .pipe(
          map((postRes: PeerCL[]) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.SetPeersCL((postRes && postRes.length > 0) ? postRes : []));
            return {
              type: RTLActions.NEWLY_ADDED_PEER_CL,
              payload: {peer: postRes.find(peer => action.payload.id.indexOf(peer.id) === 0)}
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewPeerCL', 'Peer Connection Failed.', err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  detachPeerCL = this.actions$.pipe(
    ofType(RTLActions.DETACH_PEER_CL),
    mergeMap((action: RTLActions.DetachPeerCL) => {
      return this.httpClient.delete(this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.id + '?force=' + action.payload.force)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Peer Disconnected Successfully!'));
            return {
              type: RTLActions.REMOVE_PEER_CL,
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
    ofType(RTLActions.FETCH_CHANNELS_CL),
    mergeMap((action: RTLActions.FetchChannelsCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchChannelsCL'));
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/listChannels')
        .pipe(
          map((channels: any) => {
            this.logger.info(channels);
            return {
              type: RTLActions.SET_CHANNELS_CL,
              payload: (channels && channels.length > 0) ? channels : []
            };
          },
            catchError((err: any) => {
              this.handleErrorWithoutAlert('FetchChannelsCL', 'Fetching Channels Failed.', err);
              return of({type: RTLActions.VOID});
            })
          ));
    }
    ));

  @Effect()
  openNewChannelCL = this.actions$.pipe(
    ofType(RTLActions.SAVE_NEW_CHANNEL_CL),
    mergeMap((action: RTLActions.SaveNewChannelCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('SaveNewChannelCL'));
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API, {
        id: action.payload.peerId, satoshis: action.payload.satoshis, feeRate: action.payload.feeRate, announce: action.payload.announce, minconf: (action.payload.minconf) ? action.payload.minconf : null
      })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Channel Added Successfully!'));
            this.store.dispatch(new RTLActions.FetchBalanceCL());
            return {
              type: RTLActions.FETCH_CHANNELS_CL
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewChannelCL', 'Opening Channel Failed.', err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  updateChannelCL = this.actions$.pipe(
    ofType(RTLActions.UPDATE_CHANNELS_CL),
    mergeMap((action: RTLActions.UpdateChannelsCL) => {
      return this.httpClient.post(this.CHILD_API_URL + environment.CHANNELS_API + '/setChannelFee',
        { id: action.payload.channelId, base: action.payload.baseFeeMsat, ppm: action.payload.feeRate })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            if(action.payload.channelId === 'all') {
              this.store.dispatch(new RTLActions.OpenSnackBar('All Channels Updated Successfully.'));
            } else {
              this.store.dispatch(new RTLActions.OpenSnackBar('Channel Updated Successfully!'));
            }
            return {
              type: RTLActions.FETCH_CHANNELS_CL
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
    ofType(RTLActions.CLOSE_CHANNEL_CL),
    mergeMap((action: RTLActions.CloseChannelCL) => {
      const queryParam = action.payload.timeoutSec ? '?unilateralTimeout =' + action.payload.timeoutSec : '';
      return this.httpClient.delete(this.CHILD_API_URL + environment.CHANNELS_API + '/' + action.payload.channelId + queryParam)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.FetchChannelsCL());
            this.store.dispatch(new RTLActions.OpenSnackBar('Channel Closed Successfully!'));
            return {
              type: RTLActions.REMOVE_CHANNEL_CL,
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
    ofType(RTLActions.FETCH_PAYMENTS_CL),
    mergeMap((action: RTLActions.FetchPaymentsCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchPaymentsCL'));
      return this.httpClient.get<PaymentCL[]>(this.CHILD_API_URL + environment.PAYMENTS_API);
    }),
    map((payments) => {
      this.logger.info(payments);
      return {
        type: RTLActions.SET_PAYMENTS_CL,
        payload: payments ? payments : []
      };
    }),
    catchError((err: any) => {
      this.handleErrorWithoutAlert('FetchPaymentsCL', 'Fetching Payments Failed.', err);
      return of({type: RTLActions.VOID});
    }
  ));

  @Effect()
  decodePaymentCL = this.actions$.pipe(
    ofType(RTLActions.DECODE_PAYMENT_CL),
    mergeMap((action: RTLActions.DecodePaymentCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('DecodePaymentCL'));
      return this.httpClient.get(this.CHILD_API_URL + environment.PAYMENTS_API + '/' + action.payload.routeParam)
        .pipe(
          map((decodedPayment) => {
            this.logger.info(decodedPayment);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.SET_DECODED_PAYMENT_CL,
              payload: decodedPayment ? decodedPayment : {}
            };
          }),
          catchError((err: any) => {
            if (action.payload.fromDialog) {
              this.handleErrorWithoutAlert('DecodePaymentCL', 'Decode Payment Failed.', err);
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
    ofType(RTLActions.SET_DECODED_PAYMENT_CL),
    map((action: RTLActions.SetDecodedPaymentCL) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  sendPaymentCL = this.actions$.pipe(
    ofType(RTLActions.SEND_PAYMENT_CL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [RTLActions.SendPaymentCL, any]) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('SendPaymentCL'));      
      return this.httpClient.post(this.CHILD_API_URL + environment.PAYMENTS_API, action.payload)
        .pipe(
          map((sendRes: any) => {
            this.logger.info(sendRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            if (sendRes.error) {
              this.logger.error('Error: ' + sendRes.payment_error);
              const myErr = {status: sendRes.payment_error.status, error: sendRes.payment_error.error && sendRes.payment_error.error.error && typeof(sendRes.payment_error.error.error) === 'object' ? sendRes.payment_error.error.error : {error: sendRes.payment_error.error && sendRes.payment_error.error.error ? sendRes.payment_error.error.error : 'Unknown Error'}};
              if (action.payload.fromDialog) {
                this.handleErrorWithoutAlert('SendPaymentCL', 'Send Payment Failed.', myErr);
              } else {
                this.handleErrorWithAlert('ERROR', 'Send Payment Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/transactions', myErr);
              }
              return of({type: RTLActions.VOID});
            } else {
              this.store.dispatch(new RTLActions.OpenSnackBar('Payment Sent Successfully!'));
              this.store.dispatch(new RTLActions.FetchChannelsCL());
              this.store.dispatch(new RTLActions.FetchBalanceCL());
              this.store.dispatch(new RTLActions.FetchPaymentsCL());
              this.store.dispatch(new RTLActions.SetDecodedPaymentCL({}));
              return {
                type: RTLActions.SEND_PAYMENT_STATUS_CL,
                payload: sendRes
              };
            }
          }),
          catchError((err: any) => {
            this.logger.error('Error: ' + JSON.stringify(err));
            const myErr = {status: err.status, error: err.error && err.error.error && typeof(err.error.error) === 'object' ? err.error.error : {error: err.error && err.error.error ? err.error.error : 'Unknown Error'}};
            if (action.payload.fromDialog) {
              this.handleErrorWithoutAlert('SendPaymentCL', 'Send Payment Failed.', myErr);
            } else {
              this.handleErrorWithAlert('ERROR', 'Send Payment Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/transactions', myErr);
            }
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  queryRoutesFetchCL = this.actions$.pipe(
    ofType(RTLActions.GET_QUERY_ROUTES_CL),
    mergeMap((action: RTLActions.GetQueryRoutesCL) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/getRoute/' + action.payload.destPubkey + '/' + action.payload.amount)
        .pipe(
          map((qrRes: any) => {
            this.logger.info(qrRes);
            return {
              type: RTLActions.SET_QUERY_ROUTES_CL,
              payload: qrRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.SetQueryRoutesCL({ routes: [] }));
            this.handleErrorWithAlert('ERROR', 'Get Query Routes Failed', this.CHILD_API_URL + environment.NETWORK_API + '/getRoute/' + action.payload.destPubkey + '/' + action.payload.amount, err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect({ dispatch: false })
  setQueryRoutesCL = this.actions$.pipe(
    ofType(RTLActions.SET_QUERY_ROUTES_CL),
    map((action: RTLActions.SetQueryRoutesCL) => {
      return action.payload;
    })
  );

  @Effect()
  peerLookupCL = this.actions$.pipe(
    ofType(RTLActions.PEER_LOOKUP_CL),
    mergeMap((action: RTLActions.PeerLookupCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('LookupCL'));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/listNode/' + action.payload)
        .pipe(
          map((resPeer) => {
            this.logger.info(resPeer);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.SET_LOOKUP_CL,
              payload: resPeer
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorCl({ action: 'LookupCL', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Peer Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/listNode/' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  channelLookupCL = this.actions$.pipe(
    ofType(RTLActions.CHANNEL_LOOKUP_CL),
    mergeMap((action: RTLActions.ChannelLookupCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('LookupCL'));
      return this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/listChannel/' + action.payload.shortChannelID)
        .pipe(
          map((resChannel) => {
            this.logger.info(resChannel);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.SET_LOOKUP_CL,
              payload: resChannel
            };
          }),
          catchError((err: any) => {
            if(action.payload.showError) {
              this.store.dispatch(new RTLActions.EffectErrorCl({ action: 'LookupCL', code: err.status, message: err.error.message }));
              this.handleErrorWithAlert('ERROR', 'Channel Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/listChannel/' + action.payload.shortChannelID, err);
            } else {
              this.store.dispatch(new RTLActions.CloseSpinner());
            }
            this.store.dispatch(new RTLActions.SetLookupCL([]));
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  invoiceLookupCL = this.actions$.pipe(
    ofType(RTLActions.INVOICE_LOOKUP_CL),
    mergeMap((action: RTLActions.InvoiceLookupCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('LookupCL'));
      return this.httpClient.get(this.CHILD_API_URL + environment.INVOICES_API + '/listInvoice?label=' + action.payload)
        .pipe(
          map((resInvoice) => {
            this.logger.info(resInvoice);
            this.store.dispatch(new RTLActions.CloseSpinner());
            return {
              type: RTLActions.SET_LOOKUP_CL,
              payload: resInvoice
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorCl({ action: 'LookupCL', code: err.status, message: err.error.message }));
            this.handleErrorWithAlert('ERROR', 'Invoice Lookup Failed', this.CHILD_API_URL + environment.NETWORK_API + '/listInvoice?label=' + action.payload, err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect({ dispatch: false })
  setLookupCL = this.actions$.pipe(
    ofType(RTLActions.SET_LOOKUP_CL),
    map((action: RTLActions.SetLookupCL) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  fetchForwardingHistoryCL = this.actions$.pipe(
    ofType(RTLActions.GET_FORWARDING_HISTORY_CL),
    mergeMap((action: RTLActions.GetForwardingHistoryCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('GetForwardingHistoryCL'));
      // const queryHeaders: SwitchReq = {
      //   num_max_events: action.payload.num_max_events, index_offset: action.payload.index_offset, end_time: action.payload.end_time, start_time: action.payload.start_time
      // };
      // return this.httpClient.post(this.CHILD_API_URL + environment.SWITCH_API, queryHeaders)
      return this.httpClient.get(this.CHILD_API_URL + environment.CHANNELS_API + '/listForwards')
        .pipe(
          map((fhRes: any) => {
            this.logger.info(fhRes);
            return {
              type: RTLActions.SET_FORWARDING_HISTORY_CL,
              payload: fhRes
            };
          }),
          catchError((err: any) => {
            this.store.dispatch(new RTLActions.EffectErrorCl({ action: 'GetForwardingHistory', code: err.status, message: err.error.error }));
            this.handleErrorWithAlert('ERROR', 'Get Forwarding History Failed', this.CHILD_API_URL + environment.CHANNELS_API + '/listForwards', err);
            return of({type: RTLActions.VOID});
          })
        );
    })
  );

  @Effect()
  deleteExpiredInvoiceCL = this.actions$.pipe(
    ofType(RTLActions.DELETE_EXPIRED_INVOICE_CL),
    mergeMap((action: RTLActions.DeleteExpiredInvoiceCL) => {
      const queryStr = (action.payload) ?  '?maxexpiry=' + action.payload : '';
      return this.httpClient.delete(this.CHILD_API_URL + environment.INVOICES_API + queryStr)
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenSnackBar('Invoices Deleted Successfully!'));
            return {
              type: RTLActions.FETCH_INVOICES_CL,
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
    ofType(RTLActions.SAVE_NEW_INVOICE_CL),
    mergeMap((action: RTLActions.SaveNewInvoiceCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('SaveNewInvoiceCL'));
      return this.httpClient.post(this.CHILD_API_URL + environment.INVOICES_API, {
        label: action.payload.label, amount: action.payload.amount, description: action.payload.description, expiry: action.payload.expiry, private: action.payload.private
      })
        .pipe(
          map((postRes: InvoiceCL) => {
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
              type: RTLActions.FETCH_INVOICES_CL,
              payload: { num_max_invoices: 100, reversed: true }
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('SaveNewInvoiceCL', 'Add Invoice Failed.', err);
            return of({type: RTLActions.VOID});
          })
        );
    }
    ));

  @Effect()
  invoicesFetchCL = this.actions$.pipe(
    ofType(RTLActions.FETCH_INVOICES_CL),
    mergeMap((action: RTLActions.FetchInvoicesCL) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchInvoicesCL'));
      const num_max_invoices = (action.payload.num_max_invoices) ? action.payload.num_max_invoices : 100;
      const index_offset = (action.payload.index_offset) ? action.payload.index_offset : 0;
      const reversed = (action.payload.reversed) ? action.payload.reversed : false;
      return this.httpClient.get<ListInvoicesCL>(this.CHILD_API_URL + environment.INVOICES_API + '?num_max_invoices=' + num_max_invoices + '&index_offset=' + index_offset + '&reversed=' + reversed)
        .pipe(map((res: ListInvoicesCL) => {
          this.logger.info(res);
          this.store.dispatch(new RTLActions.SetTotalInvoicesCL(res.invoices ? res.invoices.length : 0));
          return {
            type: RTLActions.SET_INVOICES_CL,
            payload: res
          };
        }),
          catchError((err: any) => {
            this.handleErrorWithoutAlert('FetchInvoicesCL', 'Fetching Invoices Failed.', err);
            return of({type: RTLActions.VOID});
          }
        ));
    }));

    @Effect()
    SetChannelTransactionCL = this.actions$.pipe(
      ofType(RTLActions.SET_CHANNEL_TRANSACTION_CL),
      mergeMap((action: RTLActions.SetChannelTransactionCL) => {
        this.store.dispatch(new RTLActions.ClearEffectErrorCl('SetChannelTransactionCL'));
        return this.httpClient.post(this.CHILD_API_URL + environment.ON_CHAIN_API, action.payload)
        .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.FetchBalanceCL());
          return {
            type: RTLActions.SET_CHANNEL_TRANSACTION_RES_CL,
            payload: postRes
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithoutAlert('SetChannelTransactionCL', 'Sending Fund Failed.', err);
          return of({type: RTLActions.VOID});
        }));
      })
    );

  initializeRemainingData(info: any, landingPage: string) {
    this.sessionService.setItem('clUnlocked', 'true');
    const node_data = {
      identity_pubkey: info.id,
      alias: info.alias,
      testnet: (info.network === 'testnet' || info.network === 'litecoin-testnet') ? true : false,
      chains: info.chains,
      uris: info.uris,      
      version: info.version,
      api_version: info.api_version,
      currency_unit: 'BTC',
      smaller_currency_unit: 'Sats',
      numberOfPendingChannels: info.num_pending_channels
    };
    this.store.dispatch(new RTLActions.SetNodeData(node_data));
    this.store.dispatch(new RTLActions.FetchFeesCL());
    this.store.dispatch(new RTLActions.FetchChannelsCL());
    this.store.dispatch(new RTLActions.FetchBalanceCL());
    this.store.dispatch(new RTLActions.FetchLocalRemoteBalanceCL());
    this.store.dispatch(new RTLActions.FetchFeeRatesCL('perkw'));
    this.store.dispatch(new RTLActions.FetchFeeRatesCL('perkb'));
    this.store.dispatch(new RTLActions.FetchPeersCL());
    this.store.dispatch(new RTLActions.GetForwardingHistoryCL());
    let newRoute = this.location.path();
    if(newRoute.includes('/lnd/')) {
      newRoute = newRoute.replace('/lnd/', '/cl/');
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
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.EffectErrorCl({ action: actionName, code: err.status.toString(), message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.message && typeof err.error.error.error.error.message === 'string') ? err.error.error.error.error.message : (err.error.error && err.error.error.error && err.error.error.error.message && typeof err.error.error.error.message === 'string') ? err.error.error.error.message : (err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message : (err.error.message && typeof err.error.message === 'string') ? err.error.message : typeof err.error === 'string' ? err.error : genericErrorMessage }));
    }
  }

  handleErrorWithAlert(alerType: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {
    this.logger.error(err);
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirected to Login.'));
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
