import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, of, Observable } from 'rxjs';
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
  private childAPIUrl = API_URL;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private httpClient: HttpClient, private store: Store<fromRTLReducer.RTLState>, private logger: LoggerService,) {}

  ngOnInit() {}

  getChildAPIUrl() {
    return this.childAPIUrl;
  }

  setChildAPIUrl(lnImplementation: string) {
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

  getAliasesFromPubkeys(pubkeys: string[]) {
    return this.httpClient.get(this.childAPIUrl + environment.NETWORK_API + '/nodes/' + pubkeys)
  }

  getAliasFromPubkey(pubkey: string) {
    return this.httpClient.get(this.childAPIUrl + environment.NETWORK_API + '/node/' + pubkey)
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
      throw err;
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
      throw err;
    }));    
  }

  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {
    this.store.dispatch(new RTLActions.CloseSpinner());      
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else {
      this.store.dispatch(new LNDActions.EffectError({ action: actionName, code: err.status.toString(), message: err.error.error }));
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
