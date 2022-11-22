import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatDialogRef } from '@angular/material/dialog';
import * as sha256 from 'sha256';

import { RTLEffects } from '../../../../store/rtl.effects';
import { RTLState } from '../../../../store/rtl.state';
import { isAuthorized, closeAlert } from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-is-authorized',
  templateUrl: './is-authorized.component.html',
  styleUrls: ['./is-authorized.component.scss']
})
export class IsAuthorizedComponent implements OnInit, OnDestroy {

  public password = '';
  public isAuthenticated = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<IsAuthorizedComponent>, private store: Store<RTLState>, private rtlEffects: RTLEffects) { }

  ngOnInit(): void {
    this.rtlEffects.isAuthorizedRes.
      pipe(take(1)).
      subscribe((authRes) => {
        if (authRes !== 'ERROR') {
          this.isAuthenticated = true;
          this.store.dispatch(closeAlert({ payload: this.isAuthenticated }));
        } else {
          this.isAuthenticated = false;
        }
      });
  }

  onAuthenticate(): boolean | void {
    if (!this.password) { return true; }
    this.store.dispatch(isAuthorized({ payload: sha256(this.password) }));
  }

  onClose() {
    this.store.dispatch(closeAlert({ payload: this.isAuthenticated }));
  }

  ngOnDestroy(): void {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
