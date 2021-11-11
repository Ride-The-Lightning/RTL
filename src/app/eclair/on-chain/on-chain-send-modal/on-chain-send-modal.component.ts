import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild, GetInfoRoot, RTLConfiguration } from '../../../shared/models/RTLconfig';
import { GetInfo, OnChainBalance, SendPaymentOnChain } from '../../../shared/models/eclModels';
import { CURRENCY_UNITS, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, ADDRESS_TYPES, APICallStatusEnum, UI_MESSAGES, ECLActions } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLState } from '../../../store/rtl.state';
import { openSnackBar } from '../../../store/rtl.actions';
import { sendOnchainFunds } from '../../store/ecl.actions';
import { rootSelectedNode } from '../../../store/rtl.selector';

@Component({
  selector: 'rtl-ecl-on-chain-send-modal',
  templateUrl: './on-chain-send-modal.component.html',
  styleUrls: ['./on-chain-send-modal.component.scss']
})
export class ECLOnChainSendModalComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public addressTypes = [];
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
  public amountError = 'Amount is Required.';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ECLOnChainSendModalComponent>, private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions: Actions) { }

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((selNode) => {
      this.fiatConversion = selNode.settings.fiatConversion;
      this.amountUnits = selNode.settings.currencyUnits;
      this.logger.info(selNode);
    });
    this.actions.pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === ECLActions.UPDATE_API_CALL_STATUS_ECL || action.type === ECLActions.SEND_ONCHAIN_FUNDS_RES_ECL)
    ).
      subscribe((action: any) => {
        if (action.type === ECLActions.SEND_ONCHAIN_FUNDS_RES_ECL) {
          this.store.dispatch(openSnackBar({ payload: 'Fund Sent Successfully!' }));
          this.dialogRef.close();
        }
        if (action.type === ECLActions.UPDATE_API_CALL_STATUS_ECL && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SendOnchainFunds') {
          this.sendFundError = action.payload.message;
        }
      });
  }

  onSendFunds(): boolean | void {
    if (this.invalidValues) {
      return true;
    }
    this.sendFundError = '';
    if (this.transaction.amount && this.selAmountUnit !== CurrencyUnitEnum.SATS) {
      this.commonService.convertCurrency(this.transaction.amount, this.selAmountUnit === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : this.selAmountUnit, CurrencyUnitEnum.SATS, this.amountUnits[2], this.fiatConversion).
        pipe(takeUntil(this.unSubs[2])).
        subscribe({
          next: (data) => {
            this.transaction.amount = parseInt(data[CurrencyUnitEnum.SATS]);
            this.selAmountUnit = CurrencyUnitEnum.SATS;
            this.store.dispatch(sendOnchainFunds({ payload: this.transaction }));
          }, error: (err) => {
            this.transaction.amount = null;
            this.selAmountUnit = CurrencyUnitEnum.SATS;
            this.amountError = 'Conversion Error: ' + err;
          }
        });
    } else {
      this.store.dispatch(sendOnchainFunds({ payload: this.transaction }));
    }
  }

  get invalidValues(): boolean {
    return (!this.transaction.address || this.transaction.address === '') ||
      ((!this.transaction.amount || this.transaction.amount <= 0)) ||
      (!this.transaction.blocks || this.transaction.blocks <= 0);
  }

  resetData() {
    this.sendFundError = '';
    this.transaction = {};
  }

  onAmountUnitChange(event: any) {
    const self = this;
    const prevSelectedUnit = (this.selAmountUnit === this.amountUnits[2]) ? CurrencyUnitEnum.OTHER : this.selAmountUnit;
    let currSelectedUnit = event.value === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : event.value;
    if (this.transaction.amount && this.selAmountUnit !== event.value) {
      this.commonService.convertCurrency(this.transaction.amount, prevSelectedUnit, currSelectedUnit, this.amountUnits[2], this.fiatConversion).
        pipe(takeUntil(this.unSubs[3])).
        subscribe({
          next: (data) => {
            this.selAmountUnit = event.value;
            self.transaction.amount = +self.decimalPipe.transform(data[currSelectedUnit], self.currencyUnitFormats[currSelectedUnit]).replace(/,/g, '');
          }, error: (err) => {
            self.transaction.amount = null;
            this.amountError = 'Conversion Error: ' + err;
            this.selAmountUnit = prevSelectedUnit;
            currSelectedUnit = prevSelectedUnit;
          }
        });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
