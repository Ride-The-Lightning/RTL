import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef } from '@angular/material';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild, GetInfoRoot } from '../../../shared/models/RTLconfig';
import { GetInfoCL, BalanceCL, OnChainCL } from '../../../shared/models/clModels';
import { CURRENCY_UNITS, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, AlertTypeEnum, ADDRESS_TYPES, FEE_RATE_TYPES } from '../../../shared/services/consts-enums-functions';
import { RTLConfiguration } from '../../../shared/models/RTLconfig';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

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
  public flgLoadingWallet: Boolean | 'error' = true;
  public selectedAddress = ADDRESS_TYPES[1];
  public blockchainBalance: BalanceCL = {};
  public information: GetInfoCL = {};
  public newAddress = '';
  public transaction: OnChainCL = {};
  public feeRateTypes = FEE_RATE_TYPES;
  public flgMinConf = false;
  public sendFundError = '';
  public fiatConversion = false;
  public amountUnits = CURRENCY_UNITS;
  public selAmountUnit = CURRENCY_UNITS[0];
  public currConvertorRate = {};
  public unitConversionValue = 0;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLOnChainSendComponent>, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions$: Actions) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rootStore) => {
      this.fiatConversion = rootStore.selNode.settings.fiatConversion;
      this.amountUnits = rootStore.selNode.settings.currencyUnits;
      this.appConfig = rootStore.appConfig;
      this.nodeData = rootStore.nodeData;
      this.logger.info(rootStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === RTLActions.EFFECT_ERROR_CL || action.type === RTLActions.SET_CHANNEL_TRANSACTION_RES_CL))
    .subscribe((action: RTLActions.EffectErrorCl | RTLActions.SetChannelTransactionResCL) => {
      if (action.type === RTLActions.SET_CHANNEL_TRANSACTION_RES_CL) {
        this.store.dispatch(new RTLActions.OpenSnackBar('Fund Sent Successfully!'));
        this.dialogRef.close();
      }    
      if (action.type === RTLActions.EFFECT_ERROR_CL && action.payload.action === 'SetChannelTransactionCL') {
        this.sendFundError = action.payload.message;
      }
    });

  }

  onSendFunds() {
    if(this.invalidValues) { return true; }
    this.sendFundError = '';
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Funds...'));
    if(this.transaction.satoshis && this.selAmountUnit !== CurrencyUnitEnum.SATS) {
      this.commonService.convertCurrency(this.transaction.satoshis, this.selAmountUnit === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : this.selAmountUnit, this.amountUnits[2], this.fiatConversion)
      .pipe(takeUntil(this.unSubs[2]))
      .subscribe(data => {
        this.transaction.satoshis = parseInt(data[CurrencyUnitEnum.SATS]);
        this.selAmountUnit = CurrencyUnitEnum.SATS;
        this.store.dispatch(new RTLActions.SetChannelTransactionCL(this.transaction));
      });
    } else {
      this.store.dispatch(new RTLActions.SetChannelTransactionCL(this.transaction));
    }
  }

  get invalidValues(): boolean {
    return (!this.transaction.address || this.transaction.address === '')
        || ((!this.transaction.satoshis || this.transaction.satoshis <= 0))
        || (this.flgMinConf && (!this.transaction.minconf || this.transaction.minconf <= 0));
  }

  resetData() {
    this.sendFundError = '';    
    this.transaction = {};
    this.flgMinConf = false;
  }

  onAmountUnitChange(event: any) {
    let self = this;
    let prevSelectedUnit = (this.selAmountUnit === this.amountUnits[2]) ? CurrencyUnitEnum.OTHER : this.selAmountUnit;
    let currSelectedUnit = event.value === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : event.value;
    if(this.transaction.satoshis && this.selAmountUnit !== event.value) {
      this.commonService.convertCurrency(this.transaction.satoshis, prevSelectedUnit, this.amountUnits[2], this.fiatConversion)
      .pipe(takeUntil(this.unSubs[3]))
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
