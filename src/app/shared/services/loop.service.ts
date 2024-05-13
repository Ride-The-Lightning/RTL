import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Subject, throwError, of } from 'rxjs';
import { catchError, takeUntil, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { API_URL, API_END_POINTS, AlertTypeEnum, UI_MESSAGES } from '../../shared/services/consts-enums-functions';
import { LoopSwapStatus } from '../models/loopModels';
import { CommonService } from './common.service';
import { LoggerService } from '../../shared/services/logger.service';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';

import { RTLState } from '../../store/rtl.state';
import { closeSpinner, logout, openAlert, openSpinner } from '../../store/rtl.actions';

@Injectable()
export class LoopService implements OnDestroy {

  private loopUrl = '';
  private swaps: LoopSwapStatus[] = [];
  public swapsChanged = new BehaviorSubject<LoopSwapStatus[]>([]);
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService) { }

  getLoopInfo() {
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/info';
    return this.httpClient.get<any>(this.loopUrl);
  }

  getSwapsList() {
    return this.swaps;
  }

  listSwaps() {
    this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_LOOP_SWAPS }));
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/swaps';
    this.httpClient.get<LoopSwapStatus[]>(this.loopUrl).pipe(takeUntil(this.unSubs[0])).
      subscribe({
        next: (swapResponse: LoopSwapStatus[]) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_LOOP_SWAPS }));
          this.swaps = swapResponse;
          this.swapsChanged.next(this.swaps);
        },
        error: (err) => this.swapsChanged.error(this.handleErrorWithAlert(UI_MESSAGES.GET_LOOP_SWAPS, this.loopUrl, err))
      });
  }

  loopOut(amount: number, chanId: string, targetConf: number, swapRoutingFee: number, minerFee: number, prepayRoutingFee: number, prepayAmt: number, swapFee: number, swapPublicationDeadline: number, destAddress: string) {
    const requestBody = { amount: amount, targetConf: targetConf, swapRoutingFee: swapRoutingFee, minerFee: minerFee, prepayRoutingFee: prepayRoutingFee, prepayAmt: prepayAmt, swapFee: swapFee, swapPublicationDeadline: swapPublicationDeadline, destAddress: destAddress };
    if (chanId !== '') {
      requestBody['chanId'] = chanId;
    }
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/out';
    return this.httpClient.post(this.loopUrl, requestBody).pipe(catchError((err) => this.handleErrorWithoutAlert('Loop Out for Channel: ' + chanId, UI_MESSAGES.NO_SPINNER, err)));
  }

  getLoopOutTerms() {
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/out/terms';
    return this.httpClient.get(this.loopUrl).pipe(catchError((err) => this.handleErrorWithoutAlert('Loop Out Terms', UI_MESSAGES.NO_SPINNER, err)));
  }

  getLoopOutQuote(amount: number, targetConf: number, swapPublicationDeadline: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', swapPublicationDeadline.toString());
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/out/quote/' + amount;
    this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_QUOTE }));
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(
      takeUntil(this.unSubs[1]),
      map((res) => {
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_QUOTE }));
        return res;
      }),
      catchError((err) => this.handleErrorWithoutAlert('Loop Out Quote', UI_MESSAGES.GET_QUOTE, err))
    );
  }

  getLoopOutTermsAndQuotes(targetConf: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', (new Date().getTime() + (30 * 60000)).toString());
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/out/termsAndQuotes';
    this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_TERMS_QUOTES }));
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(
      takeUntil(this.unSubs[2]),
      map((res) => {
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_TERMS_QUOTES }));
        return res;
      }), catchError((err) => of(this.handleErrorWithAlert(UI_MESSAGES.GET_TERMS_QUOTES, this.loopUrl, err)))
    );
  }

  loopIn(amount: number, swapFee: number, minerFee: number, lastHop: string, externalHtlc: boolean) {
    const requestBody = { amount: amount, swapFee: swapFee, minerFee: minerFee, lastHop: lastHop, externalHtlc: externalHtlc };
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/in';
    return this.httpClient.post(this.loopUrl, requestBody).pipe(catchError((err) => this.handleErrorWithoutAlert('Loop In', UI_MESSAGES.NO_SPINNER, err)));
  }

  getLoopInTerms() {
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/in/terms';
    return this.httpClient.get(this.loopUrl).pipe(catchError((err) => this.handleErrorWithoutAlert('Loop In Terms', UI_MESSAGES.NO_SPINNER, err)));
  }

  getLoopInQuote(amount: number, targetConf: string, swapPublicationDeadline: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', swapPublicationDeadline.toString());
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/in/quote/' + amount;
    this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_QUOTE }));
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(
      takeUntil(this.unSubs[3]),
      map((res) => {
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_QUOTE }));
        return res;
      }),
      catchError((err) => this.handleErrorWithoutAlert('Loop In Qoute', UI_MESSAGES.GET_QUOTE, err))
    );
  }

  getLoopInTermsAndQuotes(targetConf: number) {
    let params = new HttpParams();
    params = params.append('targetConf', targetConf.toString());
    params = params.append('swapPublicationDeadline', (new Date().getTime() + (30 * 60000)).toString());
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/in/termsAndQuotes';
    this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_TERMS_QUOTES }));
    return this.httpClient.get(this.loopUrl, { params: params }).pipe(
      takeUntil(this.unSubs[4]),
      map((res) => {
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_TERMS_QUOTES }));
        return res;
      }), catchError((err) => of(this.handleErrorWithAlert(UI_MESSAGES.GET_TERMS_QUOTES, this.loopUrl, err)))
    );
  }

  getSwap(id: string) {
    this.loopUrl = API_URL + API_END_POINTS.LOOP_API + '/swap/' + id;
    return this.httpClient.get(this.loopUrl).pipe(catchError((err) => this.handleErrorWithoutAlert('Loop Get Swap for ID: ' + id, UI_MESSAGES.NO_SPINNER, err)));
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, err: { status: number, error: any }) {
    let errMsg = '';
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    this.store.dispatch(closeSpinner({ payload: uiMessage }));
    if (err.status === 401) {
      errMsg = 'Unauthorized User.';
      this.logger.info('Redirecting to Login');
      this.store.dispatch(logout({ payload: errMsg }));
    } else if (err.status === 503) {
      errMsg = 'Unable to Connect to Loop Server.';
      this.store.dispatch(openAlert({
        payload: {
          data: {
            type: 'ERROR',
            alertTitle: 'Loop Not Connected',
            message: { code: err.status, message: 'Unable to Connect to Loop Server', URL: actionName },
            component: ErrorMessageComponent
          }
        }
      }));
    } else {
      errMsg = this.commonService.extractErrorMessage(err);
    }
    return throwError(() => new Error(errMsg));
  }

  handleErrorWithAlert(uiMessage: string, errURL: string, err: any) {
    let errMsg = '';
    this.logger.error(err);
    this.store.dispatch(closeSpinner({ payload: uiMessage }));
    if (err.status === 401) {
      errMsg = 'Unauthorized User.';
      this.logger.info('Redirecting to Login');
      this.store.dispatch(logout({ payload: errMsg }));
    } else if (err.status === 503) {
      errMsg = 'Unable to Connect to Loop Server.';
      setTimeout(() => {
        this.store.dispatch(openAlert({
          payload: {
            data: {
              type: 'ERROR',
              alertTitle: 'Loop Not Connected',
              message: { code: err.status, message: 'Unable to Connect to Loop Server', URL: errURL },
              component: ErrorMessageComponent
            }
          }
        }));
      }, 100);
    } else {
      errMsg = this.commonService.extractErrorMessage(err);
      const errCode = (err.error && err.error.error && err.error.error.code) ? err.error.error.code : (err.error && err.error.code) ? err.error.code : err.code ? err.code : err.status;
      setTimeout(() => {
        this.store.dispatch(openAlert({
          payload: {
            data: {
              type: AlertTypeEnum.ERROR,
              alertTitle: 'ERROR',
              message: { code: errCode, message: errMsg, URL: errURL },
              component: ErrorMessageComponent
            }
          }
        }));
      }, 100);
    }
    return { message: errMsg };
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
