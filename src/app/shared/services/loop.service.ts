import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { environment, API_URL } from '../../../environments/environment';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { LoggerService } from '../../shared/services/logger.service';
import { AlertTypeEnum } from '../../shared/services/consts-enums-functions';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Injectable()
export class LoopService {
  private CHILD_API_URL = API_URL + '/lnd';
  private loopUrl = '';

  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  loopOut(amount: number, chanId: string, targetConf: number, swapRoutingFee: number, minerFee: number, prepayRoutingFee: number, prepayAmt: number, swapFee: number, swapPublicationDeadline: number, destAddress: string) {
    let requestBody = { amount: amount, targetConf: targetConf, swapRoutingFee: swapRoutingFee, minerFee: minerFee, prepayRoutingFee: prepayRoutingFee, prepayAmt: prepayAmt, swapFee: swapFee, swapPublicationDeadline: swapPublicationDeadline, destAddress: destAddress };
    if (chanId !== '') { requestBody['chanId'] = chanId; }
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out';
    return this.httpClient.post(this.loopUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Loop Out for Channel: ' + chanId, err)));
  }

  getLoopOutTerms() {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/terms';
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Loop Out Terms', err)));
  }

  getLoopOutQuote(amount: number, targetConf: number, swapPublicationDeadline: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', swapPublicationDeadline.toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/quote/' + amount;
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(catchError(err => this.handleErrorWithoutAlert('Loop Out Quote', err)));
  }

  getLoopOutTermsAndQuotes(targetConf: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', (new Date().getTime() + (30 * 60000)).toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/termsAndQuotes';
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(catchError(err => {
      return this.handleErrorWithAlert(this.loopUrl, err);
    }));
  }

  loopIn(amount: number, swapFee: number, minerFee: number, lastHop: string, externalHtlc: boolean) {
    const requestBody = { amount: amount, swapFee: swapFee, minerFee: minerFee, lastHop: lastHop, externalHtlc: externalHtlc };
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in';
    return this.httpClient.post(this.loopUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Loop In', err)));
  }

  getLoopInTerms() {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in/terms';
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Loop In Terms', err)));
  }

  getLoopInQuote(amount: number, targetConf: string, swapPublicationDeadline: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', swapPublicationDeadline.toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in/quote/' + amount;
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(catchError(err => this.handleErrorWithoutAlert('Loop In Qoute', err)));
  }

  getLoopInTermsAndQuotes(targetConf: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', (new Date().getTime() + (30 * 60000)).toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in/termsAndQuotes';
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(catchError(err => {
      return this.handleErrorWithAlert(this.loopUrl, err);
    }));
  }

  getSwap(id: string) {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/swap/' + id;
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Loop Get Swap for ID: ' + id, err)));
  }

  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    this.store.dispatch(new RTLActions.CloseSpinner())
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else if (err.error.errno === 'ECONNREFUSED' || err.error.error.errno === 'ECONNREFUSED') {
      this.store.dispatch(new RTLActions.OpenAlert({
        data: {
          type: 'ERROR',
          alertTitle: 'Loop Not Connected',
          message: { code: 'ECONNREFUSED', message: 'Unable to Connect to Loop Server', URL: actionName },
          component: ErrorMessageComponent
        }
      }));
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
          alertTitle: 'Loop Not Connected',
          message: { code: 'ECONNREFUSED', message: 'Unable to Connect to Loop Server', URL: errURL },
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
