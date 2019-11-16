import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatTableDataSource, MatSort } from '@angular/material';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo, Invoice } from '../../../shared/models/lndModels';
import { CurrencyUnitConvertPipe } from '../../../shared/pipes/app.pipe';
import { LoggerService } from '../../../shared/services/logger.service';
import { InvoiceInformationComponent } from '../../../shared/components/invoice-information/invoice-information.component';

import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  animations: [newlyAddedRowAnimation]
})
export class LightningInvoicesComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  faHistory = faHistory;
  public currencyUnits = [];
  public currConvertorRate = null;
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
  public timeUnits = ['Secs', 'Mins', 'Hours', 'Days'];
  public selTimeUnit = 'Secs';
  public expiryStep = 100;
  public totalInvoices = 100;
  public pageSize = 10;
  public pageSizeOptions = [5, 10, 25, 100];
  private firstOffset = -1;
  private lastOffset = -1;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private httpClient: HttpClient, private currencyConvert: CurrencyUnitConvertPipe, private decimalPipe: DecimalPipe) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['settled', 'creation_date', 'value', 'actions'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['settled', 'creation_date', 'value', 'settle_date', 'actions'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['settled', 'creation_date', 'memo', 'value', 'settle_date', 'actions'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['settled', 'creation_date', 'memo', 'value', 'settle_date', 'actions'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['settled', 'creation_date', 'memo', 'value', 'settle_date', 'actions'];
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
      this.currencyUnits = rtlStore.nodeSettings.currencyUnits;
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
    if (this.selTimeUnit !== this.timeUnits[0]) {
      switch (this.selTimeUnit) {
        case this.timeUnits[1]:
          expiryInSecs = this.expiry * 60;      
          break;
        case this.timeUnits[2]:
          expiryInSecs = this.expiry * 3600;
          break;
        case this.timeUnits[3]:
          expiryInSecs = this.expiry * 3600 * 24;      
          break;
        default:
          expiryInSecs = this.expiry;
          break;
      }
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
    const reorderedInvoice = JSON.parse(JSON.stringify(selInvoice, [
      'settled', 'creation_date_str', 'settle_date_str', 'memo', 'receipt', 'r_preimage', 'r_hash', 'value', 'payment_request',
      'description_hash', 'expiry', 'fallback_addr', 'cltv_expiry', 'route_hints', 'private', 'add_index', 'settle_index',
      'amt_paid', 'amt_paid_sat', 'amt_paid_msat'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({
      config: { width: '58%', data: { type: 'INFO', message: JSON.stringify(reorderedInvoice)}},
      component: InvoiceInformationComponent
    }));
  }

  loadInvoicesTable(invoices) {
    this.invoices = new MatTableDataSource<Invoice>([...invoices]);
    this.invoices.sort = this.sort;
    setTimeout(() => { this.flgAnimate = false; }, 5000);
    this.logger.info(this.invoices);
  }

  resetData() {
    this.memo = '';
    this.invoiceValue = 0;
    this.private = false;
    this.expiry = undefined;
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
    let self = this;
    if(this.currencyUnits[2] && this.invoiceValue && this.invoiceValue.toString().length > 2) {
      if(!this.currConvertorRate) {
        this.httpClient.get('https://blockchain.info/ticker')
        .pipe(takeUntil(this.unSubs[0]))
        .subscribe((currConvertorData: any) => {
          self.currConvertorRate = currConvertorData;
          self.invoiceValueHint = '= ' + currConvertorData[self.currencyUnits[2]].symbol + self.decimalPipe.transform(self.currencyConvert.transform(self.invoiceValue.toString(), currConvertorData[self.currencyUnits[2]].last * 0.00000001), '1.2-2') + ' ' + self.currencyUnits[2];
        });
      } else {
        self.invoiceValueHint = '= ' + this.currConvertorRate[self.currencyUnits[2]].symbol + self.decimalPipe.transform(self.currencyConvert.transform(self.invoiceValue.toString(), this.currConvertorRate[self.currencyUnits[2]].last * 0.00000001), '1.2-2') + ' ' + self.currencyUnits[2];
      }
    }
  }

  onTimeUnitChange(event: any) {
    if(this.expiry && this.selTimeUnit !== event.value) {
      switch (this.selTimeUnit) {
        case this.timeUnits[0]:
          switch (event.value) {
            case this.timeUnits[1]:
              this.expiry = this.expiry / 60;
              break;
            case this.timeUnits[2]:
              this.expiry = this.expiry / 3600;
              break;
            case this.timeUnits[3]:
              this.expiry = this.expiry / (3600 * 24);
              break;
            default:
              break;
          }
          break;
        case this.timeUnits[1]:
          switch (event.value) {
            case this.timeUnits[0]:
              this.expiry = this.expiry * 60;
              break;
            case this.timeUnits[2]:
              this.expiry = this.expiry / 60;
              break;
            case this.timeUnits[3]:
              this.expiry = this.expiry / (60 * 24);
              break;
            default:
              break;
          }
          break;
        case this.timeUnits[2]:
          switch (event.value) {
            case this.timeUnits[0]:
              this.expiry = this.expiry * 3600;
              break;
            case this.timeUnits[1]:
              this.expiry = this.expiry * 60;
              break;
            case this.timeUnits[3]:
              this.expiry = this.expiry / 24;
              break;
            default:
              break;
          }
          break;
        case this.timeUnits[3]:
          switch (event.value) {
            case this.timeUnits[0]:
              this.expiry = this.expiry * 3600 * 24;
              break;
            case this.timeUnits[1]:
              this.expiry = this.expiry * 60 * 24;
              break;
            case this.timeUnits[2]:
              this.expiry = this.expiry * 24;
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
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
