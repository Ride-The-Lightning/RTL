import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-unlock-wallet',
  templateUrl: './unlock.component.html',
  styleUrls: ['./unlock.component.scss']
})
export class UnlockWalletComponent implements OnInit {
  walletPassword = '';

  constructor(private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.walletPassword = '';
  }

  onUnlockWallet() {
    this.store.dispatch(new RTLActions.OpenSpinner('Unlocking...'));
    this.store.dispatch(new RTLActions.UnlockWallet({pwd: window.btoa(this.walletPassword)}));
  }

  resetData() {
    this.walletPassword = '';
  }

}
