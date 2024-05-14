import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

import { Transaction } from '../../../shared/models/eclModels';
import { ApiCallStatusPayload, ApiCallsListECL } from '../../../shared/models/apiCallsPayload';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, ECL_DEFAULT_PAGE_SETTINGS, ECL_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { fetchTransactions } from '../../store/ecl.actions';
import { eclPageSettings, transactions } from '../../store/ecl.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithSpacesPipe } from '../../../shared/pipes/app.pipe';
import { MessageDataField } from '../../../shared/models/alertData';

@Component({
  selector: 'rtl-ecl-on-chain-transaction-history',
  templateUrl: './on-chain-transaction-history.component.html',
  styleUrls: ['./on-chain-transaction-history.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Transactions') }
  ]
})
export class ECLOnChainTransactionHistoryComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faHistory = faHistory;
  public nodePageDefs = ECL_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'on_chain';
  public tableSetting: TableSetting = { tableId: 'transaction', recordsPerPage: PAGE_SIZE, sortBy: 'timestamp', sortOrder: SortOrderEnum.DESCENDING };
  public displayedColumns: any[] = [];
  public listTransactions: any = new MatTableDataSource([]);
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  public totalRecords = 0;
  public flgInit = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private camelCaseWithSpaces: CamelCaseWithSpacesPipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(eclPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload, allApiCallStatus: ApiCallsListECL }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        if (this.apiCallStatus.status === APICallStatusEnum.COMPLETED) {
          this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || ECL_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
          if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
            this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
          } else {
            this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
          }
          this.displayedColumns.push('actions');
          this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
          this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
          if (!this.flgInit) {
            this.flgInit = true;
            // Uncomment after paginator api is fixed
            // this.store.dispatch(fetchTransactions({ payload : { count: this.pageSize, skip: 0 } }));
            // Remove below one line after paginator api is fixed
            this.store.dispatch(fetchTransactions({ payload : { count: 1000, skip: 0 } }));
          }
          this.logger.info(this.displayedColumns);
        }
      });
    this.store.select(transactions).pipe(takeUntil(this.unSubs[1])).
      subscribe((transactionsSelector: { transactions: Transaction[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = transactionsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        // Uncomment after paginator api is fixed
        // this.totalRecords = transactionsSelector.transactions.totalRecords;
        if (transactionsSelector.transactions && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadTransactionsTable(transactionsSelector.transactions);
        }
        this.logger.info(transactionsSelector);
      });
  }

  applyFilter() {
    this.listTransactions.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithSpaces.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.listTransactions.filterPredicate = (rowData: Transaction, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = ((rowData.timestamp) ? this.datePipe.transform(new Date(rowData.timestamp * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
          break;

        case 'timestamp':
          rowToFilter = this.datePipe.transform(new Date((rowData[this.selFilterBy] || 0) * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() || '';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return rowToFilter.includes(fltr);
    };
  }

  onTransactionClick(selTransaction: Transaction, event: any) {
    const reorderedTransactions: MessageDataField[][] = [
      [{ key: 'blockHash', value: selTransaction.blockHash || selTransaction.blockId_opt, title: 'Block Hash', width: 100, explorerLink: 'block' }],
      [{ key: 'txid', value: selTransaction.txid, title: 'Transaction ID', width: 100, explorerLink: 'tx' }],
      [{ key: 'timestamp', value: selTransaction.timestamp, title: 'Date/Time', width: 50, type: DataTypeEnum.DATE_TIME },
      { key: 'confirmations', value: selTransaction.confirmations, title: 'Number of Confirmations', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'fees', value: selTransaction.fees, title: 'Fees (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'amount', value: selTransaction.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'address', value: selTransaction.address, title: 'Address', width: 100, type: DataTypeEnum.STRING }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Transaction Information',
          message: reorderedTransactions
        }
      }
    }));
  }

  loadTransactionsTable(transactions: Transaction[]) {
    this.listTransactions = new MatTableDataSource<Transaction>([...transactions]);
    this.listTransactions.sort = this.sort;
    this.listTransactions.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    // Remove below one line after paginator api is fixed
    this.listTransactions.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.listTransactions);
  }

  onPageChange(event: PageEvent) {
    this.store.dispatch(fetchTransactions({ payload : { count: this.pageSize, skip: event.pageIndex * event.pageSize } }));
  }

  onDownloadCSV() {
    if (this.listTransactions.data && this.listTransactions.data.length > 0) {
      this.commonService.downloadFile(this.listTransactions.data, 'Transactions');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
