import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faArrowRightFromBracket, faArrowRightToBracket, faPersonArrowDownToLine, faPersonArrowUpFromLine, faPersonCircleXmark } from '@fortawesome/free-solid-svg-icons';

import { Swap } from '../../../../models/peerswapModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, DataTypeEnum, AlertTypeEnum, PeerswapRoles, CLN_PAGE_DEFS, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS } from '../../../../services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { RTLState } from '../../../../../store/rtl.state';
import { openAlert } from '../../../../../store/rtl.actions';
import { fetchSwaps, getSwap } from '../../../../../cln/store/cln.actions';
import { clnPageSettings, swaps } from '../../../../../cln/store/cln.selector';
import { CamelCaseWithReplacePipe, SwapStatePipe } from '../../../../pipes/app.pipe';
import { ColumnDefinition, PageSettings, TableSetting } from 'src/app/shared/models/pageSettings';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

@Component({
  selector: 'rtl-peer-swaps-list',
  templateUrl: './swaps-list.component.html',
  styleUrls: ['./swaps-list.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Swaps') }
  ]
})
export class PeerswapsListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faPersonArrowDownToLine = faPersonArrowDownToLine;
  public faPersonArrowUpFromLine = faPersonArrowUpFromLine;
  public faPersonCircleXmark = faPersonCircleXmark;
  public faArrowRightFromBracket = faArrowRightFromBracket;
  public faArrowRightToBracket = faArrowRightToBracket;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'peerswap';
  public tableSetting: TableSetting = { tableId: 'psout', recordsPerPage: PAGE_SIZE, sortBy: 'created_at', sortOrder: SortOrderEnum.DESCENDING };
  public psPageSettings: PageSettings[] = CLN_DEFAULT_PAGE_SETTINGS;
  public displayedColumns: any[] = [];
  public allSwapsData: any = null;
  public swaps: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public swapLists = ['psout', 'psin', 'pscanceled'];
  public selSwapList = this.swapLists[0];
  public filterColumns = [];
  public peerswapRoles = PeerswapRoles;
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private router: Router, private swapStatePipe: SwapStatePipe, private titleCasePipe: TitleCasePipe, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.selSwapList = this.router.url.substring(this.router.url.lastIndexOf('/') + 1);
    this.tableSetting.tableId = this.selSwapList;
    this.updateTableDef();
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd) => {
          this.selSwapList = value.url.substring(value.url.lastIndexOf('/') + 1);
          this.tableSetting.tableId = this.selSwapList;
          this.updateTableDef();
          if (this.allSwapsData && this.sort && this.paginator) {
            this.loadSwapsTable();
          }
        }
      });
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[1])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.psPageSettings = settings.pageSettings || CLN_DEFAULT_PAGE_SETTINGS;
      });
    this.store.select(swaps).pipe(takeUntil(this.unSubs[2])).
      subscribe((swapsSeletor: { swapOuts: Swap[], swapIns: Swap[], swapsCanceled: Swap[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = swapsSeletor.apiCallStatus;
        if (this.apiCallStatus?.status === APICallStatusEnum.UN_INITIATED) {
          this.store.dispatch(fetchSwaps());
        }
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (this.apiCallStatus?.status === APICallStatusEnum.COMPLETED) {
          this.allSwapsData = { swapOuts: swapsSeletor.swapOuts, swapIns: swapsSeletor.swapIns, swapsCanceled: swapsSeletor.swapsCanceled };
          if (this.allSwapsData && this.sort && this.paginator) {
            this.loadSwapsTable();
          }
        }
        this.logger.info(swapsSeletor);
      });
  }

  ngAfterViewInit(): void {
    if (this.allSwapsData) {
      this.loadSwapsTable();
    }
  }

  onSwapClick(selSwap: Swap) {
    const reorderedSwap = [
      [{ key: 'id', value: selSwap.id, title: 'Swap Id', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'state', value: this.swapStatePipe.transform(selSwap.state || ''), title: 'State', width: 50, type: DataTypeEnum.STRING },
      { key: 'role', value: this.titleCasePipe.transform(selSwap.role), title: 'Role', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'created_at', value: this.datePipe.transform(new Date((+selSwap.created_at || 0) * 1000), 'dd/MMM/YYYY HH:mm'), title: 'Created At', width: 50, type: DataTypeEnum.STRING },
        { key: 'amount', value: selSwap.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'alias', value: (selSwap.alias === selSwap.peer_node_id ? selSwap.alias.substring(0, 17) + '...' : selSwap.alias), title: 'Alias', width: 50, type: DataTypeEnum.STRING },
        { key: 'short_channel_id', value: selSwap.channel_id, title: 'Short Channel ID', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'peer_node_id', value: selSwap.peer_node_id, title: 'Peer Node Id', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'initiator_node_id', value: selSwap.initiator_node_id, title: 'Initiator Node Id', width: 100, type: DataTypeEnum.STRING }]
    ];
    if (selSwap.opening_tx_id) {
      reorderedSwap.push([{ key: 'opening_tx_id', value: selSwap.opening_tx_id, title: 'Opening Transaction Id', width: 100, type: DataTypeEnum.STRING }]);
    }
    if (selSwap.claim_tx_id) {
      reorderedSwap.push([{ key: 'claim_tx_id', value: selSwap.claim_tx_id, title: 'Claim Transaction Id', width: 100, type: DataTypeEnum.STRING }]);
    }
    if (selSwap.cancel_message) {
      reorderedSwap.push([{ key: 'cancel_message', value: selSwap.cancel_message, title: 'Cancel Message', width: 100, type: DataTypeEnum.STRING }]);
    }
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: this.selSwapList === this.swapLists[0] ? 'Swapout Information' : this.selSwapList === this.swapLists[1] ? 'Swapin Information' : 'Swap Canceled Information',
          message: reorderedSwap
        }
      }
    }));
  }

  loadSwapsTable() {
    const selectedSwapData = (this.selSwapList === this.swapLists[0]) ? this.allSwapsData?.swapOuts : (this.selSwapList === this.swapLists[1]) ? this.allSwapsData?.swapIns : (this.selSwapList === this.swapLists[2]) ? this.allSwapsData?.swapsCanceled : [];
    this.swaps = new MatTableDataSource<Swap>([...selectedSwapData]);
    this.swaps.sort = this.sort;
    this.swaps.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.swaps.filterPredicate = (swap: Swap, fltr: string) => {
      const newSwap =
      (swap.id ? swap.id : '') +
      (swap.alias ? swap.alias.toLowerCase() : '') +
      (swap.role ? swap.role : '') +
      (swap.channel_id ? swap.channel_id : '') +
      (swap.amount ? swap.amount : '') +
      (swap.state ? swap.state : '') +
      ((swap.created_at) ? this.datePipe.transform(new Date(+swap.created_at * 1000), 'dd/MMM/YYYY HH:mm')?.toLowerCase() : '') +
      (swap.cancel_message ? swap.cancel_message.toLowerCase : '');
      return newSwap?.includes(fltr) || false;
    };
    this.swaps.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.swaps);
  }

  onSwapRefresh(selSwap: Swap) {
    this.store.dispatch(getSwap({ payload: selSwap.id || '' }));
  }

  onDownloadCSV() {
    if (this.swaps && this.swaps.data && this.swaps.data.length && this.swaps.data.length > 0) {
      this.commonService.downloadFile(this.swaps.data, 'Peerswap-' + this.selSwapList);
    }
  }

  applyFilter() {
    this.swaps.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  updateTableDef() {
    this.tableSetting = JSON.parse(JSON.stringify(this.psPageSettings.find((page) => page.pageId === this.PAGE_ID).tables.find((table) => table.tableId === this.selSwapList)));
    if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
      this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
    } else {
      this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
    }
    this.displayedColumns.unshift('role');
    this.displayedColumns.push('actions');
    this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
    this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
    this.filterColumns = ['all', ...this.displayedColumns.slice(0, -1)];
    this.logger.info(this.displayedColumns);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
