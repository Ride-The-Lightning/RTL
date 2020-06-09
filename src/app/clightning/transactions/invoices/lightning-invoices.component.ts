import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { TimeUnitEnum, CurrencyUnitEnum, TIME_UNITS, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfoCL, InvoiceCL } from '../../../shared/models/clModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { CLInvoiceInformationComponent } from '../invoice-information-modal/invoice-information.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { CLCreateInvoiceComponent } from '../create-invoice-modal/create-invoice.component';

@Component({
  selector: 'rtl-cl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') },
  ]  
})
export class CLLightningInvoicesComponent implements OnInit, OnDestroy {
  @Input() showDetails = true;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;  
  faHistory = faHistory;
  public selNode: SelNodeChild = {};
  public newlyAddedInvoiceMemo = '';
  public newlyAddedInvoiceValue = 0;
  public flgAnimate = true;
  public description = '';
  public expiry: number;
  public invoiceValue: number;
  public invoiceValueHint = '';
  public displayedColumns = [];
  public invoicePaymentReq = '';
  public invoices: any;
  public invoiceJSONArr: InvoiceCL[] = [];  
  public information: GetInfoCL = {};
  public flgLoading: Array<Boolean | 'error'> = [true];
  public flgSticky = false;
  public private = false;
  public expiryStep = 100;
  public totalInvoices = 100;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public timeUnitEnum = TimeUnitEnum;
  public timeUnits = TIME_UNITS;
  public selTimeUnit = TimeUnitEnum.SECS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private rtlEffects: RTLEffects) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['expires_at_str', 'msatoshi', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['expires_at_str', 'description', 'msatoshi', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['expires_at_str', 'description', 'msatoshi', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['expires_at_str', 'paid_at_str', 'description', 'msatoshi', 'actions'];
    }
  }

  ngOnInit() {
    this.store.dispatch(new RTLActions.FetchInvoicesCL({num_max_invoices: 100, index_offset: 0, reversed: false}));
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'FetchInvoicesCL') {
          this.flgLoading[0] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.totalInvoices = rtlStore.totalInvoices;
      this.logger.info(rtlStore);
      this.invoiceJSONArr = (rtlStore.invoices.invoices && rtlStore.invoices.invoices.length > 0) ? rtlStore.invoices.invoices : [];
      this.invoices = (rtlStore.invoices.invoices) ?  new MatTableDataSource([]) : new MatTableDataSource<InvoiceCL>([...this.invoiceJSONArr]);
      this.invoices.data = this.invoiceJSONArr;
      this.invoices.sort = this.sort;
      this.invoices.paginator = this.paginator;    
      setTimeout(() => { this.flgAnimate = false; }, 5000);
      this.logger.info(this.invoices);
  
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( rtlStore.invoices) ? false : true;
      }
    });

  }

  openCreateInvoiceModal() {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      pageSize: this.pageSize,
      component: CLCreateInvoiceComponent
    }}));
  }

  onAddInvoice(form: any) {
    if(!this.invoiceValue) { return true; }     
    let expiryInSecs = (this.expiry ? this.expiry : 3600);
    if (this.selTimeUnit !== TimeUnitEnum.SECS) {
      expiryInSecs = this.commonService.convertTime(this.expiry, this.selTimeUnit, TimeUnitEnum.SECS);
    }
    this.flgAnimate = true;
    this.newlyAddedInvoiceMemo = 'ulbl' + Math.random().toString(36).slice(2) + Date.now();
    this.newlyAddedInvoiceValue = this.invoiceValue;
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Invoice...'));
    this.store.dispatch(new RTLActions.SaveNewInvoiceCL({
      label: this.newlyAddedInvoiceMemo, amount: this.invoiceValue*1000, description: this.description, expiry: expiryInSecs, private: this.private
    }));
    this.resetData();
  }

  onDeleteExpiredInvoices() {
    this.store.dispatch(new RTLActions.OpenConfirmation({
      data: { type: 'CONFIRM', titleMessage: 'Delete Expired Invoices', noBtnText: 'Cancel', yesBtnText: 'Delete Invoices' }
    }));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.store.dispatch(new RTLActions.OpenSpinner('Deleting Invoices...'));
        this.store.dispatch(new RTLActions.DeleteExpiredInvoiceCL());
      }
    });    
  }

  onInvoiceClick(selInvoice: InvoiceCL, event: any) {
    let reCreatedInvoice: InvoiceCL = {
      msatoshi: selInvoice.msatoshi,
      label: selInvoice.label,
      expires_at_str: selInvoice.expires_at_str,
      paid_at_str: selInvoice.paid_at_str,
      bolt11: selInvoice.bolt11,
      payment_hash: selInvoice.payment_hash,
      description: selInvoice.description,
      status: selInvoice.status,
      msatoshi_received: selInvoice.msatoshi_received
    };
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
        invoice: reCreatedInvoice,
        newlyAdded: false,
        component: CLInvoiceInformationComponent
    }}));
  }

  resetData() {
    this.description = '';
    this.invoiceValue = undefined;
    this.private = false;
    this.expiry = undefined;
    this.invoiceValueHint = '';
    this.selTimeUnit = TimeUnitEnum.SECS;
  }

  applyFilter(selFilter: string) {
    this.invoices.filter = selFilter;
  }

  onInvoiceValueChange() {
    if(this.selNode.fiatConversion && this.invoiceValue > 99) {
      this.invoiceValueHint = '';
      this.commonService.convertCurrency(this.invoiceValue, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
      .pipe(takeUntil(this.unSubs[1]))
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

  onDownloadCSV() {
    if(this.invoices.data && this.invoices.data.length > 0) {
      this.commonService.downloadCSV(this.invoices.data, 'Invoices');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
