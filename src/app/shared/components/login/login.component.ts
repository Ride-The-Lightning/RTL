import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import * as sha256 from 'sha256';
import { Store } from '@ngrx/store';
import { faUnlockAlt } from '@fortawesome/free-solid-svg-icons';

import { LoginTokenComponent } from '../data-modal/login-2fa-token/login-2fa-token.component';
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
  public rtlSSO = 0;
  public rtlCookiePath = '';
  public accessKey = '';
  public loginErrorMessage = '';
  public flgShow = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects) { }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsRoot.forEach(effectsErr => {
        if (effectsErr.action === 'Login' || effectsErr.action === 'IsAuthorized') {
          this.loginErrorMessage = this.loginErrorMessage + effectsErr.message + ' ';
        }
        this.logger.error(effectsErr);
      });
      this.selNode = rtlStore.selNode;
      this.appConfig = rtlStore.appConfig;
      this.logger.info(rtlStore);
    });
  }

  onLogin():boolean|void {
    if(!this.password) { return true; }
    this.loginErrorMessage = '';
    if (this.appConfig.enable2FA) {
      this.store.dispatch(new RTLActions.OpenAlert({ maxWidth: '35rem', data: {
        component: LoginTokenComponent
      }}));
      this.rtlEffects.closeAlert
      .pipe(take(1))
      .subscribe(alertRes => {
        if (alertRes) {
          this.store.dispatch(new RTLActions.Login({password: sha256(this.password), defaultPassword: this.password === 'password', twoFAToken: alertRes.twoFAToken}));
        }
      });
    } else {
      this.store.dispatch(new RTLActions.Login({password: sha256(this.password), defaultPassword: this.password === 'password'}));
    }
  }

  resetData() {
    this.password = '';
    this.loginErrorMessage = '';
    this.flgShow = false;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
