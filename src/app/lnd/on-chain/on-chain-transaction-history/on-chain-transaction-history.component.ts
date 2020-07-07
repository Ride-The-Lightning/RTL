import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Transaction } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as LNDActions from '../../store/lnd.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-on-chain-transaction-history',
  templateUrl: './on-chain-transaction-history.component.html',
  styleUrls: ['./on-chain-transaction-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Transactions') }
  ]  
})
export class OnChainTransactionHistoryComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  faHistory = faHistory;
  public displayedColumns = [];
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
      this.displayedColumns = ['time_stamp_str', 'amount', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['time_stamp_str', 'amount', 'num_confirmations', 'total_fees', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['time_stamp_str', 'amount', 'total_fees', 'block_height', 'num_confirmations', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['time_stamp_str', 'amount', 'total_fees', 'block_height', 'num_confirmations', 'actions'];
    }
  }

  ngOnInit() {
    this.store.dispatch(new LNDActions.FetchTransactions());
    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchTransactions') {
          this.flgLoading[0] = 'error';
        }
      });
      if ( rtlStore.transactions) {
        this.loadTransactionsTable(rtlStore.transactions);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( rtlStore.transactions) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  applyFilter(selFilter: string) {
    this.listTransactions.filter = selFilter;
  }

  onTransactionClick(selTransaction: Transaction, event: any) {
    const reorderedTransactions = [
      [{key: 'block_hash', value: selTransaction.block_hash, title: 'Block Hash', width: 100}],
      [{key: 'tx_hash', value: selTransaction.tx_hash, title: 'Transaction Hash', width: 100}],
      [{key: 'time_stamp_str', value: selTransaction.time_stamp_str, title: 'Date/Time', width: 50, type: DataTypeEnum.DATE_TIME},
        {key: 'block_height', value: selTransaction.block_height, title: 'Block Height', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'num_confirmations', value: selTransaction.num_confirmations, title: 'Number of Confirmations', width: 34, type: DataTypeEnum.NUMBER},
        {key: 'total_fees', value: selTransaction.total_fees, title: 'Total Fees (Sats)', width: 33, type: DataTypeEnum.NUMBER},
        {key: 'amount', value: selTransaction.amount, title: 'Amount (Sats)', width: 33, type: DataTypeEnum.NUMBER}],
      [{key: 'dest_addresses', value: selTransaction.dest_addresses, title: 'Destination Addresses', width: 100, type: DataTypeEnum.ARRAY}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Transaction Information',
      message: reorderedTransactions,
      scrollable: selTransaction.dest_addresses && selTransaction.dest_addresses.length > 5
    }}));
  }

  loadTransactionsTable(transactions) {
    this.listTransactions = new MatTableDataSource<Transaction>([...transactions]);
    this.listTransactions.sort = this.sort;
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
