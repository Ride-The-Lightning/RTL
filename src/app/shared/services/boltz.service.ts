import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { environment, API_URL } from '../../../environments/environment';
import { ErrorMessageComponent } from '../components/data-modal/error-message/error-message.component';
import { LoggerService } from './logger.service';
import { AlertTypeEnum } from './consts-enums-functions';
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
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Boltz Swaps...'));
    this.swapUrl = API_URL + environment.BOLTZ_API + '/listSwaps';
    this.httpClient.get(this.swapUrl)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((swapResponse: ListSwaps) => {
      this.store.dispatch(new RTLActions.CloseSpinner());      
      this.swaps = swapResponse;
      this.swapsChanged.next(this.swaps);
    }, err => {
      return this.handleErrorWithAlert('List Swaps', err);
    });
  }

  swapInfo(id: string) {
    this.swapUrl = API_URL + environment.BOLTZ_API + '/swapInfo/' + id;
    return this.httpClient.get(this.swapUrl).pipe(catchError(err => this.handleErrorWithAlert(this.swapUrl, err)));
  }

  serviceInfo() {
    this.swapUrl = API_URL + environment.BOLTZ_API + '/serviceInfo';
    return this.httpClient.get(this.swapUrl).pipe(catchError(err => this.handleErrorWithAlert('Service Info', err)));
  }

  swapOut(amount: number, address: string) {
    let requestBody = { amount: amount, address: address };
    this.swapUrl = API_URL + environment.BOLTZ_API + '/createreverseswap';
    return this.httpClient.post(this.swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Swap Out for Address: ' + address, err)));
  }

  swapIn(amount: number) {
    let requestBody = { amount: amount };
    this.swapUrl = API_URL + environment.BOLTZ_API + '/createswap';
    return this.httpClient.post(this.swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Swap In for Amount: ' + amount, err)));
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

  handleErrorWithAlert(errURL: string, err: any) {
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    }
    this.logger.error(err);
    this.store.dispatch(new RTLActions.CloseSpinner())
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else if (err.errno === 'ECONNREFUSED' || err.error.errno === 'ECONNREFUSED' || err.error.error.errno === 'ECONNREFUSED') {
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
      completeSub.next();
      completeSub.complete();
    });
  }
}
