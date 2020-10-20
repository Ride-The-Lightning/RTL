import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, throwError } from 'rxjs';
import { map, takeUntil, catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../shared/services/logger.service';
import { environment, API_URL } from '../../../environments/environment';

import { ErrorMessageComponent } from '../components/data-modal/error-message/error-message.component';
import * as LNDActions from '../../lnd/store/lnd.actions';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Injectable()
export class DataService implements OnInit, OnDestroy {
  private lnImplementation = 'LND';
  private childAPIUrl = API_URL;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private httpClient: HttpClient, private store: Store<fromRTLReducer.RTLState>, private logger: LoggerService,) {}

  ngOnInit() {}

  getChildAPIUrl() {
    return this.childAPIUrl;
  }

  getLnImplementation() {
    return this.lnImplementation;
  }

  setChildAPIUrl(lnImplementation: string) {
    this.lnImplementation = lnImplementation;    
    switch (lnImplementation) {
      case 'CLT':
        this.childAPIUrl = API_URL + '/cl';
        break;

      case 'ECL':
          this.childAPIUrl = API_URL + '/ecl';
          break;
      
      default:
        this.childAPIUrl = API_URL + '/lnd';
        break;
    }
  }

  getFiatRates() {
    return this.httpClient.get(environment.CONF_API + '/rates');
  }

  decodePayment(payment: string, fromDialog: boolean) {
    let url = this.childAPIUrl + environment.PAYREQUEST_API + '/' + payment;
    if (this.getLnImplementation() === 'ECL') {
      url = this.childAPIUrl + environment.PAYMENTS_API + '/' + payment;
    }
    this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
    return this.httpClient.get(url)
    .pipe(takeUntil(this.unSubs[3]),
    map((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner());      
      return res;
    }),
    catchError(err => {
      if (fromDialog) {
        this.handleErrorWithoutAlert('Decode Payment', err);
      } else {
        this.handleErrorWithAlert('ERROR', 'Decode Payment Failed', this.childAPIUrl + environment.PAYREQUEST_API, err);
      }
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));
  }

  decodePayments(payments: string) {
    let url = this.childAPIUrl + environment.PAYREQUEST_API;
    let msg = 'Decoding Payments';
    if (this.getLnImplementation() === 'ECL') {
      url = this.childAPIUrl + environment.PAYMENTS_API + '/getsentinfos';
      msg = 'Getting Sent Payments';
    }
    this.store.dispatch(new RTLActions.OpenSpinner(msg + '...'));
    return this.httpClient.post(url, {payments: payments})
    .pipe(takeUntil(this.unSubs[0]),
    map((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner());      
      return res;
    }),
    catchError(err => {
      this.handleErrorWithAlert('ERROR', msg + ' Failed', url, err);
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));
  }

  getAliasesFromPubkeys(pubkey: string, multiple: boolean) {
    if (multiple) {
      let pubkey_params = new HttpParams().set('pubkeys', pubkey);
      return this.httpClient.get(this.childAPIUrl + environment.NETWORK_API + '/nodes', {params: pubkey_params});
    } else {
      return this.httpClient.get(this.childAPIUrl + environment.NETWORK_API + '/node/' + pubkey);
    }
  }

  signMessage(msg: string) {
    this.store.dispatch(new RTLActions.OpenSpinner('Signing Message...'));    
    return this.httpClient.post(this.childAPIUrl + environment.MESSAGE_API + '/sign', {message: msg})
    .pipe(takeUntil(this.unSubs[1]),
    map((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner());      
      return res;
    }),
    catchError(err => {
      this.handleErrorWithAlert('ERROR', 'Sign Message Failed', this.childAPIUrl + environment.MESSAGE_API + '/sign', err);
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));
  }

  verifyMessage(msg: string, sign: string) {
    this.store.dispatch(new RTLActions.OpenSpinner('Verifying Message...'));    
    return this.httpClient.post(this.childAPIUrl + environment.MESSAGE_API + '/verify', {message: msg, signature: sign})
    .pipe(takeUntil(this.unSubs[2]),
    map((res: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner());      
      return res;
    }),
    catchError(err => {
      this.handleErrorWithAlert('ERROR', 'Verify Message Failed', this.childAPIUrl + environment.MESSAGE_API + '/verify', err);
      return throwError(err.error && err.error.error ? err.error.error : err.error ? err.error : err);
    }));    
  }

  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {
    this.store.dispatch(new RTLActions.CloseSpinner());      
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    }
  }

  handleErrorWithAlert(alertType: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {
    this.logger.error(err);
    this.store.dispatch(new RTLActions.CloseSpinner());
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else {
      this.store.dispatch(new RTLActions.OpenAlert({
        data: {
          type: alertType,
          alertTitle: alertTitle,
          message: { code: err.status, message: err.error.error, URL: errURL },
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
