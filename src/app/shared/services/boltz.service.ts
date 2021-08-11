import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { catchError, takeUntil, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { environment, API_URL } from '../../../environments/environment';
import { ErrorMessageComponent } from '../components/data-modal/error-message/error-message.component';
import { LoggerService } from './logger.service';
import { AlertTypeEnum, UI_MESSAGES } from './consts-enums-functions';
import { ListSwaps } from '../models/boltzModels';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Injectable()
export class BoltzService implements OnDestroy {
  private swapUrl = '';
  private swaps: ListSwaps = {};
  public swapsChanged = new BehaviorSubject<ListSwaps>({});
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  getSwapsList() {
    return this.swaps;
  }

  listSwaps() {
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_BOLTZ_SWAPS));
    this.swapUrl = API_URL + environment.BOLTZ_API + '/listSwaps';
    this.httpClient.get(this.swapUrl)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((swapResponse: ListSwaps) => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_BOLTZ_SWAPS));      
      this.swaps = swapResponse;
      this.swapsChanged.next(this.swaps);
    }, (err => {
      return this.handleErrorWithAlert(UI_MESSAGES.GET_BOLTZ_SWAPS, this.swapUrl, err);
    }));
  }

  swapInfo(id: string) {
    this.swapUrl = API_URL + environment.BOLTZ_API + '/swapInfo/' + id;
    return this.httpClient.get(this.swapUrl).pipe(catchError(err => this.handleErrorWithAlert(UI_MESSAGES.NO_SPINNER, this.swapUrl, err)));
  }

  serviceInfo() {
    this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_SERVICE_INFO));
    this.swapUrl = API_URL + environment.BOLTZ_API + '/serviceInfo';
    return this.httpClient.get(this.swapUrl)
    .pipe(takeUntil(this.unSubs[1]),
    map(res => {
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_SERVICE_INFO));
      return res;
    }),
    catchError(err => this.handleErrorWithAlert(UI_MESSAGES.GET_SERVICE_INFO, this.swapUrl, err)));
  }

  swapOut(amount: number, address: string) {
    let requestBody = { amount: amount, address: address };
    this.swapUrl = API_URL + environment.BOLTZ_API + '/createreverseswap';
    return this.httpClient.post(this.swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Swap Out for Address: ' + address, UI_MESSAGES.NO_SPINNER, err)));
  }

  swapIn(amount: number) {
    let requestBody = { amount: amount };
    this.swapUrl = API_URL + environment.BOLTZ_API + '/createswap';
    return this.httpClient.post(this.swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Swap In for Amount: ' + amount, UI_MESSAGES.NO_SPINNER, err)));
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    this.store.dispatch(new RTLActions.CloseSpinner(uiMessage));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else if (err.error.code === 'ECONNREFUSED' || err.error.error.code === 'ECONNREFUSED') {
      this.store.dispatch(new RTLActions.OpenAlert({
        data: {
          type: 'ERROR',
          alertTitle: 'Boltz Not Connected',
          message: { code: 'ECONNREFUSED', message: 'Unable to Connect to Boltz Server.', URL: actionName },
          component: ErrorMessageComponent
        }
      }));
    } else if (err.error) {
      let msg = '';
      if (err.error.error) {
        if (typeof(err.error.error) === 'string') {
          msg = err.error.error;
        } else {
          if (err.error.error.code) {
            msg = msg + 'Code: ' + err.error.error.code + ', ';
          }
          if (err.error.error.message) {
            msg = msg + err.error.error.message;
          }
        }
      } else if (err.error.message) {
        msg = err.error.message;
      } else {
        msg = (typeof(err.error) === 'object') ? JSON.stringify(err.error) : err.error;
      }
      return throwError({code: err.status, message: msg});
    }
    return throwError(JSON.stringify(err));
  }

  handleErrorWithAlert(uiMessage: string, errURL: string, err: any) {
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    }
    this.logger.error(err);
    this.store.dispatch(new RTLActions.CloseSpinner(uiMessage));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else if (err.code === 'ECONNREFUSED' || err.error.code === 'ECONNREFUSED' || err.error.error.code === 'ECONNREFUSED') {
      this.store.dispatch(new RTLActions.OpenAlert({
        data: {
          type: 'ERROR',
          alertTitle: 'Boltz Not Connected',
          message: { code: 'ECONNREFUSED', message: 'Unable to Connect to Boltz Server', URL: errURL },
          component: ErrorMessageComponent
        }
      }));
    } else {
      let msg = '';
      if (err.error.error) {
        if (typeof(err.error.error) === 'string') {
          msg = err.error.error;
        } else {
          if (err.error.error.code) {
            msg = msg + 'Code: ' + err.error.error.code + ', ';
          }
          if (err.error.error.message) {
            msg = msg + err.error.error.message;
          }
        }
      } else if (err.error.message) {
        msg = err.error.message;
      } else {
        msg = (typeof(err.error) === 'object') ? JSON.stringify(err.error) : err.error;
      }
      this.store.dispatch(new RTLActions.OpenAlert({data: {
          type: AlertTypeEnum.ERROR,
          alertTitle: 'ERROR',
          message: { code: (err.error && err.error.error && err.error.error.code) ? err.error.error.code : err.status, message: msg != '' ? msg : 'Unknown Error', URL: errURL },
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
