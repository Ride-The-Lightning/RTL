import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild, GetInfoRoot } from '../../../shared/models/RTLconfig';
import { GetInfo, OnChainBalance, SendPaymentOnChain } from '../../../shared/models/eclModels';
import { CURRENCY_UNITS, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, ADDRESS_TYPES } from '../../../shared/services/consts-enums-functions';
import { RTLConfiguration } from '../../../shared/models/RTLconfig';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import * as ECLActions from '../../store/ecl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-on-chain-send-modal',
  templateUrl: './on-chain-send-modal.component.html',
  styleUrls: ['./on-chain-send-modal.component.scss']
})
export class ECLOnChainSendModalComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true }) form: any;
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public nodeData: GetInfoRoot;
  public addressTypes = [];
  public flgLoadingWallet: Boolean | 'error' = true;
  public selectedAddress = ADDRESS_TYPES[1];
  public blockchainBalance: OnChainBalance = {};
  public information: GetInfo = {};
  public newAddress = '';
  public transaction: SendPaymentOnChain = {};
  public sendFundError = '';
  public fiatConversion = false;
  public amountUnits = CURRENCY_UNITS;
  public selAmountUnit = CURRENCY_UNITS[0];
  public currConvertorRate = {};
  public unitConversionValue = 0;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ECLOnChainSendModalComponent>, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions$: Actions) {}

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
    filter(action => action.type === ECLActions.EFFECT_ERROR_ECL || action.type === ECLActions.SEND_ONCHAIN_FUNDS_RES_ECL))
    .subscribe((action: ECLActions.EffectError | ECLActions.SendOnchainFundsRes) => {
      if (action.type === ECLActions.SEND_ONCHAIN_FUNDS_RES_ECL) {
        this.store.dispatch(new RTLActions.OpenSnackBar('Fund Sent Successfully!'));
        this.dialogRef.close();
      }    
      if (action.type === ECLActions.EFFECT_ERROR_ECL && action.payload.action === 'SendOnchainFunds') {
        this.sendFundError = action.payload.message;
      }
    });
  }

  onSendFunds():boolean|void {
    if(this.invalidValues) { return true; }
    this.sendFundError = '';
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Funds...'));
    if(this.transaction.amount && this.selAmountUnit !== CurrencyUnitEnum.SATS) {
      this.commonService.convertCurrency(this.transaction.amount, this.selAmountUnit === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : this.selAmountUnit, this.amountUnits[2], this.fiatConversion)
      .pipe(takeUntil(this.unSubs[2]))
      .subscribe(data => {
        this.transaction.amount = parseInt(data[CurrencyUnitEnum.SATS]);
        this.selAmountUnit = CurrencyUnitEnum.SATS;
        this.store.dispatch(new ECLActions.SendOnchainFunds(this.transaction));
      });
    } else {
      this.store.dispatch(new ECLActions.SendOnchainFunds(this.transaction));
    }
  }

  get invalidValues(): boolean {
    return (!this.transaction.address || this.transaction.address === '')
        || ((!this.transaction.amount || this.transaction.amount <= 0))
        || (!this.transaction.blocks || this.transaction.blocks <= 0);
  }

  resetData() {
    this.sendFundError = '';    
    this.transaction = {};
  }

  onAmountUnitChange(event: any) {
    let self = this;
    let prevSelectedUnit = (this.selAmountUnit === this.amountUnits[2]) ? CurrencyUnitEnum.OTHER : this.selAmountUnit;
    let currSelectedUnit = event.value === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : event.value;
    if(this.transaction.amount && this.selAmountUnit !== event.value) {
      this.commonService.convertCurrency(this.transaction.amount, prevSelectedUnit, this.amountUnits[2], this.fiatConversion)
      .pipe(takeUntil(this.unSubs[3]))
      .subscribe(data => {
        self.transaction.amount = +self.decimalPipe.transform(data[currSelectedUnit], self.currencyUnitFormats[currSelectedUnit]).replace(/,/g, '');
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
