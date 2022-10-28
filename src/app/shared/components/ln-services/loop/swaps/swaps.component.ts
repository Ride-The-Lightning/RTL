import { Component, OnChanges, OnDestroy, ViewChild, Input, AfterViewInit, SimpleChanges, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LoopSwapStatus } from '../../../../models/loopModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, LoopTypeEnum, LoopStateEnum, SortOrderEnum, LND_DEFAULT_PAGE_SETTINGS } from '../../../../services/consts-enums-functions';
import { LoggerService } from '../../../../services/logger.service';
import { CommonService } from '../../../../services/common.service';
import { LoopService } from '../../../../services/loop.service';

import { RTLState } from '../../../../../store/rtl.state';
import { openAlert } from '../../../../../store/rtl.actions';
import { PageSettings, TableSetting } from '../../../../models/pageSettings';
import { lndPageSettings } from '../../../../../lnd/store/lnd.selector';
import { ApiCallStatusPayload } from '../../../../models/apiCallsPayload';

@Component({
  selector: 'rtl-swaps',
  templateUrl: './swaps.component.html',
  styleUrls: ['./swaps.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Swaps') }
  ]
})
export class SwapsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @Input() selectedSwapType: LoopTypeEnum = LoopTypeEnum.LOOP_OUT;
  @Input() swapsData: LoopSwapStatus[] = [];
  @Input() flgLoading: Array<Boolean | 'error'> = [true];
  @Input() emptyTableMessage = 'No swaps available.';
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public PAGE_ID = 'loop';
  public tableSetting: TableSetting = { tableId: 'loop', recordsPerPage: PAGE_SIZE, sortBy: 'initiation_time', sortOrder: SortOrderEnum.DESCENDING };
  public LoopStateEnum = LoopStateEnum;
  public faHistory = faHistory;
  public swapCaption = 'Loop Out';
  public displayedColumns: any[] = [];
  public listSwaps: any = new MatTableDataSource([]);
  public selFilter = '';
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private loopService: LoopService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        if (this.swapsData && this.swapsData.length > 0 && this.sort && this.paginator && this.displayedColumns.length > 0)  {
          this.loadSwapsTable(this.swapsData);
        }
        this.logger.info(this.displayedColumns);
      });
  }

  ngAfterViewInit() {
    if (this.swapsData && this.swapsData.length > 0) {
      this.loadSwapsTable(this.swapsData);
    }
  }

  ngOnChanges(change: SimpleChanges) {
    this.swapCaption = (this.selectedSwapType === LoopTypeEnum.LOOP_IN) ? 'Loop In' : 'Loop Out';
    this.loadSwapsTable(this.swapsData);
  }

  applyFilter() {
    this.listSwaps.filter = this.selFilter.trim().toLowerCase();
  }

  onSwapClick(selSwap: LoopSwapStatus, event: any) {
    this.loopService.getSwap(selSwap.id_bytes?.replace(/\//g, '_')?.replace(/\+/g, '-') || '').pipe(takeUntil(this.unSubs[1])).
      subscribe((fetchedSwap: LoopSwapStatus) => {
        const reorderedSwap = [
          [{ key: 'state', value: LoopStateEnum[fetchedSwap.state || ''], title: 'Status', width: 50, type: DataTypeEnum.STRING },
          { key: 'amt', value: fetchedSwap.amt, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
          [{ key: 'initiation_time', value: (fetchedSwap.initiation_time || 0) / 1000000000, title: 'Initiation Time', width: 50, type: DataTypeEnum.DATE_TIME },
          { key: 'last_update_time', value: (fetchedSwap.last_update_time || 0) / 1000000000, title: 'Last Update Time', width: 50, type: DataTypeEnum.DATE_TIME }],
          [{ key: 'cost_server', value: fetchedSwap.cost_server, title: 'Server Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER },
          { key: 'cost_offchain', value: fetchedSwap.cost_offchain, title: 'Offchain Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER },
          { key: 'cost_onchain', value: fetchedSwap.cost_onchain, title: 'Onchain Cost (Sats)', width: 34, type: DataTypeEnum.NUMBER }],
          [{ key: 'id_bytes', value: fetchedSwap.id_bytes, title: 'ID', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'htlc_address', value: fetchedSwap.htlc_address, title: 'HTLC Address', width: 100, type: DataTypeEnum.STRING }]
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
    this.listSwaps = new MatTableDataSource<LoopSwapStatus>([...swaps]);
    this.listSwaps.sort = this.sort;
    this.listSwaps.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.listSwaps.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.listSwaps.filterPredicate = (swap: LoopSwapStatus, fltr: string) => JSON.stringify(swap).toLowerCase().includes(fltr);
    this.listSwaps.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.listSwaps);
  }

  onDownloadCSV() {
    if (this.listSwaps.data && this.listSwaps.data.length > 0) {
      this.commonService.downloadFile(this.listSwaps.data, (this.selectedSwapType === LoopTypeEnum.LOOP_IN) ? 'Loop in' : 'Loop out');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
