import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { catchError, takeUntil, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { environment, API_URL } from '../../../environments/environment';
import { AlertTypeEnum, UI_MESSAGES } from '../../shared/services/consts-enums-functions';
import { LoopSwapStatus } from '../models/loopModels';
import { LoggerService } from '../../shared/services/logger.service';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Injectable()
export class LoopService implements OnDestroy {
  private CHILD_API_URL = API_URL + '/lnd';
  private loopUrl = '';
  private swaps: LoopSwapStatus[] = [];
  public swapsChanged = new BehaviorSubject<LoopSwapStatus[]>([]);
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  getSwapsList() {
    return this.swaps;
  }

  listSwaps() {
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_LOOP_SWAPS));
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/swaps';
    this.httpClient.get(this.loopUrl)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((swapResponse: LoopSwapStatus[]) => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_LOOP_SWAPS));      
      this.swaps = swapResponse;
      this.swapsChanged.next(this.swaps);
    }, err => {
      return this.handleErrorWithAlert('Loop Swaps', UI_MESSAGES.GET_LOOP_SWAPS, err);
    });
  }

  loopOut(amount: number, chanId: string, targetConf: number, swapRoutingFee: number, minerFee: number, prepayRoutingFee: number, prepayAmt: number, swapFee: number, swapPublicationDeadline: number, destAddress: string) {
    let requestBody = { amount: amount, targetConf: targetConf, swapRoutingFee: swapRoutingFee, minerFee: minerFee, prepayRoutingFee: prepayRoutingFee, prepayAmt: prepayAmt, swapFee: swapFee, swapPublicationDeadline: swapPublicationDeadline, destAddress: destAddress };
    if (chanId !== '') { requestBody['chanId'] = chanId; }
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out';
    return this.httpClient.post(this.loopUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Loop Out for Channel: ' + chanId, UI_MESSAGES.NO_SPINNER, err)));
  }

  getLoopOutTerms() {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/terms';
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Loop Out Terms', UI_MESSAGES.NO_SPINNER, err)));
  }

  getLoopOutQuote(amount: number, targetConf: number, swapPublicationDeadline: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', swapPublicationDeadline.toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/quote/' + amount;
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_QUOTE));
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(takeUntil(this.unSubs[1]),
      map(res => {
        this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_QUOTE));
        return res;
      }),
      catchError(err => this.handleErrorWithoutAlert('Loop Out Quote', UI_MESSAGES.GET_QUOTE, err)));
  }

  getLoopOutTermsAndQuotes(targetConf: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', (new Date().getTime() + (30 * 60000)).toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/out/termsAndQuotes';
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_TERMS_QUOTES));
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(takeUntil(this.unSubs[2]),
      map(res => {
        this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_TERMS_QUOTES));
        return res;
      }),
      catchError(err => {
        return this.handleErrorWithAlert(this.loopUrl, UI_MESSAGES.GET_TERMS_QUOTES, err);
    }));
  }

  loopIn(amount: number, swapFee: number, minerFee: number, lastHop: string, externalHtlc: boolean) {
    const requestBody = { amount: amount, swapFee: swapFee, minerFee: minerFee, lastHop: lastHop, externalHtlc: externalHtlc };
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in';
    return this.httpClient.post(this.loopUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Loop In', UI_MESSAGES.NO_SPINNER, err)));
  }

  getLoopInTerms() {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in/terms';
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Loop In Terms', UI_MESSAGES.NO_SPINNER, err)));
  }

  getLoopInQuote(amount: number, targetConf: string, swapPublicationDeadline: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', swapPublicationDeadline.toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in/quote/' + amount;
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_QUOTE));
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(takeUntil(this.unSubs[3]),
      map(res => {
        this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_QUOTE));
        return res;
      }),
      catchError(err => this.handleErrorWithoutAlert('Loop In Qoute', UI_MESSAGES.GET_QUOTE, err)));
  }

  getLoopInTermsAndQuotes(targetConf: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', (new Date().getTime() + (30 * 60000)).toString());
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/in/termsAndQuotes';
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_TERMS_QUOTES));
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(takeUntil(this.unSubs[4]),
    map(res => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_TERMS_QUOTES));
      return res;
    }),catchError(err => {
      return this.handleErrorWithAlert(this.loopUrl, UI_MESSAGES.GET_TERMS_QUOTES, err);
    }));
  }

  getSwap(id: string) {
    this.loopUrl = this.CHILD_API_URL + environment.LOOP_API + '/swap/' + id;
    return this.httpClient.get(this.loopUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Loop Get Swap for ID: ' + id, UI_MESSAGES.NO_SPINNER, err)));
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    this.store.dispatch(new RTLActions.CloseSpinner(uiMessage));
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

  handleErrorWithAlert(uiMessage: string, errURL: string, err: any) {
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    }
    err.message = (err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error :
      (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error :
      (err.error && typeof err.error === 'string') ? err.error : 'Unknown Error';
    this.logger.error(err);
    this.store.dispatch(new RTLActions.CloseSpinner(uiMessage));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else if (err.error.errno === 'ECONNREFUSED' || err.error.error.errno === 'ECONNREFUSED') {
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

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next(null);
      completeSub.complete();
    });
  }
}
