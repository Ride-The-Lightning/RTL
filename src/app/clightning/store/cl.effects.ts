import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Subject, of } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom } from 'rxjs/operators';

import { environment, API_URL } from '../../../environments/environment';
import { LoggerService } from '../../shared/services/logger.service';
import { GetInfoCL, FeesCL, BalanceCL, LocalRemoteBalanceCL } from '../../shared/models/clModels';

import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';

@Injectable()
export class CLEffects implements OnDestroy {
  CHILD_API_URL = API_URL + '/cl';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<fromRTLReducer.RTLState>,
    private logger: LoggerService) { }

  @Effect()
  infoFetchCL = this.actions$.pipe(
    ofType(RTLActions.FETCH_INFO_CL),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchInfoCL'));
      return this.httpClient.get<GetInfoCL>(this.CHILD_API_URL + environment.GETINFO_API)
        .pipe(
          map((info) => {
            this.logger.info(info);
            let chainObj = { chain: '', network: '' };
            if (info.network === 'testnet') {
              chainObj.chain = 'Bitcoin';
              chainObj.network = 'Testnet';
            } else if (info.network === 'bitcoin') {
              chainObj.chain = 'Bitcoin';
              chainObj.network = 'Mainnet';
            } else if (info.network === 'litecoin') {
              chainObj.chain = 'Litecoin';
              chainObj.network = 'Mainnet';
            } else if (info.network === 'litecoin-testnet') {
              chainObj.chain = 'Litecoin';
              chainObj.network = 'Testnet';
            }
            sessionStorage.setItem('clUnlocked', 'true');
            const node_data = {
              identity_pubkey: info.id,
              alias: info.alias,
              testnet: (info.network === 'testnet' || info.network === 'litecoin-testnet') ? true : false,
              chains: [chainObj],
              version: info.version,
              currency_unit: 'BTC',
              smaller_currency_unit: 'Sats',
              numberOfPendingChannels: info.num_pending_channels
            };
            this.store.dispatch(new RTLActions.SetNodeData(node_data));
            return {
              type: RTLActions.SET_INFO_CL,
              payload: (undefined !== info) ? info : {}
            };
          }),
          catchError((err) => {
            return this.handleErrorWithAlert('ERROR', 'Get Info Failed', this.CHILD_API_URL + environment.GETINFO_API, err);
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
        payload: (undefined !== fees) ? fees : {}
      };
    }),
    catchError((err: any) => {
      return this.handleErrorWithoutAlert('FetchFeesCL', err);
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
        payload: (undefined !== balance) ? balance : {}
      };
    }),
    catchError((err: any) => {
      return this.handleErrorWithoutAlert('FetchBalanceCL', err);
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
        payload: (undefined !== lrBalance) ? lrBalance : {}
      };
    }),
    catchError((err: any) => {
      return this.handleErrorWithoutAlert('FetchLocalRemoteBalanceCL', err);
    }
  ));

  @Effect()
  getNewAddressCL = this.actions$.pipe(
    ofType(RTLActions.GET_NEW_ADDRESS_CL),
    mergeMap((action: RTLActions.GetNewAddressCL) => {
      return this.httpClient.get(this.CHILD_API_URL + environment.NEW_ADDRESS_API + '?type=' + action.payload.addressId)
        .pipe(map((newAddress: any) => {
          this.logger.info(newAddress);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SET_NEW_ADDRESS_CL,
            payload: (undefined !== newAddress && undefined !== newAddress.address) ? newAddress.address : {}
          };
        }),
        catchError((err: any) => {
            return this.handleErrorWithAlert('ERROR', 'Generate New Address Failed', this.CHILD_API_URL + environment.NEW_ADDRESS_API + '?type=' + action.payload.addressId, err);
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
              payload: (undefined !== peers) ? peers : []
            };
          }),
          catchError((err: any) => {
            return this.handleErrorWithoutAlert('FetchPeersCL', err);
          })
        );
    }
    ));

  @Effect()
  saveNewPeerCL = this.actions$.pipe(
    ofType(RTLActions.SAVE_NEW_PEER_CL),
    mergeMap((action: RTLActions.SaveNewPeerCL) => {
      return this.httpClient.post(this.CHILD_API_URL + environment.PEERS_API, { id: action.payload.id })
        .pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: { type: 'SUCCESS', titleMessage: 'Peer Added Successfully!' } }));
            return {
              type: RTLActions.SET_PEERS_CL,
              payload: (undefined !== postRes && postRes.length > 0) ? postRes : []
            };
          }),
          catchError((err: any) => {
            return this.handleErrorWithAlert('ERROR', 'Add Peer Failed', this.CHILD_API_URL + environment.PEERS_API, err);
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
            this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: { type: 'SUCCESS', titleMessage: 'Peer Detached Successfully!' } }));
            return {
              type: RTLActions.REMOVE_PEER_CL,
              payload: { id: action.payload.id }
            };
          }),
          catchError((err: any) => {
            return this.handleErrorWithAlert('ERROR', 'Unable to Detach Peer. Try again later.', this.CHILD_API_URL + environment.PEERS_API + '/' + action.payload.id, err);
          })
        );
    }
  ));

  handleErrorWithoutAlert(actionName: string, err: {status: number, error: any}) {
    this.logger.error(err);
    if(err.status === 401) {
      this.logger.info('Redirecting to Signin');
      return of({ type: RTLActions.SIGNOUT });  
    } else {
      this.store.dispatch(new RTLActions.EffectErrorCl({ action: actionName, code: err.status.toString(), message: err.error.error }));
      this.logger.error(err);
      return of({type:RTLActions.VOID});
    }
  }

  handleErrorWithAlert(alerType: string, alertTitle: string, errURL: string, err: {status: number, error: any}) {
    this.logger.error(err);
    if(err.status === 401) {
      this.logger.info('Redirecting to Signin');
      return of({ type: RTLActions.SIGNOUT });  
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.logger.error(err);
      return of(
        {
          type: RTLActions.OPEN_ALERT,
          payload: {
            width: '70%', data: {
              type: alerType, titleMessage: alertTitle,
              message: JSON.stringify({ code: err.status, Message: err.error.error, URL: errURL })
            }
          }
        }
      );
    }
  }

  ngOnDestroy() { 
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });    
  }

}
