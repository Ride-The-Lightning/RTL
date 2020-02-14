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

  loopOut(amount: number, chanId: string, targetConf: number, swapRoutingFee: number, minerFee: number, prepayRoutingFee: number, prepayAmt: number, swapFee: number) {
    const requestBody = { amount: amount, chanId: chanId, targetConf: targetConf, swapRoutingFee: swapRoutingFee, minerFee: minerFee, prepayRoutingFee: prepayRoutingFee, prepayAmt: prepayAmt, swapFee: swapFee };
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out';
    return this.httpClient.post(this.loopUrl, requestBody).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  getLoopOutTerms() {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/terms';
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  getLoopOutQuote(amount: number, targetConf: number) {
    const params = new HttpParams().set('targetConf', targetConf.toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/quote/' + amount;
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  getLoopOutTermsAndQuotes(targetConf: number) {
    const params = new HttpParams().set('targetConf', targetConf.toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/termsAndQuotes';
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  loopIn(amount: number, chanId: string) {
    const requestBody = { amount: amount, chanId: chanId };
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in';
    return this.httpClient.post(this.loopUrl, requestBody).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  getLoopInTerms() {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in/terms';
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  getLoopInQuote(amount: number, targetConf: string) {
    const params = new HttpParams().set('targetConf', targetConf);
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in/quote/' + amount;
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  getLoopInTermsAndQuotes(targetConf: number) {
    const params = new HttpParams().set('targetConf', targetConf.toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in/termsAndQuotes';
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(catchError(err => this.handleErrorWithoutAlert('Loop In Terms and Quotes', err)));
  }

  getSwap(id: string) {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/swap/' + id;
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    this.store.dispatch(new RTLActions.CloseSpinner())
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    }
    return throwError(err);
  }

  handleErrorWithAlert(err: any, errURL: string) {
    this.logger.error(err);
    this.store.dispatch(new RTLActions.CloseSpinner())
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else {
      this.store.dispatch(new RTLActions.OpenAlert({
        width: '55%', data: {
          type: AlertTypeEnum.ERROR,
          alertTitle: 'ERROR',
          message: { code: err.status ? err.status : 'Unknown Error', message: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : 'Unknown Error', URL: errURL },
          component: ErrorMessageComponent
        }
      }));
    }
    return throwError(err);
  }

}
