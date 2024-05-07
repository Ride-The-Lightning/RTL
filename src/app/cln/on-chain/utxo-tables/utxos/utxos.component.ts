import { Component, ViewChild, Input, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { Balance, LocalRemoteBalance, UTXO } from '../../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, CLN_PAGE_DEFS } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLState } from '../../../../store/rtl.state';
import { openAlert } from '../../../../store/rtl.actions';
import { clnPageSettings, utxoBalances } from '../../../store/cln.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../../shared/pipes/app.pipe';
import { MessageDataField } from '../../../../shared/models/alertData';

@Component({
  selector: 'rtl-cln-on-chain-utxos',
  templateUrl: './utxos.component.html',
  styleUrls: ['./utxos.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('UTXOs') }
  ]
})
export class CLNOnChainUtxosComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @Input() numDustUTXOs = 0;
  @Input() isDustUTXO = false;
  @Input() dustAmount = 1000;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'on_chain';
  public tableSetting: TableSetting = { tableId: 'utxos', recordsPerPage: PAGE_SIZE, sortBy: 'status', sortOrder: SortOrderEnum.DESCENDING };
  public displayedColumns: any[] = [];
  public utxos: UTXO[];
  public dustUtxos: UTXO[];
  public listUTXOs: any = new MatTableDataSource([]);
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.tableSetting.tableId = this.isDustUTXO ? 'dust_utxos' : 'utxos';
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || CLN_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.unshift('status');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(utxoBalances).pipe(takeUntil(this.unSubs[1])).
      subscribe((utxoBalancesSeletor: { utxos: UTXO[], balance: Balance, localRemoteBalance: LocalRemoteBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = utxoBalancesSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (utxoBalancesSeletor.utxos && utxoBalancesSeletor.utxos.length > 0) {
          this.dustUtxos = utxoBalancesSeletor.utxos?.filter((utxo) => +(utxo.amount_msat || 0) / 1000 < this.dustAmount);
          this.utxos = utxoBalancesSeletor.utxos;
          if (this.isDustUTXO) {
            if (this.dustUtxos && this.sort && this.paginator && this.displayedColumns.length > 0) {
              this.loadUTXOsTable(this.dustUtxos);
            }
          } else {
            this.displayedColumns.unshift('is_dust');
            if (this.utxos && this.sort && this.paginator && this.displayedColumns.length > 0) {
              this.loadUTXOsTable(this.utxos);
            }
          }
        }
        this.logger.info(utxoBalancesSeletor);
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.isDustUTXO) {
        if (this.dustUtxos && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadUTXOsTable(this.dustUtxos);
        }
      } else {
        if (this.utxos && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadUTXOsTable(this.utxos);
        }
      }
    }, 0);
  }

  onUTXOClick(selUtxo: UTXO, event: any) {
    const reorderedUTXO: MessageDataField[][] = [
      [{ key: 'txid', value: selUtxo.txid, title: 'Transaction ID', width: 100, type: DataTypeEnum.STRING, explorerLink: 'tx' }],
      [{ key: 'output', value: selUtxo.output, title: 'Output', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'amount_msat', value: (selUtxo.amount_msat || 0) / 1000, title: 'Value (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'status', value: this.commonService.titleCase(selUtxo.status || ''), title: 'Status', width: 50, type: DataTypeEnum.STRING },
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

  applyFilter() {
    this.listUTXOs.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform((returnColumn.column || ''), '_') : column === 'is_dust' ? 'Dust' : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.listUTXOs.filterPredicate = (rowData: UTXO, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = JSON.stringify(rowData).toLowerCase();
          break;

        case 'is_dust':
          rowToFilter = (rowData?.amount_msat || 0) / 1000 < this.dustAmount ? 'dust' : 'nondust';
          break;

        case 'status':
          rowToFilter = rowData?.status?.toLowerCase() || '';
          break;

        case 'value':
          rowToFilter = ((rowData?.amount_msat || 0) / 1000).toString();
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return (this.selFilterBy === 'is_dust' || this.selFilterBy === 'status') ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadUTXOsTable(utxos: any[]) {
    this.listUTXOs = new MatTableDataSource<UTXO>([...utxos]);
    this.listUTXOs.sort = this.sort;
    this.listUTXOs.sortingDataAccessor = (data: UTXO, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'is_dust': return ((data.amount_msat || 0) / 1000) < this.dustAmount;
        case 'value': return ((data.amount_msat || 0) / 1000);
        default: return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.listUTXOs.paginator = this.paginator;
    this.setFilterPredicate();
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
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
