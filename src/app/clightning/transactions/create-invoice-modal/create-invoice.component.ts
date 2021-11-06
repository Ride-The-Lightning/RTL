import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { InvoiceInformation } from '../../../shared/models/alertData';
import { TimeUnitEnum, CurrencyUnitEnum, TIME_UNITS, CURRENCY_UNIT_FORMATS, PAGE_SIZE, APICallStatusEnum, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo } from '../../../shared/models/clModels';
import { CommonService } from '../../../shared/services/common.service';

import * as CLActions from '../../store/cl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import { RTLState } from '../../../store/rtl.state';

@Component({
  selector: 'rtl-cl-create-invoices',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss']
})
export class CLCreateInvoiceComponent implements OnInit, OnDestroy {

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

  constructor(public dialogRef: MatDialogRef<CLCreateInvoiceComponent>, @Inject(MAT_DIALOG_DATA) public data: InvoiceInformation, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private actions: Actions) { }

  ngOnInit() {
    this.pageSize = this.data.pageSize;
    this.store.select('cl').
      pipe(takeUntil(this.unSubs[0])).
      subscribe((rtlStore) => {
        this.selNode = rtlStore.nodeSettings;
        this.information = rtlStore.information;
      });
    this.actions.pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === CLActions.UPDATE_API_CALL_STATUS_CL || action.type === CLActions.ADD_INVOICE_CL)).
      subscribe((action: CLActions.UpdateAPICallStatus | CLActions.AddInvoice) => {
        if (action.type === CLActions.ADD_INVOICE_CL) {
          this.dialogRef.close();
        }
        if (action.type === CLActions.UPDATE_API_CALL_STATUS_CL && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SaveNewInvoice') {
          this.invoiceError = action.payload.message;
        }
      });
  }

  onAddInvoice(form: any) {
    this.invoiceError = '';
    if (!this.invoiceValue) {
      this.invoiceValue = 0;
    }
    let expiryInSecs = (this.expiry ? this.expiry : 3600);
    if (this.selTimeUnit !== TimeUnitEnum.SECS) {
      expiryInSecs = this.commonService.convertTime(this.expiry, this.selTimeUnit, TimeUnitEnum.SECS);
    }
    this.store.dispatch(new CLActions.SaveNewInvoice({
      label: ('ulbl' + Math.random().toString(36).slice(2) + Date.now()), amount: this.invoiceValue * 1000, description: this.description, expiry: expiryInSecs, private: this.private
    }));
  }

  resetData() {
    this.description = '';
    this.invoiceValue = null;
    this.private = false;
    this.expiry = null;
    this.invoiceValueHint = '';
    this.selTimeUnit = TimeUnitEnum.SECS;
    this.invoiceError = '';
  }

  onInvoiceValueChange() {
    if (this.selNode.fiatConversion && this.invoiceValue > 99) {
      this.invoiceValueHint = '';
      this.commonService.convertCurrency(this.invoiceValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
        pipe(takeUntil(this.unSubs[2])).
        subscribe({
          next: (data) => {
            this.invoiceValueHint = '= ' + data.symbol + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit;
          }, error: (err) => {
            this.invoiceValueHint = 'Conversion Error: ' + err;
          }
        });
    }
  }

  onTimeUnitChange(event: any) {
    if (this.expiry && this.selTimeUnit !== event.value) {
      this.expiry = this.commonService.convertTime(this.expiry, this.selTimeUnit, event.value);
    }
    this.selTimeUnit = event.value;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
