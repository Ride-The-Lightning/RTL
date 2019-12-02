import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfoCL, BalanceCL, OnChainCL, AddressTypeCL } from '../../shared/models/clModels';
import { RTLConfiguration } from '../../shared/models/RTLconfig';
import { LoggerService } from '../../shared/services/logger.service';
import * as sha256 from 'sha256';

import { CLEffects } from '../store/cl.effects';
import { RTLEffects } from '../../store/rtl.effects';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';
import { AlertTypeEnum, DataTypeEnum } from '../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-cl-on-chain',
  templateUrl: './on-chain.component.html',
  styleUrls: ['./on-chain.component.scss']
})
export class CLOnChainComponent implements OnInit, OnDestroy {
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public addressTypes = [];
  public flgLoadingWallet: Boolean | 'error' = true;
  public selectedAddress: AddressTypeCL = {};
  public balance: BalanceCL = {};
  public information: GetInfoCL = {};
  public newAddress = '';
  public transaction: OnChainCL = {};
  public feeRateTypes = [];
  public flgMinConf = false;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private clEffects: CLEffects) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rootStore) => {
      this.appConfig = rootStore.appConfig;
      this.logger.info(rootStore);
    });

    this.store.select('cl')
    .pipe(takeUntil(this.unsub[1]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'FetchBalanceCL') {
          this.flgLoadingWallet = 'error';
        }        
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.feeRateTypes = rtlStore.feeRateTypes;
      this.addressTypes = rtlStore.addressTypes;

      this.balance = rtlStore.balance;
      if (undefined === this.balance.totalBalance) {
        this.balance.totalBalance = '0';
      }
      if (undefined === this.balance.confBalance) {
        this.balance.confBalance =  '0';
      }
      if (undefined === this.balance.unconfBalance) {
        this.balance.unconfBalance =  '0';
      }
      if (this.flgLoadingWallet !== 'error') {
        this.flgLoadingWallet = false;
      }

      this.logger.info(rtlStore);
    });

  }

  onGenerateAddress() {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting New Address...'));
    this.store.dispatch(new RTLActions.GetNewAddressCL(this.selectedAddress));
    this.clEffects.setNewAddressCL
    .pipe(takeUntil(this.unsub[2]))
    .subscribe(newAddress => {
      this.newAddress = newAddress;
    });
  }

  onSendFunds() {
    const reorderedTransaction = [
      [{key: 'address', value: this.transaction.address, title: 'Address', width: 100, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data: {
      type: AlertTypeEnum.CONFIRM,
      alertTitle: 'Confirm Send Funds',
      message: reorderedTransaction,
      noBtnText: 'Cancel',
      yesBtnText: 'Send'
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unsub[3]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.store.dispatch(new RTLActions.OpenSpinner('Sending Funds...'));
        this.store.dispatch(new RTLActions.SetChannelTransactionCL(this.transaction));
        this.transaction = {};
      }
    });
  }

  get invalidValues(): boolean {
    return (undefined === this.transaction.address || this.transaction.address === '')
        || ((undefined === this.transaction.satoshis || this.transaction.satoshis <= 0))
        || (this.flgMinConf && (undefined === this.transaction.minconf || this.transaction.minconf <= 0));
  }

  resetData() {
    this.transaction = {};
    this.flgMinConf = false;
  }

  resetReceiveData() {
    this.selectedAddress = {};
    this.newAddress = '';
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
