import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, throwError, of } from 'rxjs';
import { catchError, takeUntil, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ErrorMessageComponent } from '../components/data-modal/error-message/error-message.component';
import { CommonService } from './common.service';
import { LoggerService } from './logger.service';
import { API_URL, API_END_POINTS, AlertTypeEnum, UI_MESSAGES } from './consts-enums-functions';
import { ListSwaps } from '../models/boltzModels';
import { closeSpinner, logout, openAlert, openSpinner } from '../../store/rtl.actions';

import { RTLState } from '../../store/rtl.state';

@Injectable()
export class BoltzService implements OnDestroy {

  private swapUrl = '';
  private swaps: ListSwaps = {};
  public swapsChanged = new BehaviorSubject<ListSwaps>({});
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService) { }

  getSwapsList() {
    return this.swaps;
  }

  listSwaps() {
    this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_BOLTZ_SWAPS }));
    this.swapUrl = API_URL + API_END_POINTS.BOLTZ_API + '/listSwaps';
    this.httpClient.get(this.swapUrl).
      pipe(takeUntil(this.unSubs[0])).
      subscribe({
        next: (swapResponse: ListSwaps) => {
          this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_BOLTZ_SWAPS }));
          this.swaps = swapResponse;
          this.swapsChanged.next(this.swaps);
        }, error: (err) => this.swapsChanged.error(this.handleErrorWithAlert(UI_MESSAGES.GET_BOLTZ_SWAPS, this.swapUrl, err))
      });
  }

  swapInfo(id: string) {
    this.swapUrl = API_URL + API_END_POINTS.BOLTZ_API + '/swapInfo/' + id;
    return this.httpClient.get(this.swapUrl).pipe(catchError((err) => of(this.handleErrorWithAlert(UI_MESSAGES.NO_SPINNER, this.swapUrl, err))));
  }

  serviceInfo() {
    this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_SERVICE_INFO }));
    this.swapUrl = API_URL + API_END_POINTS.BOLTZ_API + '/serviceInfo';
    return this.httpClient.get(this.swapUrl).pipe(
      takeUntil(this.unSubs[1]),
      map((res) => {
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_SERVICE_INFO }));
        return res;
      }),
      catchError((err) => of(this.handleErrorWithAlert(UI_MESSAGES.GET_SERVICE_INFO, this.swapUrl, err)))
    );
  }

  swapOut(amount: number, address: string, acceptZeroConf: boolean) {
    const requestBody = { amount: amount, address: address, acceptZeroConf: acceptZeroConf };
    this.swapUrl = API_URL + API_END_POINTS.BOLTZ_API + '/createreverseswap';
    return this.httpClient.post(this.swapUrl, requestBody).pipe(catchError((err) => this.handleErrorWithoutAlert('Swap Out for Address: ' + address, UI_MESSAGES.NO_SPINNER, err)));
  }

  swapIn(amount: number) {
    const requestBody = { amount: amount };
    this.swapUrl = API_URL + API_END_POINTS.BOLTZ_API + '/createswap';
    return this.httpClient.post(this.swapUrl, requestBody).pipe(catchError((err) => this.handleErrorWithoutAlert('Swap In for Amount: ' + amount, UI_MESSAGES.NO_SPINNER, err)));
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, err: { status: number, error: any }) {
    let errMsg = '';
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    this.store.dispatch(closeSpinner({ payload: uiMessage }));
    if (err.status === 401) {
      errMsg = 'Unauthorized User.';
      this.logger.info('Redirecting to Login');
      this.store.dispatch(logout());
    } else if (err.status === 503) {
      errMsg = 'Unable to Connect to Boltz Server.';
      this.store.dispatch(openAlert({
        payload: {
          data: {
            type: 'ERROR',
            alertTitle: 'Boltz Not Connected',
            message: { code: err.status, message: 'Unable to Connect to Boltz Server', URL: actionName },
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
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(logout());
    }
    this.logger.error(err);
    this.store.dispatch(closeSpinner({ payload: uiMessage }));
    if (err.status === 401) {
      errMsg = 'Unauthorized User.';
      this.logger.info('Redirecting to Login');
      this.store.dispatch(logout());
    } else if (err.status === 503) {
      errMsg = 'Unable to Connect to Boltz Server.';
      setTimeout(() => {
        this.store.dispatch(openAlert({
          payload: {
            data: {
              type: 'ERROR',
              alertTitle: 'Boltz Not Connected',
              message: { code: err.status, message: 'Unable to Connect to Boltz Server', URL: errURL },
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
