import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { environment, API_URL } from '../../../environments/environment';
import { ErrorMessageComponent } from '../components/data-modal/error-message/error-message.component';
import { LoggerService } from './logger.service';
import { AlertTypeEnum } from './consts-enums-functions';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Injectable()
export class BoltzService {
  private swapUrl = '';

  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  serviceInfo() {
    this.swapUrl = API_URL + environment.BOLTZ_API + '/serviceInfo';
    return this.httpClient.get(this.swapUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Service Info', err)));
  }

  listSwaps() {
    this.swapUrl = API_URL + environment.BOLTZ_API + '/listSwaps';
    return this.httpClient.get(this.swapUrl).pipe(catchError(err => this.handleErrorWithoutAlert('List Swaps', err)));
  }

  swapInfo(id: string) {
    this.swapUrl = API_URL + environment.BOLTZ_API + '/swapInfo/' + id;
    return this.httpClient.get(this.swapUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Swap Details for ID: ' + id, err)));
  }

  swapOut(amount: number, address: string, acceptZeroConf: boolean) {
    let requestBody = { amount: amount, address: address, acceptZeroConf: acceptZeroConf };
    this.swapUrl = API_URL + environment.BOLTZ_API + '/createreverseswap';
    return this.httpClient.post(this.swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Swap Out for Address: ' + address, err)));
  }

  swapIn(amount: number, address: string, acceptZeroConf: boolean) {
    let requestBody = { amount: amount, address: address, acceptZeroConf: acceptZeroConf };
    this.swapUrl = API_URL + environment.BOLTZ_API + '/createswap';
    return this.httpClient.post(this.swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Swap In for Address: ' + address, err)));
  }

  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    this.store.dispatch(new RTLActions.CloseSpinner())
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else if (err.error.errno === 'ECONNREFUSED' || err.error.error.errno === 'ECONNREFUSED') {
      // this.store.dispatch(new RTLActions.OpenAlert({
      //   data: {
      //     type: 'ERROR',
      //     alertTitle: 'Boltz Not Connected',
      //     message: { code: 'ECONNREFUSED', message: 'Unable to Connect to Boltz Server', URL: actionName },
      //     component: ErrorMessageComponent
      //   }
      // }));
      return throwError({ code: 'ECONNREFUSED', message: 'Unable to Connect to Boltz Server' });
    }
    return throwError(err);
  }

  handleErrorWithAlert(errURL: string, err: any) {
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    }
    err.message = (err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error :
      (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error :
      (err.error && typeof err.error === 'string') ? err.error : 'Unknown Error';
    this.logger.error(err);
    this.store.dispatch(new RTLActions.CloseSpinner())
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else if (err.errno === 'ECONNREFUSED') {
      this.store.dispatch(new RTLActions.OpenAlert({
        data: {
          type: 'ERROR',
          alertTitle: 'Boltz Not Connected',
          message: { code: 'ECONNREFUSED', message: 'Unable to Connect to Boltz Server', URL: errURL },
          component: ErrorMessageComponent
        }
      }));
    } else {
      this.store.dispatch(new RTLActions.OpenAlert({data: {
          type: AlertTypeEnum.ERROR,
          alertTitle: 'ERROR',
          message: { code: err.code ? err.code : err.status, message: err.message ? err.message : 'Unknown Error', URL: errURL },
          component: ErrorMessageComponent
        }
      }));
    }
    return throwError(err);
  }

}
