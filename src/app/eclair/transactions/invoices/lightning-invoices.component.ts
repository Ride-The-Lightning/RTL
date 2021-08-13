import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum } from '../../../shared/services/consts-enums-functions';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo, Invoice } from '../../../shared/models/eclModels';
import { ApiCallsListECL } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { ECLCreateInvoiceComponent } from '../create-invoice-modal/create-invoice.component';
import { ECLInvoiceInformationComponent } from '../invoice-information-modal/invoice-information.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';

import * as ECLActions from '../../store/ecl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') }
  ]
})
export class ECLLightningInvoicesComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() calledFrom = 'transactions'; // transactions/home
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  faHistory = faHistory;
  public selNode: SelNodeChild = {};
  public newlyAddedInvoiceMemo = '';
  public newlyAddedInvoiceValue = 0;
  public flgAnimate = true;
  public description = '';
  public expiry: number;
  public invoiceValue: number = null;
  public invoiceValueHint = '';
  public displayedColumns: any[] = [];
  public invoicePaymentReq = '';
  public invoices: any;
  public invoiceJSONArr: Invoice[] = [];
  public information: GetInfo = {};
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apisCallStatus: ApiCallsListECL = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private datePipe: DatePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amount', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amount', 'amountSettled', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amount', 'amountSettled', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['timestamp', 'receivedAt', 'description', 'amount', 'amountSettled', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.errorMessage = '';
      this.apisCallStatus = rtlStore.apisCallStatus;
      if (rtlStore.apisCallStatus.FetchInvoices.status === APICallStatusEnum.ERROR) {
        this.errorMessage = (typeof(this.apisCallStatus.FetchInvoices.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchInvoices.message) : this.apisCallStatus.FetchInvoices.message;
      }
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.invoiceJSONArr = (rtlStore.invoices && rtlStore.invoices.length > 0) ? rtlStore.invoices : [];
      if (this.invoiceJSONArr && this.invoiceJSONArr.length > 0 && this.sort && this.paginator) {
        this.loadInvoicesTable(this.invoiceJSONArr);
      }
      setTimeout(() => { this.flgAnimate = false; }, 5000);
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    if (this.invoiceJSONArr && this.invoiceJSONArr.length > 0 && this.sort && this.paginator) {
      this.loadInvoicesTable(this.invoiceJSONArr);
    }
  }

  openCreateInvoiceModal() {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      pageSize: this.pageSize,
      component: ECLCreateInvoiceComponent
    }}));
  }

  onAddInvoice(form: any): boolean|void {
    if(!this.description) { return true; }
    let expiryInSecs = (this.expiry ? this.expiry : 3600);
    this.flgAnimate = true;
    this.newlyAddedInvoiceMemo = 'ulbl' + Math.random().toString(36).slice(2) + Date.now();
    this.newlyAddedInvoiceValue = this.invoiceValue;
    let invoicePayload = null;
    if (this.invoiceValue) {
      invoicePayload = { description: this.description, expireIn: expiryInSecs, amountMsat: this.invoiceValue*1000 };
    } else {
      invoicePayload = { description: this.description, expireIn: expiryInSecs };
    }
    this.store.dispatch(new ECLActions.CreateInvoice(invoicePayload));
    this.resetData();
  }

  onInvoiceClick(selInvoice: Invoice, event: any) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
        invoice: selInvoice,
        newlyAdded: false,
        component: ECLInvoiceInformationComponent
    }}));
  }

  loadInvoicesTable(invs: Invoice[]) {
    this.invoices = invs ? new MatTableDataSource<Invoice>([...invs]) : new MatTableDataSource<Invoice>([]);
    this.invoices.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId]  && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.invoices.sort = this.sort;
    this.invoices.filterPredicate = (rowData: Invoice, fltr: string) => {
      const newRowData = ((rowData.timestamp) ? this.datePipe.transform(new Date(rowData.timestamp*1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
      return newRowData.includes(fltr);
    };
    this.invoices.paginator = this.paginator;
  }

  resetData() {
    this.description = '';
    this.invoiceValue = null;
    this.expiry = null;
    this.invoiceValueHint = '';
  }

  applyFilter(selFilter: any) {
    this.invoices.filter = selFilter.value.trim().toLowerCase();
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

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
