import { Component, ViewChild, Input, OnChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UTXO } from '../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, WALLET_ADDRESS_TYPE } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-on-chain-utxos',
  templateUrl: './utxos.component.html',
  styleUrls: ['./utxos.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('UTXOs') }
  ]  
})
export class OnChainUTXOsComponent implements OnChanges {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @Input() utxos: UTXO[];
  @Input() errorLoading: any;
  public addressType = WALLET_ADDRESS_TYPE;
  faMoneyBillWave = faMoneyBillWave;
  public displayedColumns = [];
  public listUTXOs: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['amount_sat', 'confirmations', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['address_type', 'address', 'amount_sat', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['address_type', 'address', 'amount_sat', 'confirmations', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['address_type', 'address', 'amount_sat', 'confirmations', 'actions'];
    }
  }

  ngOnChanges() {
    if (this.utxos && this.utxos.length > 0) {
      this.loadUTXOsTable(this.utxos);
    }
  }

  applyFilter(selFilter: string) {
    this.listUTXOs.filter = selFilter;
  }

  onUTXOClick(selUTXO: UTXO, event: any) {
    const reorderedUTXOs = [
      [{key: 'address_type', value: this.addressType[selUTXO.address_type].name, title: 'Address Type', width: 34},
      {key: 'amount_sat', value: selUTXO.amount_sat, title: 'Amount (Sats)', width: 33, type: DataTypeEnum.STRING},
      {key: 'confirmations', value: selUTXO.confirmations, title: 'Confirmations', width: 33, type: DataTypeEnum.STRING}],
      [{key: 'address', value: selUTXO.address, title: 'Address', width: 100}],
      [{key: 'outpoint', value: selUTXO.outpoint, title: 'Outpoint', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'pk_script', value: selUTXO.pk_script, title: 'PK Script', width: 100, type: DataTypeEnum.STRING}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'UTXO Information',
      message: reorderedUTXOs
    }}));
  }

  loadUTXOsTable(UTXOs) {
    this.listUTXOs = new MatTableDataSource<UTXO>([...UTXOs]);
    this.listUTXOs.sort = this.sort;
    this.listUTXOs.sortingDataAccessor = (data, sortHeaderId) => (data[sortHeaderId]  && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : +data[sortHeaderId];
    this.listUTXOs.paginator = this.paginator;
    this.logger.info(this.listUTXOs);
  }

  onDownloadCSV() {
    if(this.listUTXOs.data && this.listUTXOs.data.length > 0) {
      this.commonService.downloadFile(this.listUTXOs.data, 'UTXOs');
    }
  }

}
