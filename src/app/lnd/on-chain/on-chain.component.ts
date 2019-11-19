import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Balance, ChannelsTransaction, AddressType } from '../../shared/models/lndModels';
import { RTLConfiguration } from '../../shared/models/RTLconfig';
import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';

@Component({
  selector: 'rtl-on-chain',
  templateUrl: './on-chain.component.html',
  styleUrls: ['./on-chain.component.scss']
})
export class OnChainComponent implements OnInit, OnDestroy {
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public addressTypes = [];
  public flgLoadingWallet: Boolean | 'error' = true;
  public selectedAddress: AddressType = {};
  public blockchainBalance: Balance = {};
  public information: GetInfo = {};
  public newAddress = '';
  public transaction: ChannelsTransaction = {};
  public transTypes = [{id: '1', name: 'Target Confirmation Blocks'}, {id: '2', name: 'Fee'}];
  public selTransType = '1';
  public flgCustomAmount = '1';
  faExchangeAlt = faExchangeAlt;
  faChartPie = faChartPie;
  balances = [{title: 'Total Balance', dataValue: 0}, {title: 'Confirmed', dataValue: 0}, {title: 'Unconfirmed', dataValue: 0}];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchBalance/blockchain') {
          this.flgLoadingWallet = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.addressTypes = rtlStore.addressTypes;
      this.blockchainBalance = rtlStore.blockchainBalance;
      if (undefined === this.blockchainBalance.total_balance) {
        this.blockchainBalance.total_balance = 0;
      }
      if (undefined === this.blockchainBalance.confirmed_balance) {
        this.blockchainBalance.confirmed_balance = 0;
      }
      if (undefined === this.blockchainBalance.unconfirmed_balance) {
        this.blockchainBalance.unconfirmed_balance = 0;
      }
      this.balances = [{title: 'Total Balance', dataValue: this.blockchainBalance.total_balance}, {title: 'Confirmed', dataValue: this.blockchainBalance.confirmed_balance}, {title: 'Unconfirmed', dataValue: this.blockchainBalance.unconfirmed_balance}];
      if (this.flgLoadingWallet !== 'error') {
        this.flgLoadingWallet = false;
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
