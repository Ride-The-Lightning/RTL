import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { SelNodeChild, GetInfoRoot } from '../../../shared/models/RTLconfig';
import { GetInfoCL, BalanceCL, OnChainCL } from '../../../shared/models/clModels';
import { CURRENCY_UNITS, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, AlertTypeEnum, ADDRESS_TYPES, FEE_RATE_TYPES } from '../../../shared/services/consts-enums-functions';
import { RTLConfiguration } from '../../../shared/models/RTLconfig';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { MessageDataField } from '../../../shared/models/alertData';

@Component({
  selector: 'rtl-cl-on-chain-send',
  templateUrl: './on-chain-send.component.html',
  styleUrls: ['./on-chain-send.component.scss']
})
export class CLOnChainSendComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: false }) form: any;  
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public nodeData: GetInfoRoot;
  public addressTypes = [];
  public flgLoadingWallet: Boolean | 'error' = true;
  public selectedAddress = ADDRESS_TYPES[1];
  public blockchainBalance: BalanceCL = {};
  public information: GetInfoCL = {};
  public newAddress = '';
  public transaction: OnChainCL = {};
  public feeRateTypes = FEE_RATE_TYPES;
  public flgMinConf = false;
  public amountUnits = CURRENCY_UNITS;
  public selAmountUnit = CURRENCY_UNITS[0];
  public currConvertorRate = {};
  public unitConversionValue = 0;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService, private decimalPipe: DecimalPipe) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rootStore) => {
      this.amountUnits = rootStore.selNode.settings.currencyUnits;
      this.appConfig = rootStore.appConfig;
      this.nodeData = rootStore.nodeData;
      this.logger.info(rootStore);
    });
  }

  onSendFunds() {
    if(this.invalidValues) { return true; }
    if(this.transaction.satoshis && this.selAmountUnit !== CurrencyUnitEnum.SATS) {
      this.commonService.convertCurrency(this.transaction.satoshis, this.selAmountUnit === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : this.selAmountUnit, this.amountUnits[2])
      .pipe(takeUntil(this.unSubs[1]))
      .subscribe(data => {
        this.transaction.satoshis = parseInt(data[CurrencyUnitEnum.SATS]);
        this.confirmSend();
      });
    } else {
      this.confirmSend();
    }
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[2]))
    .subscribe(pwdConfirmRes => {
      if (pwdConfirmRes) {
        this.dispatchToSendFunds();
      }
    });
  }

  confirmSend() {
    const confirmationMsg: Array<Array<MessageDataField>> = [
      [{key: 'address', value: this.transaction.address, title: 'BTC Address', width: 100}],
      [{key: 'satoshi', value: this.transaction.satoshis, title: 'Amount (Sats)', width: 100}],
      [{key: 'feeRate', value: this.transaction.feeRate, title: 'Fee Rate', width: 100}],
      [{key: 'minconf', value: this.transaction.minconf, title: 'Min Confirmation Blocks', width: 100}]
    ];
    this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
      type: AlertTypeEnum.CONFIRM,
      alertTitle: 'Confirm Payment',
      message: confirmationMsg,
      noBtnText: 'Cancel',
      yesBtnText: 'Send'
    }}));
  }

  dispatchToSendFunds() {
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Funds...'));
    this.store.dispatch(new RTLActions.SetChannelTransactionCL(this.transaction));
    this.transaction = {};
    this.form.resetForm();
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

  onAmountUnitChange(event: any) {
    let self = this;
    let prevSelectedUnit = (this.selAmountUnit === this.amountUnits[2]) ? CurrencyUnitEnum.OTHER : this.selAmountUnit;
    let currSelectedUnit = event.value === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : event.value;
    if(this.transaction.satoshis && this.selAmountUnit !== event.value) {
      this.commonService.convertCurrency(this.transaction.satoshis, prevSelectedUnit, this.amountUnits[2])
      .pipe(takeUntil(this.unSubs[4]))
      .subscribe(data => {
        self.transaction.satoshis = +self.decimalPipe.transform(data[currSelectedUnit], self.currencyUnitFormats[currSelectedUnit]).replace(/,/g, '');
      });
    }
    this.selAmountUnit = event.value;
  }  

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
