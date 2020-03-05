import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { authenticator } from 'otplib/otplib-browser';
import { faKey, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import * as sha256 from 'sha256';

import { RTLConfiguration } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';

import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-auth-settings',
  templateUrl: './auth-settings.component.html',
  styleUrls: ['./auth-settings.component.scss']
})
export class AuthSettingsComponent implements OnInit, OnDestroy {
  @ViewChild('authForm', { static: true }) form: any;
  @ViewChild('twoFAForm', { static: true }) twoFAForm: any;
  public faShieldAlt = faShieldAlt;
  public faKey = faKey;
  public oldPassword = '';
  public newPassword = '';
  public confirmPassword = '';
  public errorMsg = '';
  public errorConfirmMsg = '';
  public isTokenValid = true;
  public appConfig: RTLConfiguration;
  public secret2fa: string;
  public otpauth: string;
  public token2fa: string;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private logger: LoggerService) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      if (!this.appConfig.enable2FA) {
        this.generateSecret();
      }
      this.logger.info(rtlStore);
    });
  }

  onResetPassword() {
    if(!this.oldPassword || !this.newPassword || !this.confirmPassword || this.oldPassword === this.newPassword || this.newPassword !== this.confirmPassword) { return true; }
    this.store.dispatch(new RTLActions.ResetPassword({oldPassword: sha256(this.oldPassword), newPassword: sha256(this.newPassword)}));
  }

  matchOldAndNewPasswords(): boolean {
    let invalid = false;
    if(this.form.controls.newpassword) {
      if (!this.newPassword) {
        this.form.controls.newpassword.setErrors({invalid: true});
        this.errorMsg = 'New password is required.';
        invalid = true;
      } else if (this.oldPassword !== '' && this.newPassword !== '' && this.oldPassword === this.newPassword) {
        this.form.controls.newpassword.setErrors({invalid: true});
        this.errorMsg = 'Old and New password cannot be same.';
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
    if (this.form.controls.confirmpassword) {
      if (!this.confirmPassword) {
        this.form.controls.confirmpassword.setErrors({invalid: true});
        this.errorConfirmMsg = 'Confirm password is required.';
        invalid = true;
      } else if (this.newPassword !== '' && this.confirmPassword !== '' && this.newPassword !== this.confirmPassword) {
        this.form.controls.confirmpassword.setErrors({invalid: true});
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

  resetData() {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  generateSecret() {
    this.secret2fa = authenticator.generateSecret();
    this.otpauth = authenticator.keyuri('', 'Ride The Lightning (RTL)', this.secret2fa);
  }

  on2FAuth() {
    if (this.appConfig.enable2FA) {
      this.store.dispatch(new RTLActions.OpenSpinner('Updating Settings...'));
      this.store.dispatch(new RTLActions.TwoFASaveSettings({secret2fa: ''}));
      this.generateSecret();
    } else {
      if (!this.token2fa) { return true; }
      this.isTokenValid = authenticator.check(this.token2fa, this.secret2fa);
      if (!this.isTokenValid) {
        this.twoFAForm.controls.token2fa.setErrors({ notValid: true });
        return true;
      }
      this.store.dispatch(new RTLActions.OpenSpinner('Updating Settings...'));
      this.store.dispatch(new RTLActions.TwoFASaveSettings({secret2fa: this.secret2fa}));
    }
    this.token2fa = '';
    this.appConfig.enable2FA = !this.appConfig.enable2FA;
  }

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
