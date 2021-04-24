import { Component, ViewChild, Input, OnChanges, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UTXO } from '../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, WALLET_ADDRESS_TYPE } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { DataService } from '../../../../shared/services/data.service';
import { OnChainLabelModalComponent } from '../../on-chain-label-modal/on-chain-label-modal.component';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import { RTLEffects } from '../../../../store/rtl.effects';

@Component({
  selector: 'rtl-on-chain-utxos',
  templateUrl: './utxos.component.html',
  styleUrls: ['./utxos.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('UTXOs') }
  ]  
})
export class OnChainUTXOsComponent implements OnChanges, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  @Input() numDustUTXOs = 0;
  @Input() isDustUTXO = false;
  @Input() utxos: UTXO[];
  @Input() errorLoading: any;
  public addressType = WALLET_ADDRESS_TYPE;
  faMoneyBillWave = faMoneyBillWave;
  public displayedColumns: any[] = [];
  public listUTXOs: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private dataService: DataService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private decimalPipe: DecimalPipe) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['amount_sat', 'confirmations', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['tx_id', 'output', 'amount_sat', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['tx_id', 'output', 'label', 'amount_sat', 'confirmations', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['tx_id', 'output', 'label', 'amount_sat', 'confirmations', 'actions'];
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

  onUTXOClick(selUTXO: UTXO) {
    const reorderedUTXOs = [
      [{key: 'txid', value: selUTXO.outpoint.txid_str, title: 'Transaction ID', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'label', value: selUTXO.label, title: 'Label', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'output_index', value: selUTXO.outpoint.output_index, title: 'Output Index', width: 34, type: DataTypeEnum.NUMBER},
        {key: 'amount_sat', value: selUTXO.amount_sat, title: 'Amount (Sats)', width: 33, type: DataTypeEnum.NUMBER},
        {key: 'confirmations', value: selUTXO.confirmations, title: 'Confirmations', width: 33, type: DataTypeEnum.NUMBER}],
      [{key: 'address_type', value: this.addressType[selUTXO.address_type].name, title: 'Address Type', width: 34},
        {key: 'address', value: selUTXO.address, title: 'Address', width: 66}],
      [{key: 'pk_script', value: selUTXO.pk_script, title: 'PK Script', width: 100, type: DataTypeEnum.STRING}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'UTXO Information',
      message: reorderedUTXOs
    }}));
  }

  loadUTXOsTable(UTXOs: UTXO[]) {
    this.listUTXOs = new MatTableDataSource<UTXO>([...UTXOs]);
    this.listUTXOs.filterPredicate = (utxo: UTXO, fltr: string) => {
      const newUTXO = ((utxo.label ? utxo.label.toLowerCase() : '') + (utxo.outpoint.txid_str ? utxo.outpoint.txid_str.toLowerCase() : '') + (utxo.outpoint.output_index ? utxo.outpoint.output_index : '')
      + (utxo.outpoint.txid_bytes ? utxo.outpoint.txid_bytes.toLowerCase() : '') + (utxo.address ? utxo.address.toLowerCase() : '') + (utxo.address_type ? utxo.address_type.toLowerCase() : '')
      + (utxo.amount_sat ? utxo.amount_sat : '') + (utxo.confirmations ? utxo.confirmations : '') + (utxo.pk_script ? utxo.pk_script.toLowerCase() : ''));
      return newUTXO.includes(fltr);
    };
    this.listUTXOs.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'tx_id': return data.outpoint.txid_str.toLocaleLowerCase();
        case 'output': return +data.outpoint.output_index;
        default: return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    }
    this.listUTXOs.sort = this.sort;
    this.listUTXOs.filterPredicate = (utxo: UTXO, fltr: string) => JSON.stringify(utxo).toLowerCase().includes(fltr);
    this.listUTXOs.paginator = this.paginator;
    this.logger.info(this.listUTXOs);
  }

  onLabelUTXO(utxo: UTXO) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      utxo: utxo,
      component: OnChainLabelModalComponent
    }}));
  }

  onLeaseUTXO(utxo: UTXO) {
    const utxoDetails = [
      [{key: 'txid_str', value: utxo.outpoint.txid_str, title: 'Transaction ID', width: 100}],
      [{key: 'amount_sat', value: this.decimalPipe.transform(utxo.amount_sat), title: 'Amount (Sats)', width: 100}]
    ];
    if (utxo.label) {
      utxoDetails.splice(1, 0, [{key: 'label', value: utxo.label, title: 'Label', width: 100}]);
    }
    this.store.dispatch(new RTLActions.OpenConfirmation({ data: { 
      type: AlertTypeEnum.CONFIRM,
      alertTitle: 'Lease UTXO',
      informationMessage: 'The UTXO will be leased for 10 minutes.',
      message: utxoDetails,
      noBtnText: 'Cancel',
      yesBtnText: 'Lease UTXO'
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.dataService.leaseUTXO(utxo.outpoint.txid_bytes, utxo.outpoint.output_index);
      }
    });
  }

  onDownloadCSV() {
    if(this.listUTXOs.data && this.listUTXOs.data.length > 0) {
      this.commonService.downloadFile(this.listUTXOs.data, 'UTXOs');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
