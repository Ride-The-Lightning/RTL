import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUserLock, faUserClock, faInfoCircle, faLock } from '@fortawesome/free-solid-svg-icons';
import * as sha256 from 'sha256';

import { TwoFactorAuthComponent } from '../../data-modal/two-factor-auth/two-factor-auth.component';
import { RTLConfiguration, ConfigSettingsNode } from '../../../models/RTLconfig';
import { PASSWORD_BLACKLIST, RTLActions, UI_MESSAGES } from '../../../services/consts-enums-functions';
import { SessionService } from '../../../services/session.service';
import { openAlert, resetPassword, setSelectedNode } from '../../../../store/rtl.actions';

import { RTLState } from '../../../../store/rtl.state';
import { rootAppConfig, rootSelectedNode } from '../../../../store/rtl.selector';
import { LoggerService } from '../../../services/logger.service';

@Component({
  selector: 'rtl-auth-settings',
  templateUrl: './auth-settings.component.html',
  styleUrls: ['./auth-settings.component.scss']
})
export class AuthSettingsComponent implements OnInit, OnDestroy {

  @ViewChild('authForm', { static: false }) form: any;
  public faInfoCircle = faInfoCircle;
  public faUserLock = faUserLock;
  public faUserClock = faUserClock;
  public faLock = faLock;
  public currPassword = '';
  public newPassword = '';
  public confirmPassword = '';
  public errorMsg = '';
  public errorConfirmMsg = '';
  public initializeNodeData = false;
  public appConfig: RTLConfiguration;
  public selNode: ConfigSettingsNode | any;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private actions: Actions, private router: Router, private sessionService: SessionService) { }

  ngOnInit() {
    this.initializeNodeData = this.sessionService.getItem('defaultPassword') === 'true';
    this.store.select(rootAppConfig).pipe(takeUntil(this.unSubs[0])).subscribe((appConfig) => {
      this.appConfig = appConfig;
      this.logger.info(this.appConfig);
    });
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[1])).subscribe((selNode) => {
      this.selNode = selNode;
    });
    this.actions.pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === RTLActions.RESET_PASSWORD_RES)).
      subscribe((action: any) => {
        if (PASSWORD_BLACKLIST.includes(this.currPassword.toLowerCase())) { // To redirect after initial password reset is done
          switch (this.selNode.lnImplementation?.toUpperCase()) {
            case 'CLN':
              this.router.navigate(['/cln/home']);
              break;

            case 'ECL':
              this.router.navigate(['/ecl/home']);
              break;

            default:
              this.router.navigate(['/lnd/home']);
              break;
          }
        }
        if (this.form) { this.form.resetForm(); }
      });
  }

  onChangePassword(): boolean | void {
    if (!this.currPassword || !this.newPassword || !this.confirmPassword || this.currPassword === this.newPassword || this.newPassword !== this.confirmPassword || PASSWORD_BLACKLIST.includes(this.newPassword.toLowerCase())) {
      return true;
    }
    this.store.dispatch(resetPassword({ payload: { currPassword: sha256(this.currPassword).toString(), newPassword: sha256(this.newPassword).toString() } }));
  }

  matchOldAndNewPasswords(): boolean {
    let invalid = false;
    if (this.form && this.form.controls && this.form.controls.newpassword) {
      if (!this.newPassword) {
        this.form.controls.newpassword.setErrors({ invalid: true });
        this.errorMsg = 'New password is required.';
        invalid = true;
      } else if (this.currPassword !== '' && this.newPassword !== '' && this.currPassword === this.newPassword) {
        this.form.controls.newpassword.setErrors({ invalid: true });
        this.errorMsg = 'Old and New password cannot be same.';
        invalid = true;
      } else if (PASSWORD_BLACKLIST.includes(this.newPassword.toLowerCase())) {
        this.form.controls.newpassword.setErrors({ invalid: true });
        this.errorMsg = PASSWORD_BLACKLIST?.reduce((totalList, currentPass, i) => ((i < (PASSWORD_BLACKLIST.length - 1)) ? (totalList + currentPass + '" / "') : (totalList + currentPass + '".')), 'Password cannot be "');
        invalid = true;
      } else {
        this.form.controls.newpassword.setErrors(null);
        this.errorMsg = '';
        invalid = false;
      }
    }
    return invalid;
  }

  matchNewPasswords(): boolean {
    let invalid = false;
    if (this.form && this.form.controls && this.form.controls.confirmpassword) {
      if (!this.confirmPassword) {
        this.form.controls.confirmpassword.setErrors({ invalid: true });
        this.errorConfirmMsg = 'Confirm password is required.';
        invalid = true;
      } else if (this.newPassword !== '' && this.confirmPassword !== '' && this.newPassword !== this.confirmPassword) {
        this.form.controls.confirmpassword.setErrors({ invalid: true });
        this.errorConfirmMsg = 'New and confirm passwords do not match.';
        invalid = true;
      } else {
        this.form.controls.confirmpassword.setErrors(null);
        this.errorConfirmMsg = '';
        invalid = false;
      }
    }
    return invalid;
  }

  on2FAuth() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          appConfig: this.appConfig,
          component: TwoFactorAuthComponent
        }
      }
    }));
  }

  onResetPassword() {
    this.form.resetForm();
  }

  ngOnDestroy() {
    if (this.initializeNodeData) {
      this.store.dispatch(setSelectedNode({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, prevLnNodeIndex: -1, currentLnNode: this.selNode, isInitialSetup: true } }));
    }
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
