import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, UI_MESSAGES, LNDActions } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo, Invoice, ListInvoices } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { CreateInvoiceComponent } from '../create-invoice-modal/create-invoice.component';
import { InvoiceInformationComponent } from '../invoice-information-modal/invoice-information.component';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { fetchInvoices, invoiceLookup, saveNewInvoice } from '../../store/lnd.actions';
import { invoices, lndNodeInformation, lndNodeSettings } from '../../store/lnd.selector';

@Component({
  selector: 'rtl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') }
  ]
})
export class LightningInvoicesComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() calledFrom = 'transactions'; // Transactions/home
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  faHistory = faHistory;
  public selNode: SelNodeChild = {};
  public newlyAddedInvoiceMemo = null;
  public newlyAddedInvoiceValue = null;
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
  public selFilter = '';
  public private = false;
  public expiryStep = 100;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  private firstOffset = -1;
  private lastOffset = -1;
  public totalInvoices = 0;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private datePipe: DatePipe, private actions: Actions) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'value', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'settle_date', 'value', 'amt_paid_sat', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'settle_date', 'memo', 'value', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['creation_date', 'settle_date', 'memo', 'value', 'amt_paid_sat', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild) => { this.selNode = nodeSettings; });
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => { this.information = nodeInfo; });
    this.store.select(invoices).pipe(takeUntil(this.unSubs[2])).
      subscribe((invoicesSelector: { listInvoices: ListInvoices, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = invoicesSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.totalInvoices = invoicesSelector.listInvoices.total_invoices;
        this.firstOffset = +invoicesSelector.listInvoices.first_index_offset;
        this.lastOffset = +invoicesSelector.listInvoices.last_index_offset;
        this.invoicesData = invoicesSelector.listInvoices.invoices || [];
        if (this.invoicesData.length > 0 && this.sort && this.paginator) {
          this.loadInvoicesTable(this.invoicesData);
        }
        this.logger.info(invoicesSelector);
      });
    this.actions.pipe(takeUntil(this.unSubs[3]), filter((action) => (action.type === LNDActions.SET_LOOKUP_LND || action.type === LNDActions.UPDATE_API_CALL_STATUS_LND))).
      subscribe((resLookup: any) => {
        if (resLookup.type === LNDActions.SET_LOOKUP_LND) {
          if (this.invoicesData.length > 0 && this.sort && this.paginator && resLookup.payload) {
            this.updateInvoicesData(JSON.parse(JSON.stringify(resLookup.payload)));
            this.loadInvoicesTable(this.invoicesData);
          }
        }
      });
  }

  ngAfterViewInit() {
    if (this.invoicesData.length > 0) {
      this.loadInvoicesTable(this.invoicesData);
    }
  }


  onAddInvoice(form: any) {
    const expiryInSecs = (this.expiry ? this.expiry : 3600);
    this.newlyAddedInvoiceMemo = this.memo;
    this.newlyAddedInvoiceValue = this.invoiceValue;
    this.store.dispatch(saveNewInvoice({
      payload: {
        uiMessage: UI_MESSAGES.ADD_INVOICE, memo: this.memo, invoiceValue: this.invoiceValue, private: this.private, expiry: expiryInSecs, pageSize: this.pageSize, openModal: true
      }
    }));
    this.resetData();
  }

  onInvoiceClick(selInvoice: Invoice) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          invoice: selInvoice,
          newlyAdded: false,
          component: InvoiceInformationComponent
        }
      }
    }));
  }

  onRefreshInvoice(selInvoice: Invoice) {
    this.store.dispatch(invoiceLookup({ payload: { openSnackBar: true, paymentHash: Buffer.from(selInvoice.r_hash.trim(), 'hex').toString('base64').replace(/\+/g, '-').replace(/[/]/g, '_') } }));
  }

  updateInvoicesData(newInvoice: Invoice) {
    this.invoicesData = this.invoicesData.map((invoice) => ((invoice.r_hash === newInvoice.r_hash) ? newInvoice : invoice));
  }

  loadInvoicesTable(invoices) {
    this.invoices = invoices ? new MatTableDataSource<Invoice>([...invoices]) : new MatTableDataSource<Invoice>([]);
    this.invoices.sort = this.sort;
    this.invoices.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.invoices.filterPredicate = (invoice: Invoice, fltr: string) => {
      const newInvoice = ((invoice.creation_date) ? this.datePipe.transform(new Date(invoice.creation_date * 1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + ((invoice.settle_date) ? this.datePipe.transform(new Date(invoice.settle_date * 1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + JSON.stringify(invoice).toLowerCase();
      return newInvoice.includes(fltr);
    };
    this.applyFilter();
    this.logger.info(this.invoices);
  }

  resetData() {
    this.memo = '';
    this.invoiceValue = null;
    this.private = false;
    this.expiry = null;
    this.invoiceValueHint = '';
  }

  applyFilter() {
    this.invoices.filter = this.selFilter.trim().toLowerCase();
  }

  onPageChange(event: PageEvent) {
    let reverse = true;
    let index_offset = this.lastOffset;
    this.pageSize = event.pageSize;
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
      index_offset = 0;
    }
    this.store.dispatch(fetchInvoices({ payload: { num_max_invoices: event.pageSize, index_offset: index_offset, reversed: reverse } }));
  }

  onInvoiceValueChange() {
    if (this.selNode.fiatConversion && this.invoiceValue > 99) {
      this.invoiceValueHint = '';
      this.commonService.convertCurrency(this.invoiceValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
        pipe(takeUntil(this.unSubs[4])).
        subscribe({
          next: (data) => {
            this.invoiceValueHint = '= ' + data.symbol + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit;
          }, error: (err) => {
            this.invoiceValueHint = 'Conversion Error: ' + err;
          }
        });
    }
  }

  onDownloadCSV() {
    if (this.invoices.data && this.invoices.data.length > 0) {
      this.commonService.downloadFile(this.invoices.data, 'Invoices');
    }
  }

  openCreateInvoiceModal() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          pageSize: this.pageSize,
          component: CreateInvoiceComponent
        }
      }
    }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
