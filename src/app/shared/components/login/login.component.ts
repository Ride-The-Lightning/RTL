import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import * as sha256 from 'sha256';
import { Store } from '@ngrx/store';
import { faUnlockAlt } from '@fortawesome/free-solid-svg-icons';

import { LoginTokenComponent } from '../data-modal/login-2fa-token/login-2fa-token.component';
import { ConfigSettingsNode, RTLConfiguration } from '../../models/RTLconfig';
import { APICallStatusEnum, PASSWORD_BLACKLIST, ScreenSizeEnum } from '../../services/consts-enums-functions';
import { CommonService } from '../../services/common.service';
import { LoggerService } from '../../services/logger.service';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { ApiCallsListRoot } from '../../models/apiCallsPayload';
import { login, openAlert } from '../../../store/rtl.actions';

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
  public flgShow = false;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public loginErrorMessage = '';
  public apisCallStatus: ApiCallsListRoot = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.store.select('root').
      pipe(takeUntil(this.unSubs[0])).
      subscribe((rtlStore) => {
        this.loginErrorMessage = '';
        this.apisCallStatus = rtlStore.apisCallStatus;
        if (rtlStore.apisCallStatus.Login.status === APICallStatusEnum.ERROR) {
          this.loginErrorMessage = this.loginErrorMessage + ((typeof (this.apisCallStatus.Login.message) === 'object') ? JSON.stringify(this.apisCallStatus.Login.message) : this.apisCallStatus.Login.message);
          this.logger.error(this.apisCallStatus.Login.message);
        }
        if (rtlStore.apisCallStatus.IsAuthorized.status === APICallStatusEnum.ERROR) {
          this.loginErrorMessage = this.loginErrorMessage + ((typeof (this.apisCallStatus.IsAuthorized.message) === 'object') ? JSON.stringify(this.apisCallStatus.IsAuthorized.message) : this.apisCallStatus.IsAuthorized.message);
          this.logger.error(this.apisCallStatus.IsAuthorized.message);
        }
        this.selNode = rtlStore.selNode;
        this.appConfig = rtlStore.appConfig;
        this.logger.info(rtlStore);
      });
  }

  onLogin(): boolean | void {
    if (!this.password) {
      return true;
    }
    this.loginErrorMessage = '';
    if (this.appConfig.enable2FA) {
      this.store.dispatch(openAlert({
        payload: {
          maxWidth: '35rem', data: {
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
    this.flgShow = false;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
