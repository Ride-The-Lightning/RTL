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
import { GetInfo, Invoice } from '../../../shared/models/eclModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { ECLCreateInvoiceComponent } from '../create-invoice-modal/create-invoice.component';
import { ECLInvoiceInformationComponent } from '../invoice-information-modal/invoice-information.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { RTLEffects } from '../../../store/rtl.effects';
import * as ECLActions from '../../store/ecl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') },
  ]  
})
export class ECLLightningInvoicesComponent implements OnInit, OnDestroy {
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
  public invoiceJSONArr: Invoice[] = [];  
  public information: GetInfo = {};
  public flgLoading: Array<Boolean | 'error'> = [true];
  public flgSticky = false;
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
      this.displayedColumns = ['timestamp', 'amount', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'description', 'amount', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'description', 'amount', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['timestamp', 'description', 'amount', 'receivedAt', 'actions'];
    }
  }

  ngOnInit() {
    this.store.dispatch(new ECLActions.FetchInvoices());
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchInvoices') {
          this.flgLoading[0] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.logger.info(rtlStore);
      this.invoiceJSONArr = (rtlStore.invoices && rtlStore.invoices.length > 0) ? rtlStore.invoices : [];
      this.invoices = (rtlStore.invoices) ?  new MatTableDataSource([]) : new MatTableDataSource<Invoice>([...this.invoiceJSONArr]);
      this.invoices.data = this.invoiceJSONArr;
      this.invoices.sort = this.sort;
      this.invoices.sortingDataAccessor = (data, sortHeaderId) => (data[sortHeaderId]  && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : +data[sortHeaderId];
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
      component: ECLCreateInvoiceComponent
    }}));
  }

  onAddInvoice(form: any) {
    if(!this.description) { return true; }     
    let expiryInSecs = (this.expiry ? this.expiry : 3600);
    if (this.selTimeUnit !== TimeUnitEnum.SECS) {
      expiryInSecs = this.commonService.convertTime(this.expiry, this.selTimeUnit, TimeUnitEnum.SECS);
    }
    this.flgAnimate = true;
    this.newlyAddedInvoiceMemo = 'ulbl' + Math.random().toString(36).slice(2) + Date.now();
    this.newlyAddedInvoiceValue = this.invoiceValue;
    let invoicePayload = null;
    if (this.invoiceValue) {
      invoicePayload = { description: this.description, expireIn: expiryInSecs, amountMsat: this.invoiceValue*1000 };
    } else {
      invoicePayload = { description: this.description, expireIn: expiryInSecs };
    }
    this.store.dispatch(new RTLActions.OpenSpinner('Creating Invoice...'));
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

  resetData() {
    this.description = '';
    this.invoiceValue = undefined;
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
      this.commonService.downloadFile(this.invoices.data, 'Invoices');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
