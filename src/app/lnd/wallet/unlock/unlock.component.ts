import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import * as LNDActions from '../../store/lnd.actions';
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

  onUnlockWallet():boolean|void {
    if(!this.walletPassword) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Unlocking...'));
    this.store.dispatch(new LNDActions.UnlockWallet({pwd: window.btoa(this.walletPassword)}));
  }

  resetData() {
    this.walletPassword = '';
  }

}
