import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../shared/services/logger.service';

import * as RTLActions from '../../shared/store/rtl.actions';
import * as fromRTLReducer from '../../shared/store/rtl.reducers';

@Component({
  selector: 'rtl-unlock-lnd',
  templateUrl: './unlock-lnd.component.html',
  styleUrls: ['./unlock-lnd.component.scss']
})
export class UnlockLNDComponent implements OnInit, OnDestroy {
  walletPassword = '';
  private unsub = new Subject();

  constructor(private store: Store<fromRTLReducer.State>) {}

  ngOnInit() {
    this.walletPassword = '';
  }

  onOperateWallet(operation: string) {
    this.store.dispatch(new RTLActions.OpenSpinner('Unlocking...'));
    this.store.dispatch(new RTLActions.OperateWallet({operation: operation, pwd: this.walletPassword}));
  }

  resetData() {
    this.walletPassword = '';
  }

  ngOnDestroy() {
    this.unsub.next();
    this.unsub.complete();
  }

}
