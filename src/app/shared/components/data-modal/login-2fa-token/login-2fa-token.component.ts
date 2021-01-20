import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialogRef } from '@angular/material/dialog';
import { faUserClock } from '@fortawesome/free-solid-svg-icons';

import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-login-token',
  templateUrl: './login-2fa-token.component.html',
  styleUrls: ['./login-2fa-token.component.scss']
})
export class LoginTokenComponent implements OnInit {
  public faUserClock = faUserClock;
  public token = '';

  constructor(public dialogRef: MatDialogRef<LoginTokenComponent>, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {}

  onClose() {
    this.dialogRef.close(null);
  }

  onVerifyToken():boolean|void {
    if (!this.token) { return true; }
    this.dialogRef.close();
    this.store.dispatch(new RTLActions.CloseAlert({twoFAToken: this.token}));
  }

}
