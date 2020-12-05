import { Component, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../services/consts-enums-functions';
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
export class TransactionsReportTableComponent implements AfterViewInit {
  @Input() dataList = [];
  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  public transactions: any;
  public displayedColumns = [];
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

  onTransactionClick(selTransaction: any) {
    const reorderedTransactions = [
      [{key: 'date', value: this.datePipe.transform(selTransaction.date, 'dd/MMM/yyyy'), title: 'Date', width: 100, type: DataTypeEnum.DATE}],
      [{key: 'amount_paid', value: selTransaction.amount_paid, title: 'Amount Paid (Sats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'num_payments', value: selTransaction.num_payments, title: '# Payments', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'amount_received', value: selTransaction.amount_received, title: 'Amount Received (Sats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'num_invoices', value: selTransaction.num_invoices, title: '# Invoices', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Transaction Summary',
      message: reorderedTransactions
    }}));
  }

  applyFilter(selFilter: string) {
    this.transactions.filter = selFilter;
  }

  loadTransactionsTable(transactions: any[]) {
    this.transactions = (transactions) ?  new MatTableDataSource([]) : new MatTableDataSource([...transactions]);
    this.transactions.data = transactions;
    this.transactions.sortingDataAccessor = (data, sortHeaderId) => (data[sortHeaderId]  && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : +data[sortHeaderId];
    this.transactions.sort = this.sort;
    this.transactions.paginator = this.paginator;
}

  onDownloadCSV() {
    if(this.transactions.data && this.transactions.data.length > 0) {
      this.commonService.downloadFile(this.dataList, 'Transactions-report');
    }
  }

}
