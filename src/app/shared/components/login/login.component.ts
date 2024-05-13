import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import * as sha256 from 'sha256';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUnlockAlt } from '@fortawesome/free-solid-svg-icons';

import { LoginTokenComponent } from '../data-modal/login-2fa-token/login-2fa-token.component';
import { RTLConfiguration } from '../../models/RTLconfig';
import { APICallStatusEnum, PASSWORD_BLACKLIST, RTLActions, ScreenSizeEnum } from '../../services/consts-enums-functions';
import { CommonService } from '../../services/common.service';
import { LoggerService } from '../../services/logger.service';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { login, openAlert } from '../../../store/rtl.actions';
import { rootAppConfig, authorizedStatus, loginStatus } from '../../../store/rtl.selector';

@Component({
  selector: 'rtl-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  public faUnlockAlt = faUnlockAlt;
  public appConfig: RTLConfiguration;
  public logoutReason = '';
  public password = '';
  public rtlSSO = 0;
  public rtlCookiePath = '';
  public accessKey = '';
  public flgShow = false;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public loginErrorMessage = '';
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private actions: Actions, private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    combineLatest([this.store.select(loginStatus), this.store.select(authorizedStatus)]).pipe(takeUntil(this.unSubs[0])).
      subscribe(([loginCallRes, isAuthorizedCallRes]) => {
        this.loginErrorMessage = '';
        if (loginCallRes.status === APICallStatusEnum.ERROR) {
          this.loginErrorMessage = this.loginErrorMessage + ((typeof (loginCallRes.message) === 'object') ? JSON.stringify(loginCallRes.message) : loginCallRes.message);
          this.logger.error(loginCallRes.message);
        }
        if (isAuthorizedCallRes.status === APICallStatusEnum.ERROR) {
          this.loginErrorMessage = this.loginErrorMessage + ((typeof (isAuthorizedCallRes.message) === 'object') ? JSON.stringify(isAuthorizedCallRes.message) : isAuthorizedCallRes.message);
          this.logger.error(isAuthorizedCallRes.message);
        }
      });
    this.store.select(rootAppConfig).pipe(takeUntil(this.unSubs[1])).subscribe((appConfig) => {
      this.appConfig = appConfig;
      this.logger.info(appConfig);
    });
    this.actions.pipe(filter((action) => action.type === RTLActions.LOGOUT), take(1)).
      subscribe((action: any) => {
        this.logoutReason = action.payload;
      });
  }

  onLogin(): boolean | void {
    if (!this.password) {
      return true;
    }
    this.loginErrorMessage = '';
    this.logoutReason = '';
    if (this.appConfig.enable2FA) {
      this.store.dispatch(openAlert({
        payload: {
          maxWidth: '35rem',
          data: {
            component: LoginTokenComponent
          }
        }
      }));
      this.rtlEffects.closeAlert.
        pipe(take(1)).
        subscribe((alertRes) => {
          if (alertRes) {
            this.store.dispatch(login({ payload: { password: sha256(this.password), defaultPassword: PASSWORD_BLACKLIST.includes(this.password.toLowerCase()), twoFAToken: alertRes.twoFAToken } }));
          }
        });
    } else {
      this.store.dispatch(login({ payload: { password: sha256(this.password), defaultPassword: PASSWORD_BLACKLIST.includes(this.password.toLowerCase()) } }));
    }
  }

  resetData() {
    this.password = '';
    this.loginErrorMessage = '';
    this.logoutReason = '';
    this.flgShow = false;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
