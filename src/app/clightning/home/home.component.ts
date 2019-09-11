import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfoCL, FeesCL, BalanceCL, LocalRemoteBalanceCL, FeeRatesCL } from '../../shared/models/clModels';
import { SelNodeChild } from '../../shared/models/RTLconfig';

import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class CLHomeComponent implements OnInit, OnDestroy {
  public selNode: SelNodeChild = {};
  public fees: FeesCL;
  public information: GetInfoCL = {};
  public totalBalance: BalanceCL = {};
  public lrBalance: LocalRemoteBalanceCL = {};
  public flgLoading: Array<Boolean | 'error'> = [true, true, true, true, true];

  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];
  public position = 'below';
  barPadding = 0;
  maxBalanceValue = 0;
  lrBalances = [...[{'name': 'Local Balance', 'value': 0}, {'name': 'Remote Balance', 'value': 0}]];
  flgTotalCalculated = false;
  view = [];
  yAxisLabel = 'Balance';
  colorScheme = {domain: ['#FF0000']};
  feeRatesPerKB: FeeRatesCL = {};
  feeRatesPerKW: FeeRatesCL = {};

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {
    switch (true) {
      case (window.innerWidth <= 730):
        this.view = [250, 352];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.view = [280, 352];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.view = [300, 352];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.view = [350, 352];
        break;
      default:
        this.view = [300, 352];
        break;
    }
    Object.assign(this, this.lrBalances);
  }

  ngOnInit() {
    this.flgTotalCalculated = false;
    this.store.select('cl')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'FetchInfoCL') {
          this.flgLoading[0] = 'error';
        }
        if (effectsErr.action === 'FetchFeesCL') {
          this.flgLoading[1] = 'error';
        }
        if (effectsErr.action === 'FetchBalanceCL') {
          this.flgLoading[2] = 'error';
        }
        if (effectsErr.action === 'FetchLocalRemoteBalanceCL') {
          this.flgLoading[3] = 'error';
        }
        if (effectsErr.action === 'FetchFeeRatesCL') {
          this.flgLoading[4] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information

      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== this.information.id) ? false : true;
      }

      this.fees = rtlStore.fees;
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = (undefined !== this.fees.feeCollected) ? false : true;
      }

      this.totalBalance = rtlStore.balance;
      if (this.flgLoading[2] !== 'error') {
        this.flgLoading[2] = ('' !== this.totalBalance) ? false : true;
      }

      this.lrBalance = rtlStore.localRemoteBalance;
      this.maxBalanceValue = (rtlStore.localRemoteBalance.localBalance > rtlStore.localRemoteBalance.remoteBalance) ? rtlStore.localRemoteBalance.localBalance : rtlStore.localRemoteBalance.remoteBalance;
      this.lrBalances = [...[{'name': 'Local Balance', 'value': +rtlStore.localRemoteBalance.localBalance}, {'name': 'Remote Balance', 'value': +rtlStore.localRemoteBalance.remoteBalance}]];
      if (this.flgLoading[3] !== 'error') {
        this.flgLoading[3] = ('' !== this.lrBalance) ? false : true;
      }

      this.feeRatesPerKB = rtlStore.feeRatesPerKB;
      this.feeRatesPerKW = rtlStore.feeRatesPerKW;
      if (this.flgLoading[4] !== 'error') {
        this.flgLoading[4] = (undefined !== this.feeRatesPerKB && undefined !== this.feeRatesPerKW) ? false : true;
      }

      this.logger.info(rtlStore);
    });
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
