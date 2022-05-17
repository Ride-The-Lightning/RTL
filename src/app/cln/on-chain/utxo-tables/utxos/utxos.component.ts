import { Component, ViewChild, Input, OnChanges, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UTXO } from '../../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLState } from '../../../../store/rtl.state';
import { openAlert } from '../../../../store/rtl.actions';
import { utxos } from '../../../store/cln.selector';

@Component({
  selector: 'rtl-cln-on-chain-utxos',
  templateUrl: './utxos.component.html',
  styleUrls: ['./utxos.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('UTXOs') }
  ]
})
export class CLNOnChainUtxosComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @Input() numDustUTXOs = 0;
  @Input() isDustUTXO = false;
  @Input() utxos: UTXO[];
  public displayedColumns: any[] = [];
  public listUTXOs: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['txid', 'value', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['txid', 'output', 'value', 'blockheight', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['txid', 'output', 'value', 'blockheight', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['txid', 'output', 'value', 'blockheight', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(utxos).pipe(takeUntil(this.unSubs[0])).
      subscribe((utxosSeletor: { utxos: UTXO[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = utxosSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.logger.info(utxosSeletor);
      });
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

  applyFilter() {
    this.listUTXOs.filter = this.selFilter.trim().toLowerCase();
  }

  onUTXOClick(selUtxo: UTXO, event: any) {
    const reorderedUTXO = [
      [{ key: 'txid', value: selUtxo.txid, title: 'Transaction ID', width: 100 }],
      [{ key: 'output', value: selUtxo.output, title: 'Output', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'value', value: selUtxo.value, title: 'Value (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'status', value: this.commonService.titleCase(selUtxo.status), title: 'Status', width: 50, type: DataTypeEnum.STRING },
      { key: 'blockheight', value: selUtxo.blockheight, title: 'Blockheight', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'address', value: selUtxo.address, title: 'Address', width: 100 }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'UTXO Information',
          message: reorderedUTXO
        }
      }
    }));
  }

  loadUTXOsTable(utxos: any[]) {
    this.listUTXOs = new MatTableDataSource<UTXO>([...utxos]);
    this.listUTXOs.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.listUTXOs.sort = this.sort;
    this.listUTXOs.filterPredicate = (utxo: UTXO, fltr: string) => JSON.stringify(utxo).toLowerCase().includes(fltr);
    this.listUTXOs.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.listUTXOs);
  }

  onDownloadCSV() {
    if (this.listUTXOs.data && this.listUTXOs.data.length > 0) {
      this.commonService.downloadFile(this.listUTXOs.data, 'UTXOs');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
