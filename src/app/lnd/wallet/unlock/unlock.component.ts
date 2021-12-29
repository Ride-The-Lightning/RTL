import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { RTLState } from '../../../store/rtl.state';
import { unlockWallet } from '../../store/lnd.actions';

@Component({
  selector: 'rtl-unlock-wallet',
  templateUrl: './unlock.component.html',
  styleUrls: ['./unlock.component.scss']
})
export class UnlockWalletComponent implements OnInit {

  walletPassword = '';

  constructor(private store: Store<RTLState>) { }

  ngOnInit() {
    this.walletPassword = '';
  }

  onUnlockWallet(): boolean | void {
    if (!this.walletPassword) {
      return true;
    }
    this.store.dispatch(unlockWallet({ payload: { pwd: window.btoa(this.walletPassword) } }));
  }

  resetData() {
    this.walletPassword = '';
  }

}
