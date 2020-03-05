import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as sha256 from 'sha256';
import { Store } from '@ngrx/store';

import { faUnlockAlt } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode, RTLConfiguration } from '../../models/RTLconfig';
import { LoggerService } from '../../services/logger.service';
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
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsRoot.forEach(effectsErr => {
        if (effectsErr.action === 'Login') {
          this.loginErrorMessage = this.loginErrorMessage + effectsErr.message + ' ';
        }
        this.logger.error(effectsErr);
      });
      this.selNode = rtlStore.selNode;
      this.appConfig = rtlStore.appConfig;
      this.logger.info(rtlStore);
    });
  }

  onLogin() {
    if(!this.password || (this.appConfig.enable2FA && !this.token)) { return true; }
    this.loginErrorMessage = '';
    this.store.dispatch(new RTLActions.Login({password: sha256(this.password), token: this.token, initialPass: this.password === 'password'}));
  }

  resetData() {
    this.password = '';
    this.token = '';
    this.loginErrorMessage = '';
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
