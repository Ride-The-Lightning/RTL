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
// import { CLInvoiceInformationComponent } from '../transactions/invoice-information-modal/invoice-information.component';
// import { CLOpenChannelComponent } from '../peers-channels/channels/open-channel-modal/open-channel.component';
import { GetInfoECLR } from '../../shared/models/eclrModels';
// import { GetInfoECLR, FeesCL, BalanceCL, LocalRemoteBalanceCL, PaymentCL, FeeRatesCL, ListInvoicesCL, InvoiceCL, PeerCL } from '../../shared/models/clModels';
import { AlertTypeEnum } from '../../shared/services/consts-enums-functions';
import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';
import * as fromECLRReducers from './eclr.reducers';

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
    ofType(RTLActions.FETCH_INFO_ECLR),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [RTLActions.FetchInfoECLR, fromRTLReducer.RootState]) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorEclr('FetchInfoECLR'));
      return this.httpClient.get<GetInfoECLR>(this.CHILD_API_URL + environment.GETINFO_API)
        .pipe(
          takeUntil(this.actions$.pipe(ofType(RTLActions.SET_SELECTED_NODE))),
          map((info) => {
            this.logger.info(info);
            this.initializeRemainingData(info, action.payload.loadPage);
            return {
              type: RTLActions.SET_INFO_ECLR,
              payload: info ? info : {}
            };
          }),
          catchError((err) => {
            const code = (err.error && err.error.error && err.error.error.message && err.error.error.message.code) ? err.error.error.message.code : (err.error && err.error.error && err.error.error.code) ? err.error.error.code : err.status ? err.status : '';
            const message = ((err.error && err.error.message) ? err.error.message + ' ' : '') + ((err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error && err.error.error && err.error.error.errno && typeof err.error.error.errno === 'string') ? err.error.error.errno : (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error : (err.error && typeof err.error === 'string') ? err.error : 'Unknown Error');
            this.router.navigate(['/error'], { state: { errorCode: code, errorMessage: message }});
            this.handleErrorWithoutAlert('FetchInfoECLR', 'Fetching Node Info Failed.', err);            
            return of({type: RTLActions.VOID});
          })
        );
    }
  ));

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
    // this.store.dispatch(new RTLActions.FetchFeesCL());
    // this.store.dispatch(new RTLActions.FetchChannelsCL());
    // this.store.dispatch(new RTLActions.FetchBalanceCL());
    // this.store.dispatch(new RTLActions.FetchLocalRemoteBalanceCL());
    // this.store.dispatch(new RTLActions.FetchFeeRatesCL('perkw'));
    // this.store.dispatch(new RTLActions.FetchFeeRatesCL('perkb'));
    // this.store.dispatch(new RTLActions.FetchPeersCL());
    // this.store.dispatch(new RTLActions.GetForwardingHistoryCL());
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
      this.store.dispatch(new RTLActions.EffectErrorEclr({ action: actionName, code: err.status.toString(), message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.message && typeof err.error.error.error.error.message === 'string') ? err.error.error.error.error.message : (err.error.error && err.error.error.error && err.error.error.error.message && typeof err.error.error.error.message === 'string') ? err.error.error.error.message : (err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message : (err.error.message && typeof err.error.message === 'string') ? err.error.message : typeof err.error === 'string' ? err.error : genericErrorMessage }));
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
