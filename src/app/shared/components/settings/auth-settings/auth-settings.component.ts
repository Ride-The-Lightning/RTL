import { Component, OnInit } from '@angular/core';
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
  public faKey = faKey;
  public oldPassword = '';
  public newPassword = '';
  public confirmPassword = '';

  constructor(private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {}

  onResetPassword() {
    if(!this.oldPassword || !this.newPassword || !this.confirmPassword) { return true; }
    this.store.dispatch(new RTLActions.ResetPassword({oldPassword: sha256(this.oldPassword), newPassword: sha256(this.newPassword)}));
  }

  resetData() {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

}
