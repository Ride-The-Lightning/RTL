import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faUserClock } from '@fortawesome/free-solid-svg-icons';

import { LoginTokenData } from '../../../models/alertData';

import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-login-token',
  templateUrl: './login-2fa-token.component.html',
  styleUrls: ['./login-2fa-token.component.scss']
})
export class LoginTokenComponent implements OnInit, OnDestroy {
  public faUserClock = faUserClock;
  public token = '';
  public tokenErrorMessage = '';
  public authRes = { token: '' };
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<LoginTokenComponent>, @Inject(MAT_DIALOG_DATA) public data: LoginTokenData, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    this.authRes = this.data.authRes;
    this.tokenErrorMessage = '';
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsRoot.forEach(effectsErr => {
        if (effectsErr.action === 'VerifyToken') {
          this.tokenErrorMessage = this.tokenErrorMessage + effectsErr.message + ' ';
        }
      });
    });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onVerifyToken() {
    if (!this.token) { return true; }
    this.tokenErrorMessage = '';
    this.store.dispatch(new RTLActions.VerifyTwoFA({token: this.token, authResponse: this.authRes}));
  }

  ngOnDestroy() {
    this.store.dispatch(new RTLActions.ClearEffectErrorRoot('VerifyToken'));
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
