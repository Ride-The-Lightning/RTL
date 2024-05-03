import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { CLNInvoiceInformation } from '../../../../shared/models/alertData';
import { TimeUnitEnum, CurrencyUnitEnum, TIME_UNITS, CURRENCY_UNIT_FORMATS, PAGE_SIZE, APICallStatusEnum, CLNActions, DEFAULT_INVOICE_EXPIRY, getSelectedCurrency } from '../../../../shared/services/consts-enums-functions';
import { Node } from '../../../../shared/models/RTLconfig';
import { ConvertedCurrency } from '../../../../shared/models/rtlModels';
import { GetInfo } from '../../../../shared/models/clnModels';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLState } from '../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { saveNewInvoice } from '../../../store/cln.actions';
import { clnNodeInformation } from '../../../store/cln.selector';

@Component({
  selector: 'rtl-cln-create-invoices',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss']
})
export class CLNCreateInvoiceComponent implements OnInit, OnDestroy {

  public faExclamationTriangle = faExclamationTriangle;
  public convertedCurrency: ConvertedCurrency = null;
  public selNode: Node | null;
  public description = '';
  public expiry: number | null;
  public invoiceValue: number | null;
  public invoiceValueHint = '';
  public invoicePaymentReq = '';
  public information: GetInfo = {};
  public private = false;
  public expiryStep = 100;
  public pageSize = PAGE_SIZE;
  public timeUnitEnum = TimeUnitEnum;
  public timeUnits = TIME_UNITS;
  public selTimeUnit = TimeUnitEnum.SECS;
  public invoiceError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLNCreateInvoiceComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNInvoiceInformation, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private actions: Actions) { }

  ngOnInit() {
    this.pageSize = this.data.pageSize;
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: Node | null) => {
      this.selNode = nodeSettings;
    });
    this.store.select(clnNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => {
      this.information = nodeInfo;
    });
    this.actions.pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN)).
      subscribe((action: any) => {
        if (action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && action.payload.action === 'SaveNewInvoice') {
          if (action.payload.status === APICallStatusEnum.ERROR) {
            this.invoiceError = action.payload.message;
          }
          if (action.payload.status === APICallStatusEnum.COMPLETED) {
            this.dialogRef.close();
          }
        }
      });
  }

  onAddInvoice(form: any) {
    this.invoiceError = '';
    if (!this.invoiceValue) {
      this.invoiceValue = 0;
    }
    let expiryInSecs = (this.expiry ? this.expiry : DEFAULT_INVOICE_EXPIRY);
    if (this.selTimeUnit !== TimeUnitEnum.SECS && this.expiry) {
      expiryInSecs = this.commonService.convertTime(this.expiry, this.selTimeUnit, TimeUnitEnum.SECS);
    }
    this.store.dispatch(saveNewInvoice({
      payload: {
        label: ('ulbl' + Math.random().toString(36).slice(2) + Date.now()), amount_msat: (this.invoiceValue ? this.invoiceValue * 1000 : 'any'), description: this.description, expiry: expiryInSecs, exposeprivatechannels: this.private
      }
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
    if (this.selNode && this.selNode.settings.fiatConversion) {
      this.invoiceValueHint = '';
      if (this.invoiceValue && this.invoiceValue > 99) {
        this.commonService.convertCurrency(this.invoiceValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, (this.selNode.settings.currencyUnits && this.selNode.settings.currencyUnits.length > 2 ? this.selNode.settings.currencyUnits[2] : ''), this.selNode.settings.fiatConversion).
          pipe(takeUntil(this.unSubs[3])).
          subscribe({
            next: (data) => {
              this.convertedCurrency = data;
              this.invoiceValueHint = this.decimalPipe.transform(this.convertedCurrency.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + this.convertedCurrency.unit;
            }, error: (err) => {
              this.invoiceValueHint = 'Conversion Error: ' + err;
            }
          });
      }
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
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
