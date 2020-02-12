import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { webSocket } from 'rxjs/webSocket'; 

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
  public websocket:any;

  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  loopOut(amount: number, chanId: string) {
    const requestBody = { amount: amount, chanId: chanId };
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out';
    return this.httpClient.post(this.loopUrl, requestBody).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  getLoopOutTerms() {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/terms';
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  getLoopOutQuote(amount: number, targetConf: string) {
    const params = new HttpParams().set('targetConf', targetConf);
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
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));
  }

  onOpen(evt) {
    this.writeToScreen("CONNECTED");
    this.doSend("WebSocket rocks 1");
    this.doSend("WebSocket rocks 2");
  }

  onClose(evt)
  {
    this.writeToScreen("DISCONNECTED");
  }

  onMessage(evt)
  {
    this.writeToScreen('RECEIVED: ' + evt.data);
    // this.websocket.close();
  }

  onError(evt)
  {
    this.writeToScreen(evt);
  }

  doSend(message)
  {
    this.writeToScreen("SENT: " + message);
    this.websocket.send(message);
  }

  writeToScreen(message) {
    console.warn(message);
  }

  monitorLoop() {
    // this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/monitor';
    // return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithAlert(err, this.loopUrl)));

    this.loopUrl = 'http://localhost:8081/v1/loop/monitor';
    this.httpClient.get(this.loopUrl).subscribe(log => {
      console.warn(log);
    });

    // let self = this;
    // this.websocket = new WebSocket('wss://echo.websocket.org/'); // 'ws://localhost:8081/v1/loop/monitor'
    // this.websocket.onopen = function(evt) { self.onOpen(evt) };
    // this.websocket.onclose = function(evt) { self.onClose(evt) };
    // this.websocket.onmessage = function(evt) { self.onMessage(evt) };
    // this.websocket.onerror = function(evt) { self.onError(evt) };    
  }

  handleErrorWithAlert(err: any, errURL: string) {
    this.logger.error(err);
    this.store.dispatch(new RTLActions.CloseSpinner())
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner());
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
