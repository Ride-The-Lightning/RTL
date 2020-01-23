import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import * as sha256 from 'sha256';

import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-auth-settings',
  templateUrl: './auth-settings.component.html',
  styleUrls: ['./auth-settings.component.scss']
})
export class AuthSettingsComponent implements OnInit {
  @ViewChild('authForm', { static: true }) form: any;
  public faKey = faKey;
  public oldPassword = '';
  public newPassword = '';
  public confirmPassword = '';
  public errorMsg = '';
  public errorConfirmMsg = '';

  constructor(private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {}

  onResetPassword() {
    if(!this.oldPassword || !this.newPassword || !this.confirmPassword || this.oldPassword === this.newPassword) { return true; }
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

}
