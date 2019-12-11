import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatTableDataSource, MatSort, MatPaginatorIntl } from '@angular/material';

import { TimeUnitEnum, CurrencyUnitEnum, TIME_UNITS, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum } from '../../../shared/services/consts-enums-functions';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo, Invoice } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { InvoiceInformationComponent } from '../../../shared/components/data-modal/invoice-information/invoice-information.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') },
  ]  
})
export class LightningInvoicesComponent implements OnInit, OnDestroy {
  @Input() showDetails = true;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  faHistory = faHistory;
  public selNode: SelNodeChild = {};
  public newlyAddedInvoiceMemo = '';
  public newlyAddedInvoiceValue = 0;
  public flgAnimate = true;
  public memo = '';
  public expiry: number;
  public invoiceValue: number;
  public invoiceValueHint = '';
  public displayedColumns = [];
  public invoicePaymentReq = '';
  public invoices: any;
  public information: GetInfo = {};
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
  private firstOffset = -1;
  private lastOffset = -1;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['creation_date', 'value', 'actions'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['creation_date', 'value', 'settle_date', 'actions'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['creation_date', 'memo', 'value', 'settle_date', 'actions'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['creation_date', 'memo', 'value', 'settle_date', 'actions'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['creation_date', 'memo', 'value', 'settle_date', 'actions'];
        break;
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchInvoices') {
          this.flgLoading[0] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.totalInvoices = rtlStore.totalInvoices;
      this.firstOffset = +rtlStore.invoices.first_index_offset;
      this.lastOffset = +rtlStore.invoices.last_index_offset;
      this.logger.info(rtlStore);
      this.loadInvoicesTable(rtlStore.invoices.invoices ? rtlStore.invoices.invoices : []);
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== rtlStore.invoices) ? false : true;
      }
    });

  }

  onAddInvoice(form: any) {
    let expiryInSecs = (this.expiry ? this.expiry : 3600);
    if (this.selTimeUnit !== TimeUnitEnum.SECS) {
      expiryInSecs = this.commonService.convertTime(this.expiry, this.selTimeUnit, TimeUnitEnum.SECS);
    }
    this.flgAnimate = true;
    this.newlyAddedInvoiceMemo = this.memo;
    this.newlyAddedInvoiceValue = this.invoiceValue;
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Invoice...'));
    this.store.dispatch(new RTLActions.SaveNewInvoice({
      memo: this.memo, invoiceValue: this.invoiceValue, private: this.private, expiry: expiryInSecs, pageSize: this.pageSize
    }));
    this.resetData();
  }

  onInvoiceClick(selRow: Invoice, event: any) {
    const selInvoice = this.invoices.data.filter(invoice => {
      return invoice.payment_request === selRow.payment_request;
    })[0];
    this.store.dispatch(new RTLActions.OpenAlert({ width: '58%', 
      data: { 
        invoice: selInvoice,
        newlyAdded: false,
        component: InvoiceInformationComponent
    }}));
  }

  loadInvoicesTable(invoices) {
    this.invoices = new MatTableDataSource<Invoice>([...invoices]);
    this.invoices.sort = this.sort;
    setTimeout(() => { this.flgAnimate = false; }, 5000);
    this.logger.info(this.invoices);
  }

  resetData() {
    this.memo = '';
    this.invoiceValue = undefined;
    this.private = false;
    this.expiry = undefined;
    this.invoiceValueHint = '';
    this.selTimeUnit = TimeUnitEnum.SECS;
  }

  applyFilter(selFilter: string) {
    this.invoices.filter = selFilter;
  }

  onPageChange(event: any) {
    let reversed = true;
    let index_offset = this.firstOffset;
    if (event.pageIndex < event.previousPageIndex) {
      reversed = false;
      index_offset = this.lastOffset;
    }
    if (event.pageIndex === event.previousPageIndex) {
      reversed = true;
      index_offset = 0;
    }
    this.store.dispatch(new RTLActions.FetchInvoices({num_max_invoices: event.pageSize, index_offset: index_offset, reversed: reversed}));
  }

  onInvoiceValueChange() {
    if(this.invoiceValue > 99) {
      this.invoiceValueHint = '';
      this.commonService.convertCurrency(this.invoiceValue, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2])
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

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
