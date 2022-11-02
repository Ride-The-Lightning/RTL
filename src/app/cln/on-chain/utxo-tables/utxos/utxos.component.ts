import { Component, ViewChild, Input, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UTXO } from '../../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, CLN_PAGE_DEFS } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLState } from '../../../../store/rtl.state';
import { openAlert } from '../../../../store/rtl.actions';
import { clnPageSettings, utxos } from '../../../store/cln.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../../shared/pipes/app.pipe';

@Component({
  selector: 'rtl-cln-on-chain-utxos',
  templateUrl: './utxos.component.html',
  styleUrls: ['./utxos.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('UTXOs') }
  ]
})
export class CLNOnChainUtxosComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @Input() numDustUTXOs = 0;
  @Input() isDustUTXO = false;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'on_chain';
  public tableSetting: TableSetting = { tableId: 'utxos', recordsPerPage: PAGE_SIZE, sortBy: 'status', sortOrder: SortOrderEnum.DESCENDING };
  public displayedColumns: any[] = [];
  public utxos: UTXO[];
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

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private router: Router, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
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
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(utxos).pipe(takeUntil(this.unSubs[1])).
      subscribe((utxosSeletor: { utxos: UTXO[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = utxosSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.utxos = (this.isDustUTXO) ? utxosSeletor.utxos?.filter((utxo) => +(utxo.value || 0) < 1000) : utxosSeletor.utxos ? utxosSeletor.utxos : [];
        if (this.utxos && this.utxos.length > 0 && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadUTXOsTable(this.utxos);
        }
        this.logger.info(utxosSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.utxos && this.utxos.length > 0 && this.sort && this.paginator && this.displayedColumns.length > 0) {
      this.loadUTXOsTable(this.utxos);
    }
  }

  applyFilter() {
    this.listUTXOs.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : 'all';
  }

  setFilterPredicate() {
    this.listUTXOs.filterPredicate = (utxo: UTXO, fltr: string) => JSON.stringify(utxo).toLowerCase().includes(fltr);
    // this.listUTXOs.filterPredicate = (rowData: UTXO, fltr: string) => {
    //   let rowToFilter = '';
    //   switch (this.selFilterBy) {
    //     case 'all':
    //       for (let i = 0; i < this.displayedColumns.length - 1; i++) {
    //         rowToFilter = rowToFilter + (
    //           (this.displayedColumns[i] === '') ?
    //             (rowData ? rowData..toLowerCase() : '') :
    //             (rowData[this.displayedColumns[i]] ? rowData[this.displayedColumns[i]].toLowerCase() : '')
    //         ) + ', ';
    //       }
    //       break;

    //     case '':
    //       rowToFilter = (rowData ? rowData..toLowerCase() : '');
    //       break;

    //     default:
    //       rowToFilter = (rowData[this.selFilterBy] ? rowData[this.selFilterBy].toLowerCase() : '');
    //       break;
    //   }
    //   return rowToFilter.includes(fltr);
    // };
  }

  onUTXOClick(selUtxo: UTXO, event: any) {
    const reorderedUTXO = [
      [{ key: 'txid', value: selUtxo.txid, title: 'Transaction ID', width: 100 }],
      [{ key: 'output', value: selUtxo.output, title: 'Output', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'value', value: selUtxo.value, title: 'Value (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
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

  loadUTXOsTable(utxos: any[]) {
    this.listUTXOs = new MatTableDataSource<UTXO>([...utxos]);
    this.listUTXOs.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.listUTXOs.sort = this.sort;
    this.listUTXOs.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
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
