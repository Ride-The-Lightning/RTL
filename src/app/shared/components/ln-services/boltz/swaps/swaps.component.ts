import { Component, OnChanges, OnDestroy, ViewChild, Input, AfterViewInit, SimpleChanges, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Swap, ReverseSwap } from '../../../../models/boltzModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, SwapTypeEnum, SwapStateEnum, SortOrderEnum, LND_DEFAULT_PAGE_SETTINGS, LND_PAGE_DEFS } from '../../../../services/consts-enums-functions';
import { LoggerService } from '../../../../services/logger.service';
import { CommonService } from '../../../../services/common.service';
import { BoltzService } from '../../../../services/boltz.service';

import { openAlert } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../../models/pageSettings';
import { lndPageSettings } from '../../../../../lnd/store/lnd.selector';
import { ApiCallStatusPayload } from '../../../../models/apiCallsPayload';
import { CamelCaseWithReplacePipe } from '../../../../pipes/app.pipe';

@Component({
  selector: 'rtl-boltz-swaps',
  templateUrl: './swaps.component.html',
  styleUrls: ['./swaps.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Swaps') }
  ]
})
export class BoltzSwapsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @Input() selectedSwapType: SwapTypeEnum = SwapTypeEnum.SWAP_OUT;
  @Input() swapsData: Swap[] | ReverseSwap[] = [];
  @Input() flgLoading: Array<Boolean | 'error'> = [true];
  @Input() emptyTableMessage = 'No swaps available.';
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs = LND_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'boltz';
  public tableSettingSwapOut: TableSetting = { tableId: 'swap_out', recordsPerPage: PAGE_SIZE, sortBy: 'status', sortOrder: SortOrderEnum.DESCENDING };
  public tableSettingSwapIn: TableSetting = { tableId: 'swap_in', recordsPerPage: PAGE_SIZE, sortBy: 'status', sortOrder: SortOrderEnum.DESCENDING };
  public swapStateEnum = SwapStateEnum;
  public faHistory = faHistory;
  public swapCaption = 'Swap Out';
  public displayedColumns: any[] = [];
  public listSwaps: any = new MatTableDataSource([]);
  public selFilter = '';
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private boltzService: BoltzService, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.tableSettingSwapOut = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSettingSwapOut.tableId) ||
          LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSettingSwapOut.tableId)!;
        this.tableSettingSwapIn = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSettingSwapIn.tableId) ||
        LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSettingSwapIn.tableId)!;
        this.setTableColumns();
        if (this.swapsData && this.swapsData.length > 0 && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadSwapsTable(this.swapsData);
        }
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
  }

  ngAfterViewInit() {
    if (this.swapsData && this.swapsData.length > 0) {
      this.loadSwapsTable(this.swapsData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedSwapType && !changes.selectedSwapType.firstChange) {
      this.setTableColumns();
    }
    this.swapCaption = (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ? 'Swap In' : 'Swap Out';
    this.loadSwapsTable(this.swapsData);
  }

  setTableColumns() {
    if (this.selectedSwapType === SwapTypeEnum.SWAP_IN) {
      if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
        this.displayedColumns = JSON.parse(JSON.stringify(this.tableSettingSwapIn.columnSelectionSM));
      } else {
        this.displayedColumns = JSON.parse(JSON.stringify(this.tableSettingSwapIn.columnSelection));
      }
      this.displayedColumns.push('actions');
      this.pageSize = this.tableSettingSwapIn.recordsPerPage ? +this.tableSettingSwapIn.recordsPerPage : PAGE_SIZE;
    } else {
      if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
        this.displayedColumns = JSON.parse(JSON.stringify(this.tableSettingSwapOut.columnSelectionSM));
      } else {
        this.displayedColumns = JSON.parse(JSON.stringify(this.tableSettingSwapOut.columnSelection));
      }
      this.displayedColumns.push('actions');
      this.pageSize = this.tableSettingSwapOut.recordsPerPage ? +this.tableSettingSwapOut.recordsPerPage : PAGE_SIZE;
    }
  }

  applyFilter() {
    if (this.listSwaps && this.selFilter !== '') {
      this.listSwaps.filter = this.selFilter.trim().toLowerCase();
    }
  }

  getLabel(column: string) {
    const tableId = (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ? this.tableSettingSwapIn.tableId : this.tableSettingSwapOut.tableId;
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.listSwaps.filterPredicate = (rowData: Swap, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = JSON.stringify(rowData).toLowerCase();
          break;

        case 'status':
          rowToFilter = rowData?.status ? this.swapStateEnum[rowData?.status] : '';
          break;

        default:
          rowToFilter = !rowData[this.selFilterBy] ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return this.selFilterBy === 'status' ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  onSwapClick(selSwap: Swap | ReverseSwap, event: any) {
    this.boltzService.swapInfo(selSwap.id || '').pipe(takeUntil(this.unSubs[1])).
      subscribe((fetchedSwap: any) => {
        fetchedSwap = (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ? fetchedSwap.swap : fetchedSwap.reverseSwap;
        const reorderedSwap = [
          [{ key: 'status', value: SwapStateEnum[fetchedSwap.status], title: 'Status', width: 50, type: DataTypeEnum.STRING },
            { key: 'id', value: fetchedSwap.id, title: 'ID', width: 50, type: DataTypeEnum.STRING }],
          [{ key: 'amount', value: fetchedSwap.onchainAmount ? fetchedSwap.onchainAmount : fetchedSwap.expectedAmount ? fetchedSwap.expectedAmount : 0,
            title: fetchedSwap.onchainAmount ? 'Onchain Amount (Sats)' : fetchedSwap.expectedAmount ? 'Expected Amount (Sats)' : 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER },
            { key: 'timeoutBlockHeight', value: fetchedSwap.timeoutBlockHeight, title: 'Timeout Block Height', width: 50, type: DataTypeEnum.NUMBER }],
          [{ key: 'address', value: fetchedSwap.claimAddress ? fetchedSwap.claimAddress : fetchedSwap.lockupAddress ? fetchedSwap.lockupAddress : '', title: fetchedSwap.claimAddress ? 'Claim Address' : fetchedSwap.lockupAddress ? 'Lockup Address' : 'Address', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'invoice', value: fetchedSwap.invoice, title: 'Invoice', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'privateKey', value: fetchedSwap.privateKey, title: 'Private Key', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'preimage', value: fetchedSwap.preimage, title: 'Preimage', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'redeemScript', value: fetchedSwap.redeemScript, title: 'Redeem Script', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'lockupTransactionId', value: fetchedSwap.lockupTransactionId, title: 'Lockup Transaction ID', width: 50, type: DataTypeEnum.STRING },
            { key: 'transactionId', value: fetchedSwap.claimTransactionId ? fetchedSwap.claimTransactionId : fetchedSwap.refundTransactionId ?
              fetchedSwap.refundTransactionId : '', title: fetchedSwap.claimTransactionId ? 'Claim Transaction ID' :
              fetchedSwap.refundTransactionId ? 'Refund Transaction ID' : 'Transaction ID', width: 50, type: DataTypeEnum.STRING }]
        ];
        this.store.dispatch(openAlert({
          payload: {
            data: {
              type: AlertTypeEnum.INFORMATION,
              alertTitle: this.swapCaption + ' Status',
              message: reorderedSwap,
              openedBy: 'SWAP'
            }
          }
        }));
      });
  }

  loadSwapsTable(swaps) {
    this.listSwaps = swaps ? new MatTableDataSource<Swap>([...swaps]) : new MatTableDataSource<Swap>([]);
    this.listSwaps.sort = this.sort;
    this.listSwaps.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    if (this.selectedSwapType === SwapTypeEnum.SWAP_IN) {
      this.listSwaps.sort?.sort({ id: this.tableSettingSwapIn.sortBy, start: this.tableSettingSwapIn.sortOrder, disableClear: true });
    } else {
      this.listSwaps.sort?.sort({ id: this.tableSettingSwapOut.sortBy, start: this.tableSettingSwapOut.sortOrder, disableClear: true });
    }
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.listSwaps.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.listSwaps);
  }

  onDownloadCSV() {
    if (this.listSwaps.data && this.listSwaps.data.length > 0) {
      this.commonService.downloadFile(this.listSwaps.data, (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ? 'Swap in' : 'Swap out');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
