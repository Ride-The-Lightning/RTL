import { Component, ViewChild, Input, OnChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Transaction } from '../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-on-chain-transaction-history',
  templateUrl: './on-chain-transaction-history.component.html',
  styleUrls: ['./on-chain-transaction-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Transactions') }
  ]  
})
export class OnChainTransactionHistoryComponent implements OnChanges {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  @Input() transactions: Transaction[];
  @Input() errorLoading: any;
  faHistory = faHistory;
  public displayedColumns: any[] = [];
  public listTransactions: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['time_stamp', 'amount', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['time_stamp', 'amount', 'num_confirmations', 'total_fees', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['time_stamp', 'label', 'amount', 'total_fees', 'num_confirmations', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['time_stamp', 'label', 'amount', 'total_fees', 'block_height', 'num_confirmations', 'actions'];
    }
  }

  ngOnChanges() {
    if (this.transactions && this.transactions.length > 0) {
      this.loadTransactionsTable(this.transactions);
    }
  }

  applyFilter(selFilter: any) {
    this.listTransactions.filter = selFilter.value.trim().toLowerCase();
  }

  onTransactionClick(selTransaction: Transaction) {
    const reorderedTransactions = [
      [{key: 'block_hash', value: selTransaction.block_hash, title: 'Block Hash', width: 100}],
      [{key: 'tx_hash', value: selTransaction.tx_hash, title: 'Transaction Hash', width: 100}],
      [{key: 'label', value: selTransaction.label, title: 'Label', width: 100, type: DataTypeEnum.STRING}],
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
    this.listTransactions.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.listTransactions.filterPredicate = (transaction: Transaction, fltr: string) => JSON.stringify(transaction).toLowerCase().includes(fltr);
    this.listTransactions.paginator = this.paginator;
    this.logger.info(this.listTransactions);
  }

  onDownloadCSV() {
    if(this.listTransactions.data && this.listTransactions.data.length > 0) {
      this.commonService.downloadFile(this.listTransactions.data, 'Transactions');
    }
  }

}
