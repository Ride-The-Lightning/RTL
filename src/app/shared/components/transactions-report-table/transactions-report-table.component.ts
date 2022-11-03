import { Component, ViewChild, Input, AfterViewInit, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, SCROLL_RANGES, SortOrderEnum, LND_PAGE_DEFS, CLN_PAGE_DEFS, ECL_PAGE_DEFS } from '../../services/consts-enums-functions';
import { CommonService } from '../../services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { ColumnDefinition, TableSetting } from '../../models/pageSettings';
import { Subject, takeUntil } from 'rxjs';
import { rootSelectedNode } from '../../../store/rtl.selector';
import { CamelCaseWithReplacePipe } from '../../pipes/app.pipe';

@Component({
  selector: 'rtl-transactions-report-table',
  templateUrl: './transactions-report-table.component.html',
  styleUrls: ['./transactions-report-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Transactions') }
  ]
})
export class TransactionsReportTableComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @Input() dataRange = SCROLL_RANGES[0];
  @Input() dataList = [];
  @Input() selFilter = '';
  @Input() displayedColumns: any[] = ['date', 'amount_paid', 'num_payments', 'amount_received', 'num_invoices'];
  @Input() tableSetting: TableSetting = { tableId: 'transactions', recordsPerPage: PAGE_SIZE, sortBy: 'date', sortOrder: SortOrderEnum.DESCENDING };
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs: any = LND_PAGE_DEFS;
  public selFilterBy = 'all';
  public timezoneOffset = new Date(Date.now()).getTimezoneOffset() * 60;
  public scrollRanges = SCROLL_RANGES;
  public transactions: any = new MatTableDataSource([]);
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((selNode) => {
      this.nodePageDefs = (selNode.lnImplementation === 'CLN') ? CLN_PAGE_DEFS : (selNode.lnImplementation === 'ECL') ? ECL_PAGE_DEFS : LND_PAGE_DEFS;
    });

    this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
    if (this.dataList && this.dataList.length > 0) {
      this.loadTransactionsTable(this.dataList);
    }
  }

  ngAfterViewInit() {
    this.setTableWidgets();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.dataList && !changes.dataList.firstChange) {
      this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
      this.loadTransactionsTable(this.dataList);
    }
    if (changes.selFilter && !changes.selFilter.firstChange) {
      this.selFilterBy = 'all';
      this.applyFilter();
    }
  }

  onTransactionClick(selTransaction: any) {
    const reorderedTransactions = [
      [{ key: 'date', value: this.dataRange === SCROLL_RANGES[1] ? this.datePipe.transform(selTransaction.date, 'MMM/yyyy') : this.datePipe.transform(selTransaction.date, 'dd/MMM/yyyy'), title: 'Date', width: 100, type: DataTypeEnum.DATE }],
      [{ key: 'amount_paid', value: Math.round(selTransaction.amount_paid), title: 'Amount Paid (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'num_payments', value: selTransaction.num_payments, title: '# Payments', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'amount_received', value: Math.round(selTransaction.amount_received), title: 'Amount Received (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'num_invoices', value: selTransaction.num_invoices, title: '# Invoices', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Transaction Summary',
          message: reorderedTransactions
        }
      }
    }));
  }

  applyFilter() {
    if (this.transactions) {
      this.transactions.filter = this.selFilter.trim().toLowerCase();
    }
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs['reports'][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.transactions.filterPredicate = (rowData: any, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = ((rowData.date) ? (this.datePipe.transform(rowData.date, 'dd/MMM') + '/' + rowData.date.getFullYear()).toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
          break;

        case 'date':
          rowToFilter = this.datePipe.transform(new Date(rowData[this.selFilterBy] || 0), this.dataRange === this.scrollRanges[1] ? 'MMM/yyyy' : 'dd/MMM/yyyy')?.toLowerCase() || '';
          break;

        default:
          rowToFilter = !rowData[this.selFilterBy] ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return rowToFilter.includes(fltr);
    };
  }

  loadTransactionsTable(trans: any[]) {
    this.transactions = trans ? new MatTableDataSource([...trans]) : new MatTableDataSource([]);
    this.setTableWidgets();
  }

  setTableWidgets() {
    if (this.transactions && this.transactions.data && this.transactions.data.length > 0) {
      this.transactions.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
      this.transactions.sort = this.sort;
      this.transactions.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
      this.transactions.paginator = this.paginator;
      this.setFilterPredicate();
      this.applyFilter();
    }
  }

  onDownloadCSV() {
    if (this.transactions.data && this.transactions.data.length > 0) {
      this.commonService.downloadFile(this.dataList, 'Transactions-report-' + this.dataRange.toLowerCase());
    }
  }

  ngOnDestroy(): void {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
