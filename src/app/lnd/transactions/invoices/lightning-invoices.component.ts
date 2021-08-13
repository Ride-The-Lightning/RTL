import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { ApiCallsListLND } from '../../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo, Invoice } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { CreateInvoiceComponent } from '../create-invoice-modal/create-invoice.component';
import { InvoiceInformationComponent } from '../invoice-information-modal/invoice-information.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';

import * as LNDActions from '../../store/lnd.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') }
  ]
})
export class LightningInvoicesComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() calledFrom = 'transactions'; // transactions/home
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  faHistory = faHistory;
  public selNode: SelNodeChild = {};
  public newlyAddedInvoiceMemo = null;
  public newlyAddedInvoiceValue = null;
  public flgAnimate = true;
  public memo = '';
  public expiry: number;
  public invoiceValue: number;
  public invoiceValueHint = '';
  public displayedColumns: any[] = [];
  public invoicePaymentReq = '';
  public invoicesData: Invoice[] = [];
  public invoices: any;
  public information: GetInfo = {};
  public flgSticky = false;
  public private = false;
  public expiryStep = 100;
  public totalInvoices = 100;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  private firstOffset = -1;
  private lastOffset = -1;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apisCallStatus: ApiCallsListLND = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private datePipe: DatePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'value', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'settle_date', 'value', 'amt_paid_sat', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'settle_date', 'memo', 'value', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['creation_date', 'settle_date', 'memo', 'value', 'amt_paid_sat', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.errorMessage = '';
      this.apisCallStatus = rtlStore.apisCallStatus;
      if (rtlStore.apisCallStatus.FetchInvoices.status === APICallStatusEnum.ERROR) {
        this.errorMessage = (typeof(this.apisCallStatus.FetchInvoices.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchInvoices.message) : this.apisCallStatus.FetchInvoices.message;
      }
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.totalInvoices = rtlStore.totalInvoices;
      this.firstOffset = +rtlStore.invoices.first_index_offset;
      this.lastOffset = +rtlStore.invoices.last_index_offset;
      this.invoicesData = rtlStore.invoices.invoices ? rtlStore.invoices.invoices : [];
      if (this.invoicesData.length > 0 && this.sort && this.paginator) {
        this.loadInvoicesTable(this.invoicesData);
      }
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    if (this.invoicesData.length > 0) {
      this.loadInvoicesTable(this.invoicesData);
    }
  }


  onAddInvoice(form: any) {
    let expiryInSecs = (this.expiry ? this.expiry : 3600);
    this.flgAnimate = true;
    this.newlyAddedInvoiceMemo = this.memo;
    this.newlyAddedInvoiceValue = this.invoiceValue;
    this.store.dispatch(new LNDActions.SaveNewInvoice({
      uiMessage: UI_MESSAGES.ADD_INVOICE, memo: this.memo, invoiceValue: this.invoiceValue, private: this.private, expiry: expiryInSecs, pageSize: this.pageSize, openModal: true
    }));
    this.resetData();
  }

  onInvoiceClick(selInvoice: Invoice, event: any) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
        invoice: selInvoice,
        newlyAdded: false,
        component: InvoiceInformationComponent
    }}));
  }

  loadInvoicesTable(invoices) {
    this.invoices = invoices ? new MatTableDataSource<Invoice>([...invoices]) : new MatTableDataSource<Invoice>([]);
    this.invoices.sort = this.sort;
    this.invoices.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.invoices.filterPredicate = (invoice: Invoice, fltr: string) => {
      const newInvoice = ((invoice.creation_date) ? this.datePipe.transform(new Date(invoice.creation_date*1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + ((invoice.settle_date) ? this.datePipe.transform(new Date(invoice.settle_date*1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + JSON.stringify(invoice).toLowerCase();
      return newInvoice.includes(fltr);
    };
    setTimeout(() => { this.flgAnimate = false; }, 5000);
    this.logger.info(this.invoices);
  }

  resetData() {
    this.memo = '';
    this.invoiceValue = undefined;
    this.private = false;
    this.expiry = undefined;
    this.invoiceValueHint = '';
  }

  applyFilter(selFilter: any) {
    this.invoices.filter = selFilter.value.trim().toLowerCase();
  }

  onPageChange(event: PageEvent) {
    let reverse = true;
    let index_offset = this.lastOffset;
    if (event.pageIndex === 0) {
      reverse = true;
      index_offset = 0;
    } else if (event.pageIndex < event.previousPageIndex) {
      reverse = false;
      index_offset = this.lastOffset;
    } else if (event.pageIndex > event.previousPageIndex && (event.length > ((event.pageIndex + 1) * event.pageSize))) {
      reverse = true;
      index_offset = this.firstOffset;
    } else if (event.length <= ((event.pageIndex + 1) * event.pageSize)) {
      reverse = false;
      index_offset = event.length - (event.pageIndex * event.pageSize) + 1;
    }
    this.store.dispatch(new LNDActions.FetchInvoices({num_max_invoices: event.pageSize, index_offset: index_offset, reversed: reverse}));
  }

  onInvoiceValueChange() {
    if(this.selNode.fiatConversion && this.invoiceValue > 99) {
      this.invoiceValueHint = '';
      this.commonService.convertCurrency(this.invoiceValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
      .pipe(takeUntil(this.unSubs[1]))
      .subscribe({next: data => {
        this.invoiceValueHint = '= ' + data.symbol + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit;
      }, error: err => {
        this.invoiceValueHint = 'Conversion Error: ' + err;
      }});
    }
  }

  onDownloadCSV() {
    if(this.invoices.data && this.invoices.data.length > 0) {
      this.commonService.downloadFile(this.invoices.data, 'Invoices');
    }
  }

  openCreateInvoiceModal() {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      pageSize: this.pageSize,
      component: CreateInvoiceComponent
    }}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
