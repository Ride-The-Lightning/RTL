import { Component, ViewChild, Input, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Transaction } from '../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLState } from '../../../../store/rtl.state';
import { openAlert } from '../../../../store/rtl.actions';
import { transactions } from '../../../store/lnd.selector';

@Component({
  selector: 'rtl-on-chain-transaction-history',
  templateUrl: './on-chain-transaction-history.component.html',
  styleUrls: ['./on-chain-transaction-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Transactions') }
  ]
})
export class OnChainTransactionHistoryComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public transactions: Transaction[];
  faHistory = faHistory;
  public displayedColumns: any[] = [];
  public listTransactions: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['time_stamp', 'amount', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['time_stamp', 'amount', 'num_confirmations', 'total_fees', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['time_stamp', 'label', 'amount', 'total_fees', 'num_confirmations', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['time_stamp', 'label', 'amount', 'total_fees', 'block_height', 'num_confirmations', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(transactions).pipe(takeUntil(this.unSubs[0])).
      subscribe((transactionsSelector: { transactions: Transaction[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = transactionsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (transactionsSelector.transactions && transactionsSelector.transactions.length > 0) {
          this.transactions = transactionsSelector.transactions;
          this.loadTransactionsTable(this.transactions);
        }
        this.logger.info(transactionsSelector);
      });
  }

  ngOnChanges() {
    if (this.transactions && this.transactions.length > 0) {
      this.loadTransactionsTable(this.transactions);
    }
  }

  applyFilter() {
    this.listTransactions.filter = this.selFilter.trim().toLowerCase();
  }

  onTransactionClick(selTransaction: Transaction) {
    const reorderedTransactions = [
      [{ key: 'block_hash', value: selTransaction.block_hash, title: 'Block Hash', width: 100 }],
      [{ key: 'tx_hash', value: selTransaction.tx_hash, title: 'Transaction Hash', width: 100 }],
      [{ key: 'label', value: selTransaction.label, title: 'Label', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'time_stamp', value: selTransaction.time_stamp, title: 'Date/Time', width: 50, type: DataTypeEnum.DATE_TIME },
      { key: 'block_height', value: selTransaction.block_height, title: 'Block Height', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'num_confirmations', value: selTransaction.num_confirmations, title: 'Number of Confirmations', width: 34, type: DataTypeEnum.NUMBER },
      { key: 'total_fees', value: selTransaction.total_fees, title: 'Total Fees (Sats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'amount', value: selTransaction.amount, title: 'Amount (Sats)', width: 33, type: DataTypeEnum.NUMBER }],
      [{ key: 'dest_addresses', value: selTransaction.dest_addresses, title: 'Destination Addresses', width: 100, type: DataTypeEnum.ARRAY }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Transaction Information',
          message: reorderedTransactions,
          scrollable: selTransaction.dest_addresses && selTransaction.dest_addresses.length > 5
        }
      }
    }));
  }

  loadTransactionsTable(transactions) {
    this.listTransactions = new MatTableDataSource<Transaction>([...transactions]);
    this.listTransactions.sort = this.sort;
    this.listTransactions.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.listTransactions.filterPredicate = (rowData: Transaction, fltr: string) => {
      const newRowData = ((rowData.time_stamp) ? this.datePipe.transform(new Date(rowData.time_stamp * 1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
      return newRowData.includes(fltr);
    };
    this.listTransactions.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.listTransactions);
  }

  onDownloadCSV() {
    if (this.listTransactions.data && this.listTransactions.data.length > 0) {
      this.commonService.downloadFile(this.listTransactions.data, 'Transactions');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
