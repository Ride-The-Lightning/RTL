import { Component, ViewChild, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, SCROLL_RANGES } from '../../services/consts-enums-functions';
import { CommonService } from '../../services/common.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-transactions-report-table',
  templateUrl: './transactions-report-table.component.html',
  styleUrls: ['./transactions-report-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Transactions') }
  ]  
})
export class TransactionsReportTableComponent implements AfterViewInit, OnChanges {
  @Input() dataRange = SCROLL_RANGES[0];
  @Input() dataList = [];
  @Input() filterValue = '';
  @ViewChild(MatSort, {static: false}) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  public scrollRanges = SCROLL_RANGES;
  public transactions: any;
  public displayedColumns: any[] = [];
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private datePipe: DatePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['date', 'amount_paid', 'amount_received', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['date', 'amount_paid', 'num_payments', 'amount_received', 'num_invoices', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['date', 'amount_paid', 'num_payments', 'amount_received', 'num_invoices', 'actions'];
    }
  }

  ngAfterViewInit() {
    if (this.dataList && this.dataList.length > 0) {
      this.loadTransactionsTable(this.dataList);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.dataList) {
      this.loadTransactionsTable(this.dataList);
    }
    if (changes.filterValue) {
      this.applyFilter();
    }
  }  

  onTransactionClick(selTransaction: any) {
    const reorderedTransactions = [
      [{key: 'date', value: this.dataRange === SCROLL_RANGES[1] ?  this.datePipe.transform(selTransaction.date, 'MMM/yyyy') : this.datePipe.transform(selTransaction.date, 'dd/MMM/yyyy'), title: 'Date', width: 100, type: DataTypeEnum.DATE}],
      [{key: 'amount_paid', value: Math.round(selTransaction.amount_paid), title: 'Amount Paid (Sats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'num_payments', value: selTransaction.num_payments, title: '# Payments', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'amount_received', value: Math.round(selTransaction.amount_received), title: 'Amount Received (Sats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'num_invoices', value: selTransaction.num_invoices, title: '# Invoices', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Transaction Summary',
      message: reorderedTransactions
    }}));
  }

  applyFilter() {
    this.transactions.filter = this.filterValue.trim().toLowerCase();
  }

  loadTransactionsTable(trans: any[]) {
    this.transactions = trans ? new MatTableDataSource([...trans]) : new MatTableDataSource([]);
    this.transactions.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.transactions.sort = this.sort;
    this.transactions.filterPredicate = (tran: any, fltr: string) => JSON.stringify(tran).toLowerCase().includes(fltr);
    this.transactions.paginator = this.paginator;
}

  onDownloadCSV() {
    if(this.transactions.data && this.transactions.data.length > 0) {
      this.commonService.downloadFile(this.dataList, 'Transactions-report-' + this.dataRange.toLowerCase());
    }
  }

}
