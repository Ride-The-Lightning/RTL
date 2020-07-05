import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { ECLRInvoiceInformation } from '../../../shared/models/alertData';
import { TimeUnitEnum, CurrencyUnitEnum, TIME_UNITS, CURRENCY_UNIT_FORMATS, PAGE_SIZE } from '../../../shared/services/consts-enums-functions';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo } from '../../../shared/models/eclrModels';
import { CommonService } from '../../../shared/services/common.service';

import * as ECLRActions from '../../store/eclr.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-eclr-create-invoices',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss']
})
export class ECLRCreateInvoiceComponent implements OnInit, OnDestroy {
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public description = '';
  public expiry: number;
  public invoiceValue: number;
  public invoiceValueHint = '';
  public invoicePaymentReq = '';
  public invoices: any;
  public information: GetInfo = {};
  public private = false;
  public expiryStep = 100;
  public pageSize = PAGE_SIZE;
  public timeUnitEnum = TimeUnitEnum;
  public timeUnits = TIME_UNITS;
  public selTimeUnit = TimeUnitEnum.SECS;
  public invoiceError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ECLRCreateInvoiceComponent>, @Inject(MAT_DIALOG_DATA) public data: ECLRInvoiceInformation, private store: Store<fromRTLReducer.RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private actions$: Actions) {}

  ngOnInit() {
    this.pageSize = this.data.pageSize;
    this.store.select('eclr')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === ECLRActions.EFFECT_ERROR_ECLR || action.type === ECLRActions.FETCH_INVOICES_ECLR))
    .subscribe((action: ECLRActions.EffectError | ECLRActions.FetchInvoices) => {
      if (action.type === ECLRActions.FETCH_INVOICES_ECLR) {
        this.dialogRef.close();
      }    
      if (action.type === ECLRActions.EFFECT_ERROR_ECLR && action.payload.action === 'CreateInvoice') {
        this.invoiceError = action.payload.message;
      }
    });
  }

  onAddInvoice(form: any) {
    this.invoiceError = '';
    if(!this.description) { return true; }
    let expiryInSecs = (this.expiry ? this.expiry : 3600);
    if (this.selTimeUnit !== TimeUnitEnum.SECS) {
      expiryInSecs = this.commonService.convertTime(this.expiry, this.selTimeUnit, TimeUnitEnum.SECS);
    }
    let invoicePayload = null;
    if (this.invoiceValue) {
      invoicePayload = { description: this.description, expireIn: expiryInSecs, amountMsat: this.invoiceValue*1000 };
    } else {
      invoicePayload = { description: this.description, expireIn: expiryInSecs };
    }
    this.store.dispatch(new RTLActions.OpenSpinner('Creating Invoice...'));
    this.store.dispatch(new ECLRActions.CreateInvoice(invoicePayload));
  }

  resetData() {
    this.description = '';
    this.invoiceValue = undefined;
    this.private = false;
    this.expiry = undefined;
    this.invoiceValueHint = '';
    this.selTimeUnit = TimeUnitEnum.SECS;
    this.invoiceError = '';
  }

  onInvoiceValueChange() {
    if(this.selNode.fiatConversion && this.invoiceValue > 99) {
      this.invoiceValueHint = '';
      this.commonService.convertCurrency(this.invoiceValue, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
      .pipe(takeUntil(this.unSubs[2]))
      .subscribe(data => {
        this.invoiceValueHint = '= ' + data.symbol + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit;
      });
    }
  }

  onTimeUnitChange(event: any) {
    if(this.expiry && this.selTimeUnit !== event.value) {
      this.expiry = this.commonService.convertTime(this.expiry, this.selTimeUnit, event.value);
    }
    this.selTimeUnit = event.value;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
