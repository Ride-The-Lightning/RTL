import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Transaction } from '../../../shared/models/eclModels';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { fetchTransactions } from '../../store/ecl.actions';
import { transactions } from '../../store/ecl.selector';

@Component({
  selector: 'rtl-ecl-on-chain-transaction-history',
  templateUrl: './on-chain-transaction-history.component.html',
  styleUrls: ['./on-chain-transaction-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Transactions') }
  ]
})
export class ECLOnChainTransactionHistoryComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
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
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amount', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amount', 'confirmations', 'fees', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amount', 'fees', 'confirmations', 'address', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['timestamp', 'amount', 'fees', 'confirmations', 'address', 'actions'];
    }
  }

  ngOnInit() {
    this.store.dispatch(fetchTransactions());
    this.store.select(transactions).pipe(takeUntil(this.unsub[0])).
      subscribe((transactionsSelector: { transactions: Transaction[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = transactionsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (transactionsSelector.transactions) {
          this.loadTransactionsTable(transactionsSelector.transactions);
        }
        this.logger.info(transactionsSelector);
      });
  }

  applyFilter() {
    this.listTransactions.filter = this.selFilter.trim().toLowerCase();
  }

  onTransactionClick(selTransaction: Transaction, event: any) {
    const reorderedTransactions = [
      [{ key: 'blockHash', value: selTransaction.blockHash, title: 'Block Hash', width: 100 }],
      [{ key: 'txid', value: selTransaction.txid, title: 'Transaction ID', width: 100 }],
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
    this.listTransactions.filterPredicate = (rowData: Transaction, fltr: string) => {
      const newRowData = ((rowData.timestamp) ? this.datePipe.transform(new Date(rowData.timestamp * 1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
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
    this.unsub.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
