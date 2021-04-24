import { Component, ViewChild, Input, OnChanges, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UTXO } from '../../../../shared/models/clModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-on-chain-utxos',
  templateUrl: './utxos.component.html',
  styleUrls: ['./utxos.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('UTXOs') }
  ]  
})
export class CLOnChainUtxosComponent implements OnChanges, AfterViewInit {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  @Input() numDustUTXOs = 0;
  @Input() isDustUTXO = false;
  @Input() utxos: UTXO[];
  @Input() errorLoading: any;
  public displayedColumns: any[] = [];
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

  ngAfterViewInit() {
    if (this.utxos && this.utxos.length > 0 && this.sort && this.paginator) {
      this.loadUTXOsTable(this.utxos);
    }
  }

  ngOnChanges() {
    if (this.utxos && this.utxos.length > 0) {
      this.loadUTXOsTable(this.utxos);
    }
  }

  applyFilter(selFilter: any) {
    this.listUTXOs.filter = selFilter.value.trim().toLowerCase();
  }

  onUTXOClick(selUtxo: UTXO, event: any) {
    const reorderedUTXO = [
      [{key: 'txid', value: selUtxo.txid, title: 'Transaction ID', width: 100}],
      [{key: 'output', value: selUtxo.output, title: 'Output', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'value', value: selUtxo.value, title: 'Value (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'status', value: this.commonService.titleCase(selUtxo.status), title: 'Status', width: 50, type: DataTypeEnum.STRING},
        {key: 'blockheight', value: selUtxo.blockheight, title: 'Blockheight', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'address', value: selUtxo.address, title: 'Address', width: 100}],
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'UTXO Information',
      message: reorderedUTXO
    }}));
  }

  loadUTXOsTable(utxos: any[]) {
    this.listUTXOs = new MatTableDataSource<UTXO>([...utxos]);
    this.listUTXOs.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.listUTXOs.sort = this.sort;
    this.listUTXOs.filterPredicate = (utxo: UTXO, fltr: string) => JSON.stringify(utxo).toLowerCase().includes(fltr);
    this.listUTXOs.paginator = this.paginator;
    this.logger.info(this.listUTXOs);
  }

  onDownloadCSV() {
    if(this.listUTXOs.data && this.listUTXOs.data.length > 0) {
      this.commonService.downloadFile(this.listUTXOs.data, 'UTXOs');
    }
  }

}
