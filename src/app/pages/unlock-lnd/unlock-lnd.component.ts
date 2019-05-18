import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';

import * as RTLActions from '../../shared/store/rtl.actions';
import * as fromRTLReducer from '../../shared/store/rtl.reducers';

@Component({
  selector: 'rtl-unlock-lnd',
  templateUrl: './unlock-lnd.component.html',
  styleUrls: ['./unlock-lnd.component.scss']
})
export class UnlockLNDComponent implements OnInit, OnDestroy {
  walletOperation = 'init';
  walletPassword = '';
  initWalletPassword = '';
  existingCypher = false;
  cypherSeed = '';
  enterPassphrase = false;
  passphrase = '';
  private unsub = new Subject();

  constructor(private store: Store<fromRTLReducer.State>) {}

  ngOnInit() {
    this.walletPassword = '';
  }

  onOperateWallet() {
    this.store.dispatch(new RTLActions.OpenSpinner('Unlocking...'));
    this.store.dispatch(new RTLActions.OperateWallet({operation: 'unlock', pwd: this.walletPassword}));
  }

  onInitWallet() {
    this.store.dispatch(new RTLActions.OpenSpinner('Initializing...'));
    // this.store.dispatch(new RTLActions.OperateWallet({operation: 'init', pwd: this.initWalletPassword}));
  }

  onExistingCypherChange(event: any) {

  }

  onEnterPassphraseChange(event: any) {

  }

  resetData() {
    this.walletOperation = 'init';
    this.walletPassword = '';
    this.initWalletPassword = '';
    this.existingCypher = false;
    this.cypherSeed = '';
    this.enterPassphrase = false;
    this.passphrase = '';
  }

  ngOnDestroy() {
    this.unsub.next();
    this.unsub.complete();
  }

}
