import { Component, ViewChild, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UTXO } from '../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, WALLET_ADDRESS_TYPE, APICallStatusEnum, SortOrderEnum, LND_DEFAULT_PAGE_SETTINGS, LND_PAGE_DEFS } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { DataService } from '../../../../shared/services/data.service';
import { OnChainLabelModalComponent } from '../../on-chain-label-modal/on-chain-label-modal.component';

import { RTLEffects } from '../../../../store/rtl.effects';
import { RTLState } from '../../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../../store/rtl.actions';
import { lndPageSettings, utxos } from '../../../store/lnd.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../../shared/pipes/app.pipe';

@Component({
  selector: 'rtl-on-chain-utxos',
  templateUrl: './utxos.component.html',
  styleUrls: ['./utxos.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('UTXOs') }
  ]
})
export class OnChainUTXOsComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @Input() isDustUTXO = false;
  public faMoneyBillWave = faMoneyBillWave;
  public DUST_AMOUNT = 50000;
  public nodePageDefs = LND_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'on_chain';
  public tableSetting: TableSetting = { tableId: 'utxos', recordsPerPage: PAGE_SIZE, sortBy: 'tx_id', sortOrder: SortOrderEnum.DESCENDING };
  public utxos: UTXO[];
  public dustUtxos: UTXO[];
  public addressType = WALLET_ADDRESS_TYPE;
  public displayedColumns: any[] = [];
  public listUTXOs: any = new MatTableDataSource([]);
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private dataService: DataService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private decimalPipe: DecimalPipe, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.tableSetting.tableId = this.isDustUTXO ? 'dust_utxos' : 'utxos';
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(utxos).pipe(takeUntil(this.unSubs[1])).
      subscribe((utxosSelector: { utxos: UTXO[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = utxosSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (utxosSelector.utxos && utxosSelector.utxos.length > 0) {
          this.dustUtxos = utxosSelector.utxos?.filter((utxo) => +(utxo.amount_sat || 0) < this.DUST_AMOUNT);
          this.utxos = utxosSelector.utxos;
          if (this.utxos.length > 0 && this.dustUtxos.length > 0 && !this.isDustUTXO) {
            this.displayedColumns.unshift('is_dust');
          }
          this.loadUTXOsTable((this.isDustUTXO) ? this.dustUtxos : this.utxos);
        }
        this.logger.info(utxosSelector);
      });
  }

  ngOnChanges() {
    if (!this.isDustUTXO && this.utxos && this.utxos.length > 0) {
      this.loadUTXOsTable(this.utxos);
    }
    if (this.isDustUTXO && this.dustUtxos && this.dustUtxos.length > 0) {
      this.loadUTXOsTable(this.dustUtxos);
    }
  }

  applyFilter() {
    this.listUTXOs.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : column === 'is_dust' ? 'Dust' : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.listUTXOs.filterPredicate = (rowData: UTXO, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          for (let i = 0; i < this.displayedColumns.length - 1; i++) {
            rowToFilter = rowToFilter + (
              (this.displayedColumns[i] === 'tx_id') ?
                (rowData.outpoint && rowData.outpoint.txid_str ? rowData.outpoint.txid_str.toLowerCase() : '') :
                (this.displayedColumns[i] === 'output') ?
                  (rowData.outpoint && rowData.outpoint.output_index ? rowData.outpoint.output_index.toString() : '0') :
                  (this.displayedColumns[i] === 'address_type') ?
                    (rowData.address_type && this.addressType[rowData.address_type] && this.addressType[rowData.address_type].name ? this.addressType[rowData.address_type].name.toLowerCase() : '') :
                    (rowData[this.displayedColumns[i]] ? rowData[this.displayedColumns[i]].toLowerCase() : '')
            ) + ', ';
          }
          break;

        case 'is_dust':
          rowToFilter = (rowData?.amount_sat || 0) < this.DUST_AMOUNT ? 'dust' : 'non-dust';
          break;

        case 'tx_id':
          rowToFilter = (rowData.outpoint && rowData.outpoint.txid_str ? rowData.outpoint.txid_str.toLowerCase() : '');
          break;

        case 'output':
          rowToFilter = (rowData.outpoint && rowData.outpoint.output_index ? rowData.outpoint.output_index.toString() : '0');
          break;

        case 'address_type':
          rowToFilter = (rowData.address_type && this.addressType[rowData.address_type] && this.addressType[rowData.address_type].name ? this.addressType[rowData.address_type].name.toLowerCase() : '');
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return this.selFilterBy === 'is_dust' ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  onUTXOClick(selUTXO: UTXO) {
    const reorderedUTXOs = [
      [{ key: 'txid', value: selUTXO.outpoint?.txid_str, title: 'Transaction ID', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'label', value: selUTXO.label, title: 'Label', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'output_index', value: selUTXO.outpoint?.output_index, title: 'Output Index', width: 34, type: DataTypeEnum.NUMBER },
      { key: 'amount_sat', value: selUTXO.amount_sat, title: 'Amount (Sats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'confirmations', value: selUTXO.confirmations, title: 'Confirmations', width: 33, type: DataTypeEnum.NUMBER }],
      [{ key: 'address_type', value: (selUTXO.address_type ? this.addressType[selUTXO.address_type].name : ''), title: 'Address Type', width: 34 },
      { key: 'address', value: selUTXO.address, title: 'Address', width: 66 }],
      [{ key: 'pk_script', value: selUTXO.pk_script, title: 'PK Script', width: 100, type: DataTypeEnum.STRING }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'UTXO Information',
          message: reorderedUTXOs
        }
      }
    }));
  }

  loadUTXOsTable(UTXOs: UTXO[]) {
    this.listUTXOs = new MatTableDataSource<UTXO>([...UTXOs]);
    this.listUTXOs.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'is_dust': return +(data.amount_sat || 0) < this.DUST_AMOUNT;
        case 'tx_id': return data.outpoint.txid_str.toLocaleLowerCase();
        case 'output': return +data.outpoint.output_index;
        default: return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.listUTXOs.sort = this.sort;
    this.listUTXOs.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.listUTXOs.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.listUTXOs);
  }

  onLabelUTXO(utxo: UTXO) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          utxo: utxo,
          component: OnChainLabelModalComponent
        }
      }
    }));
  }

  onLeaseUTXO(utxo: UTXO) {
    const utxoDetails = [
      [{ key: 'txid_str', value: utxo.outpoint?.txid_str, title: 'Transaction ID', width: 100 }],
      [{ key: 'amount_sat', value: this.decimalPipe.transform(utxo.amount_sat), title: 'Amount (Sats)', width: 100 }]
    ];
    if (utxo.label) {
      utxoDetails.splice(1, 0, [{ key: 'label', value: utxo.label, title: 'Label', width: 100 }]);
    }
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Lease UTXO',
          informationMessage: 'The UTXO will be leased for 10 minutes.',
          message: utxoDetails,
          noBtnText: 'Cancel',
          yesBtnText: 'Lease UTXO'
        }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[2])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.dataService.leaseUTXO((utxo.outpoint?.txid_bytes || ''), (utxo.outpoint?.output_index || 0));
        }
      });
  }

  onDownloadCSV() {
    if (this.listUTXOs.data && this.listUTXOs.data.length > 0) {
      this.commonService.downloadFile(this.listUTXOs.data, 'UTXOs');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
