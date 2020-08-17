import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild, GetInfoRoot } from '../../../shared/models/RTLconfig';
import { GetInfo, Balance, OnChain, Transaction } from '../../../shared/models/clModels';
import { CURRENCY_UNITS, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, ADDRESS_TYPES, FEE_RATE_TYPES } from '../../../shared/services/consts-enums-functions';
import { RTLConfiguration } from '../../../shared/models/RTLconfig';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import * as CLActions from '../../store/cl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-on-chain-send',
  templateUrl: './on-chain-send.component.html',
  styleUrls: ['./on-chain-send.component.scss']
})
export class CLOnChainSendComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: false }) form: any;
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public nodeData: GetInfoRoot;
  public addressTypes = [];
  public transactions: Transaction[] = [];
  public selUTXOs = [];
  public flgUseAllBalance = false;
  public totalSelectedUTXOAmount = null;
  public flgLoadingWallet: Boolean | 'error' = true;
  public selectedAddress = ADDRESS_TYPES[1];
  public blockchainBalance: Balance = {};
  public information: GetInfo = {};
  public newAddress = '';
  public transaction: OnChain = {};
  public feeRateTypes = FEE_RATE_TYPES;
  public flgMinConf = false;
  public sendFundError = '';
  public fiatConversion = false;
  public amountUnits = CURRENCY_UNITS;
  public selAmountUnit = CURRENCY_UNITS[0];
  public currConvertorRate = {};
  public unitConversionValue = 0;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  public advancedTitle = 'Advanced Options';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLOnChainSendComponent>, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions$: Actions) {}

  ngOnInit() {
    combineLatest(
      this.store.select('root'),
      this.store.select('cl'))
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(([rootStore, rtlStore]) => {
      this.fiatConversion = rootStore.selNode.settings.fiatConversion;
      this.amountUnits = rootStore.selNode.settings.currencyUnits;
      this.appConfig = rootStore.appConfig;
      this.nodeData = rootStore.nodeData;
      this.transactions = this.commonService.sortAscByKey(rtlStore.transactions.filter(tran => tran.status === 'confirmed'), 'value');
      this.logger.info(rootStore);
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === CLActions.EFFECT_ERROR_CL || action.type === CLActions.SET_CHANNEL_TRANSACTION_RES_CL))
    .subscribe((action: CLActions.EffectError | CLActions.SetChannelTransactionRes) => {
      if (action.type === CLActions.SET_CHANNEL_TRANSACTION_RES_CL) {
        this.store.dispatch(new RTLActions.OpenSnackBar('Fund Sent Successfully!'));
        this.dialogRef.close();
      }    
      if (action.type === CLActions.EFFECT_ERROR_CL && action.payload.action === 'SetChannelTransaction') {
        this.sendFundError = action.payload.message;
      }
    });

  }

  onSendFunds() {
    if(this.invalidValues) { return true; }
    this.sendFundError = '';
    if (this.flgUseAllBalance) {
      this.transaction.satoshis = 'all';
    }
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      this.transaction.utxos = [];
      this.selUTXOs.forEach(utxo => this.transaction.utxos.push(utxo.txid + ':' + utxo.output));
    }
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Funds...'));
    if(this.transaction.satoshis && this.selAmountUnit !== CurrencyUnitEnum.SATS) {
      this.commonService.convertCurrency(+this.transaction.satoshis, this.selAmountUnit === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : this.selAmountUnit, this.amountUnits[2], this.fiatConversion)
      .pipe(takeUntil(this.unSubs[2]))
      .subscribe(data => {
        this.transaction.satoshis = data[CurrencyUnitEnum.SATS];
        this.selAmountUnit = CurrencyUnitEnum.SATS;
        this.store.dispatch(new CLActions.SetChannelTransaction(this.transaction));
      });
    } else {
      this.store.dispatch(new CLActions.SetChannelTransaction(this.transaction));
    }
  }

  get invalidValues(): boolean {
    return (!this.transaction.address || this.transaction.address === '')
        || ((!this.transaction.satoshis || +this.transaction.satoshis <= 0))
        || (this.flgMinConf && (!this.transaction.minconf || this.transaction.minconf <= 0));
  }

  resetData() {
    this.sendFundError = '';    
    this.transaction = {};
    this.flgMinConf = false;
    this.totalSelectedUTXOAmount = null;
    this.selUTXOs = [];
    this.flgUseAllBalance = false;
    this.selAmountUnit = CURRENCY_UNITS[0];
  }

  onUTXOSelectionChange(event: any) {
    let utxoNew = {value: 0}; 
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      this.totalSelectedUTXOAmount = this.selUTXOs.reduce((a, b) => {utxoNew.value = a.value + b.value; return utxoNew;}).value;
      if (this.flgUseAllBalance) { this.onUTXOAllBalanceChange(); }
    } else {
      this.totalSelectedUTXOAmount = null;
      this.transaction.satoshis = null;
      this.flgUseAllBalance = false;
    }
  }

  onUTXOAllBalanceChange() {
    if (this.flgUseAllBalance) {
      this.transaction.satoshis = this.totalSelectedUTXOAmount;
      this.selAmountUnit = CURRENCY_UNITS[0];
    } else {
      this.transaction.satoshis = null;
    }
  }

  onAmountUnitChange(event: any) {
    let self = this;
    let prevSelectedUnit = (this.selAmountUnit === this.amountUnits[2]) ? CurrencyUnitEnum.OTHER : this.selAmountUnit;
    let currSelectedUnit = event.value === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : event.value;
    if(this.transaction.satoshis && this.selAmountUnit !== event.value) {
      this.commonService.convertCurrency(+this.transaction.satoshis, prevSelectedUnit, this.amountUnits[2], this.fiatConversion)
      .pipe(takeUntil(this.unSubs[3]))
      .subscribe(data => {
        self.transaction.satoshis = self.decimalPipe.transform(data[currSelectedUnit], self.currencyUnitFormats[currSelectedUnit]).replace(/,/g, '');
      });
    }
    this.selAmountUnit = event.value;
  }  

  onAdvancedPanelToggle(isClosed: boolean) {
    if (isClosed) {
      this.advancedTitle = (this.selUTXOs.length && this.selUTXOs.length > 0) ? 'Advanced Options | Selected UTXOs: ' + this.selUTXOs.length + ' | Selected UTXO Amount: ' + this.decimalPipe.transform(this.totalSelectedUTXOAmount) + ' Sats' : 'Advanced Options';
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
