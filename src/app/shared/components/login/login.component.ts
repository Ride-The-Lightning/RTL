import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import * as sha256 from 'sha256';
import { Store } from '@ngrx/store';
import { faUnlockAlt } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode, RTLConfiguration } from '../../models/RTLconfig';
import { LoggerService } from '../../services/logger.service';

import { RTLEffects } from '../../../store/rtl.effects';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';

@Component({
  selector: 'rtl-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  public faUnlockAlt = faUnlockAlt;
  public selNode: ConfigSettingsNode;
  public appConfig: RTLConfiguration;
  public password = '';
  public token = '';
  public rtlSSO = 0;
  public rtlCookiePath = '';
  public accessKey = '';
  public loginErrorMessage = '';
  public tokenErrorMessage = '';
  public authRes = null;
  public isLoggedIn = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects) { }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsRoot.forEach(effectsErr => {
        if (effectsErr.action === 'Login' || effectsErr.action === 'IsAuthorized') {
          this.loginErrorMessage = this.loginErrorMessage + effectsErr.message + ' ';
        } else if (effectsErr.action === 'VerifyToken') {
          this.tokenErrorMessage = this.tokenErrorMessage + effectsErr.message + ' ';
        }
        this.logger.error(effectsErr);
      });
      this.selNode = rtlStore.selNode;
      this.appConfig = rtlStore.appConfig;
      this.logger.info(rtlStore);
    });
    this.rtlEffects.isAuthorizedRes
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(authRes => {
      if (authRes !== 'ERROR') {
        this.authRes = authRes;
        this.isLoggedIn = true;
      }
    });    
  }

  onLogin() {
    if(!this.password) { return true; }
    this.loginErrorMessage = '';
    if (this.appConfig.enable2FA) {
      this.store.dispatch(new RTLActions.IsAuthorized(sha256(this.password)));
    } else {
      this.store.dispatch(new RTLActions.Login({password: sha256(this.password), initialPass: this.password === 'password'}));
    }
  }

  onVerifyToken() {
    if (this.appConfig.enable2FA && !this.token) { return true; }
    this.tokenErrorMessage = '';
    this.store.dispatch(new RTLActions.VerifyTwoFA({token: this.token, authResponse: this.authRes}));
  }

  resetData() {
    this.password = '';
    this.loginErrorMessage = '';
  }

  resetToken() {
    this.token = '';
    this.tokenErrorMessage = '';
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
