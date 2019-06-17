import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { Node } from '../../shared/models/RTLconfig';
import { GetInfo, Invoice } from '../../shared/models/lndModels';
import { LoggerService } from '../../shared/services/logger.service';

import { newlyAddedRowAnimation } from '../../shared/animation/row-animation';
import * as RTLActions from '../../shared/store/rtl.actions';
import * as fromRTLReducer from '../../shared/store/rtl.reducers';

@Component({
  selector: 'rtl-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
  animations: [newlyAddedRowAnimation]
})
export class InvoicesComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  public selNode: Node;
  public newlyAddedInvoiceMemo = '';
  public newlyAddedInvoiceValue = 0;
  public flgAnimate = true;
  public memo = '';
  public expiry: number;
  public invoiceValue: number;
  public displayedColumns = [];
  public invoicePaymentReq = '';
  public invoices: any;
  public information: GetInfo = {};
  public flgLoading: Array<Boolean | 'error'> = [true];
  public flgSticky = false;
  public private = false;
  public totalInvoices = 100;
  public pageSize = 25;
  public pageSizeOptions = [5, 10, 25, 100];
  private firstOffset = -1;
  private lastOffset = -1;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>, private actions$: Actions) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['settled', 'creation_date', 'memo', 'value'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['settled', 'creation_date', 'settle_date', 'memo', 'value', 'amt_paid_sat'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['settled', 'creation_date', 'settle_date', 'memo', 'value', 'amt_paid_sat'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['settled', 'creation_date', 'settle_date', 'memo', 'value', 'amt_paid_sat', 'expiry', 'cltv_expiry'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['settled', 'creation_date', 'settle_date', 'memo', 'value', 'amt_paid_sat', 'expiry', 'cltv_expiry'];
        break;
    }
  }

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchInvoices') {
          this.flgLoading[0] = 'error';
        }
      });
      this.selNode = rtlStore.selNode;
      this.information = rtlStore.information;
      this.totalInvoices = rtlStore.totalInvoices;
      this.firstOffset = +rtlStore.invoices.first_index_offset;
      this.lastOffset = +rtlStore.invoices.last_index_offset;
      this.logger.info(rtlStore);
      this.loadInvoicesTable(rtlStore.invoices.invoices);
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== rtlStore.invoices) ? false : true;
      }
    });

  }

  onAddInvoice(form: any) {
    this.flgAnimate = true;
    this.newlyAddedInvoiceMemo = this.memo;
    this.newlyAddedInvoiceValue = this.invoiceValue;
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Invoice...'));
    this.store.dispatch(new RTLActions.SaveNewInvoice({
      memo: this.memo, invoiceValue: this.invoiceValue, private: this.private, expiry: (this.expiry ? this.expiry : 3600), pageSize: this.pageSize
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
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedInvoice)
    }}));
  }

  loadInvoicesTable(invoices) {
    this.invoices = new MatTableDataSource<Invoice>([...invoices]);
    this.invoices.sort = this.sort;
    this.invoices.data.forEach(invoice => {
      if (undefined !== invoice.creation_date_str) {
        invoice.creation_date_str = (invoice.creation_date_str === '') ? '' : formatDate(invoice.creation_date_str, 'MMM/dd/yy HH:mm:ss', 'en-US');
      }
      if (undefined !== invoice.settle_date_str) {
        invoice.settle_date_str = (invoice.settle_date_str === '') ? '' : formatDate(invoice.settle_date_str, 'MMM/dd/yy HH:mm:ss', 'en-US');
      }
    });
    setTimeout(() => { this.flgAnimate = false; }, 30000);
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

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
