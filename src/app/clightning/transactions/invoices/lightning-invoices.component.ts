import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { ApiCallsListCL } from '../../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo, Invoice } from '../../../shared/models/clModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { CLCreateInvoiceComponent } from '../create-invoice-modal/create-invoice.component';
import { CLInvoiceInformationComponent } from '../invoice-information-modal/invoice-information.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';

import { RTLEffects } from '../../../store/rtl.effects';
import * as CLActions from '../../store/cl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') },
  ]  
})
export class CLLightningInvoicesComponent implements OnInit, AfterViewInit, OnDestroy {
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
  public private = false;
  public expiryStep = 100;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apisCallStatus: ApiCallsListCL = null;
  public apiCallStatusEnum = APICallStatusEnum;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private rtlEffects: RTLEffects, private datePipe: DatePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['expires_at', 'msatoshi', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['expires_at', 'description', 'msatoshi', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['expires_at', 'description', 'msatoshi', 'msatoshi_received', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['expires_at', 'paid_at', 'description', 'msatoshi', 'msatoshi_received', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.errorMessage = '';
      this.apisCallStatus = rtlStore.apisCallStatus;
      if (rtlStore.apisCallStatus.FetchInvoices.status === APICallStatusEnum.ERROR) {
        this.errorMessage = (typeof(this.apisCallStatus.FetchInvoices.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchInvoices.message) : this.apisCallStatus.FetchInvoices.message;
      }
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.invoiceJSONArr = (rtlStore.invoices.invoices && rtlStore.invoices.invoices.length > 0) ? rtlStore.invoices.invoices : [];
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
      component: CLCreateInvoiceComponent
    }}));
  }

  onAddInvoice(form: any) {
    if(!this.invoiceValue) { this.invoiceValue = 0; }     
    let expiryInSecs = (this.expiry ? this.expiry : 3600);
    this.flgAnimate = true;
    this.newlyAddedInvoiceMemo = 'ulbl' + Math.random().toString(36).slice(2) + Date.now();
    this.newlyAddedInvoiceValue = this.invoiceValue;
    this.store.dispatch(new CLActions.SaveNewInvoice({
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
        this.store.dispatch(new CLActions.DeleteExpiredInvoice());
      }
    });    
  }

  onInvoiceClick(selInvoice: Invoice, event: any) {
    let reCreatedInvoice: Invoice = {
      msatoshi: selInvoice.msatoshi,
      label: selInvoice.label,
      expires_at: selInvoice.expires_at,
      paid_at: selInvoice.paid_at,
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
  }

  applyFilter(selFilter: any) {
    this.invoices.filter = selFilter.value.trim().toLowerCase();
  }

  onInvoiceValueChange() {
    if(this.selNode.fiatConversion && this.invoiceValue > 99) {
      this.invoiceValueHint = '';
      this.commonService.convertCurrency(this.invoiceValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
      .pipe(takeUntil(this.unSubs[1]))
      .subscribe(data => {
        this.invoiceValueHint = '= ' + data.symbol + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit;
      }, err => {
        this.invoiceValueHint = 'Conversion Error: ' + err;
      });
    }
  }

  loadInvoicesTable(invs: Invoice[]) {
    this.invoices = (invs) ? new MatTableDataSource<Invoice>([...invs]) : new MatTableDataSource([]);
    this.invoices.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.invoices.sort = this.sort;
    this.invoices.filterPredicate = (rowData: Invoice, fltr: string) => {
      const newRowData = ((rowData.paid_at) ? this.datePipe.transform(new Date(rowData.paid_at*1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + ((rowData.expires_at) ? this.datePipe.transform(new Date(rowData.expires_at*1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
      return newRowData.includes(fltr);   
    };
    this.invoices.paginator = this.paginator;    
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
