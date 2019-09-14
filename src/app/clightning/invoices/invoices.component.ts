import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatTableDataSource, MatSort } from '@angular/material';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfoCL, InvoiceCL } from '../../shared/models/clModels';
import { LoggerService } from '../../shared/services/logger.service';

import { newlyAddedRowAnimation } from '../../shared/animation/row-animation';
import { RTLEffects } from '../../store/rtl.effects';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
  animations: [newlyAddedRowAnimation]
})
export class CLInvoicesComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public selNode: SelNodeChild = {};
  public newlyAddedLabel = '';
  public newlyAddedAmount = 0;
  public flgAnimate = true;
  public label = '';
  public expiry: number;
  public amount: number;
  public description = '';
  public displayedColumns = [];
  public invoicePaymentReq = '';
  public invoices: any;
  public information: GetInfoCL = {};
  public flgLoading: Array<Boolean | 'error'> = [true];
  public flgSticky = false;
  public private = false;
  public totalInvoices = 100;
  public pageSize = 25;
  public pageSizeOptions = [5, 10, 25, 100];
  private firstOffset = -1;
  private lastOffset = -1;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['status', 'expires_at_str', 'label', 'msatoshi'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['status', 'expires_at_str', 'paid_at_str', 'label', 'msatoshi', 'msatoshi_received'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['status', 'expires_at_str', 'paid_at_str', 'label', 'pay_index', 'msatoshi', 'msatoshi_received', 'description'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['status', 'expires_at_str', 'paid_at_str', 'label', 'pay_index', 'msatoshi', 'msatoshi_received', 'description'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['status', 'expires_at_str', 'paid_at_str', 'label', 'pay_index', 'msatoshi', 'msatoshi_received', 'description'];
        break;
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
    this.newlyAddedLabel = this.label;
    this.newlyAddedAmount = this.amount;
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Invoice...'));
    this.store.dispatch(new RTLActions.SaveNewInvoiceCL({
      label: this.label, amount: this.amount, description: this.description, expiry: (this.expiry ? this.expiry : 3600), private: this.private
    }));
    this.resetData();
  }

  onDeleteExpiredInvoices() {
    this.store.dispatch(new RTLActions.OpenConfirmation({
      width: '70%', data: { type: 'CONFIRM', titleMessage: 'Delete Expired Invoices', noBtnText: 'Cancel', yesBtnText: 'Delete Invoices'
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.store.dispatch(new RTLActions.OpenSpinner('Deleting Invoices...'));
        this.store.dispatch(new RTLActions.DeleteExpiredInvoiceCL());
      }
    });    
  }

  onInvoiceClick(selRow: InvoiceCL, event: any) {
    const selInvoice = this.invoices.data.filter(invoice => {
      return invoice.bolt11 === selRow.bolt11;
    })[0];
    const reorderedInvoice = JSON.parse(JSON.stringify(selInvoice, [
     'status', 'expires_at_str', 'paid_at_str', 'pay_index', 'label', 'bolt11', 'payment_hash', 'msatoshi', 'msatoshi_received', 'description'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedInvoice)
    }}));
  }

  loadInvoicesTable(invoices) {
    this.invoices = new MatTableDataSource<InvoiceCL>([...invoices]);
    this.invoices.sort = this.sort;
    this.invoices.data.forEach(invoice => {
      if (undefined !== invoice.paid_at_str) {
        invoice.paid_at_str = (invoice.paid_at_str === '') ? '' : formatDate(invoice.paid_at_str, 'MMM/dd/yy HH:mm:ss', 'en-US');
      }
      if (undefined !== invoice.expires_at_str) {
        invoice.expires_at_str = (invoice.expires_at_str === '') ? '' : formatDate(invoice.expires_at_str, 'MMM/dd/yy HH:mm:ss', 'en-US');
      }
    });
    setTimeout(() => { this.flgAnimate = false; }, 5000);
    this.logger.info(this.invoices);
  }

  resetData() {
    this.label = '';
    this.description = '';
    this.amount = 0;
    this.private = false;
    this.expiry = undefined;
  }

  applyFilter(selFilter: string) {
    this.invoices.filter = selFilter;
  }

  // onPageChange(event: any) {
  //   let reversed = true;
  //   let index_offset = this.firstOffset;
  //   if (event.pageIndex < event.previousPageIndex) {
  //     reversed = false;
  //     index_offset = this.lastOffset;
  //   }
  //   if (event.pageIndex === event.previousPageIndex) {
  //     reversed = true;
  //     index_offset = 0;
  //   }
  //   this.store.dispatch(new RTLActions.FetchInvoices({num_max_invoices: event.pageSize, index_offset: index_offset, reversed: reversed}));
  // }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
