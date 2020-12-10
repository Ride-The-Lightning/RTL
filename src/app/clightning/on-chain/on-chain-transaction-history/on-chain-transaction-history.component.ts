import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Transaction } from '../../../shared/models/clModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-on-chain-transaction-history',
  templateUrl: './on-chain-transaction-history.component.html',
  styleUrls: ['./on-chain-transaction-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Transactions') }
  ]  
})
export class CLOnChainTransactionHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  faMoneyBillWave = faMoneyBillWave;
  public displayedColumns = [];
  public transactionsData: Transaction[] = [];
  public listTransactions: any;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['txid', 'value', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['txid', 'output', 'value', 'blockheight', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['txid', 'output', 'value', 'blockheight', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['txid', 'output', 'value', 'blockheight', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchTransactions') {
          this.flgLoading[0] = 'error';
        }
      });
      this.transactionsData = rtlStore.transactions;
      if (this.transactionsData.length > 0) {
        this.loadTransactionsTable(this.transactionsData);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (rtlStore.transactions) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  ngAfterViewInit() {
    if (this.transactionsData.length > 0) {
      this.loadTransactionsTable(this.transactionsData);
    }
  }

  applyFilter(selFilter: string) {
    this.listTransactions.filter = selFilter;
  }

  onTransactionClick(selTransaction: Transaction, event: any) {
    const reorderedTransactions = [
      [{key: 'txid', value: selTransaction.txid, title: 'Transaction ID', width: 100}],
      [{key: 'output', value: selTransaction.output, title: 'Output', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'value', value: selTransaction.value, title: 'Value (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'status', value: this.commonService.titleCase(selTransaction.status), title: 'Status', width: 50, type: DataTypeEnum.STRING},
        {key: 'blockheight', value: selTransaction.blockheight, title: 'Blockheight', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'address', value: selTransaction.address, title: 'Address', width: 100}],
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Transaction Information',
      message: reorderedTransactions
    }}));
  }

  loadTransactionsTable(transactions) {
    this.listTransactions = new MatTableDataSource<Transaction>([...transactions]);
    this.listTransactions.sort = this.sort;
    this.listTransactions.sortingDataAccessor = (data, sortHeaderId) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.listTransactions.paginator = this.paginator;
    this.logger.info(this.listTransactions);
  }

  onDownloadCSV() {
    if(this.listTransactions.data && this.listTransactions.data.length > 0) {
      this.commonService.downloadFile(this.listTransactions.data, 'Transactions');
    }
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
