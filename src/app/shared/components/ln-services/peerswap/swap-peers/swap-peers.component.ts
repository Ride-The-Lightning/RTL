import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faPeopleGroup } from '@fortawesome/free-solid-svg-icons';

import { SwapPeerChannelsFlattened } from '../../../../models/peerswapModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, DataTypeEnum, AlertTypeEnum, CLN_PAGE_DEFS, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS } from '../../../../services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../models/apiCallsPayload';
import { LoggerService } from '../../../../services/logger.service';
import { CommonService } from '../../../../services/common.service';

import { RTLState } from '../../../../../store/rtl.state';
import { openAlert } from '../../../../../store/rtl.actions';
import { fetchSwapPeers } from '../../../../../cln/store/cln.actions';
import { clnPageSettings, swapPeers } from '../../../../../cln/store/cln.selector';
import { PSSwapOutModalComponent } from '../swap-out-modal/swap-out-modal.component';
import { PSSwapInModalComponent } from '../swap-in-modal/swap-in-modal.component';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { ColumnDefinition, PageSettings, TableSetting } from 'src/app/shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from 'src/app/shared/pipes/app.pipe';

@Component({
  selector: 'rtl-peerswap-peers',
  templateUrl: './swap-peers.component.html',
  styleUrls: ['./swap-peers.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class PSPeersComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faPeopleGroup = faPeopleGroup;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'peerswap';
  public tableSetting: TableSetting = { tableId: 'peers', recordsPerPage: PAGE_SIZE, sortBy: 'swaps_allowed', sortOrder: SortOrderEnum.DESCENDING };
  public displayedColumns: any[] = [];
  public totalSwapPeers = 0;
  public peersData: SwapPeerChannelsFlattened[] = [];
  public swapPeers: any;
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
    this.store.dispatch(fetchSwapPeers());
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
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });

    this.store.select(swapPeers).pipe(takeUntil(this.unSubs[1])).
      subscribe((spSeletor: { totalSwapPeers: number, swapPeers: SwapPeerChannelsFlattened[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = spSeletor.apiCallStatus;
        if (this.apiCallStatus?.status === APICallStatusEnum.UN_INITIATED) {
          this.store.dispatch(fetchSwapPeers());
        }
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.totalSwapPeers = spSeletor.totalSwapPeers;
        this.peersData = spSeletor.swapPeers || [];
        if (this.peersData.length > 0 && this.sort && this.paginator) {
          this.loadSwapPeersTable(this.peersData);
        }
        this.logger.info(spSeletor);
      });
  }

  onSwapPeerClick(selSPeer: SwapPeerChannelsFlattened) {
    const reorderedSPeer = [
      [{ key: 'nodeid', value: selSPeer.nodeid, title: 'Node Id', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'alias', value: (selSPeer.alias === selSPeer.nodeid ? selSPeer.alias.substring(0, 17) + '...' : selSPeer.alias), title: 'Alias', width: 50, type: DataTypeEnum.STRING },
      { key: 'short_channel_id', value: selSPeer.short_channel_id, title: 'Short Channel ID', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'local_balance', value: selSPeer.local_balance, title: 'Local Balance (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'remote_balance', value: selSPeer.remote_balance, title: 'Remote Balance (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'total_fee_paid', value: selSPeer.total_fee_paid || 0, title: 'Total Fee Paid (Sats)', width: 40, type: DataTypeEnum.NUMBER },
      { key: 'swaps_allowed', value: selSPeer.swaps_allowed ? 'Yes' : 'No', title: 'Swaps Allowed', width: 30, type: DataTypeEnum.STRING },
      { key: 'total_channels', value: selSPeer.channels?.length, title: 'Channels With Peer', width: 30, type: DataTypeEnum.NUMBER }],
      [{ key: 'sent_total_swaps_out', value: selSPeer.sent?.total_swaps_out, title: 'Swap Out Sent', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'sent_total_swaps_in', value: selSPeer.sent?.total_swaps_in, title: 'Swap In Sent', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'sent_total_sats_swapped_out', value: selSPeer.sent?.total_sats_swapped_out, title: 'Swapped Out Sent (Sats)', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'sent_total_sats_swapped_in', value: selSPeer.sent?.total_sats_swapped_in, title: 'Swapped In Sent (Sats)', width: 25, type: DataTypeEnum.NUMBER }],
      [{ key: 'received_total_swaps_out', value: selSPeer.received?.total_swaps_out, title: 'Swap Out Received', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'received_total_swaps_in', value: selSPeer.received?.total_swaps_in, title: 'Swap In Received', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'received_total_sats_swapped_out', value: selSPeer.received?.total_sats_swapped_out, title: 'Swapped Out Received (Sats)', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'received_total_sats_swapped_in', value: selSPeer.received?.total_sats_swapped_in, title: 'Swapped In Received (Sats)', width: 25, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Swap Peer Information',
          message: reorderedSPeer
        }
      }
    }));
  }

  onSwapOut(sPeer: SwapPeerChannelsFlattened) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          swapPeer: sPeer,
          component: PSSwapOutModalComponent
        }
      }
    }));
  }

  onSwapIn(sPeer: SwapPeerChannelsFlattened) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          swapPeer: sPeer,
          component: PSSwapInModalComponent
        }
      }
    }));
  }

  setFilterPredicate() {
    this.swapPeers.filterPredicate = (rowData: SwapPeerChannelsFlattened, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = (rowData.nodeid ? rowData.nodeid : '') +
          (rowData.alias ? rowData.alias.toLowerCase() : '') +
          (rowData.swaps_allowed ? 'yes' : 'no') +
          (rowData.short_channel_id ? rowData.short_channel_id : '') +
          (rowData.local_balance ? rowData.local_balance : '') +
          (rowData.remote_balance ? rowData.remote_balance : '');
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return this.selFilterBy === 'connected' ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadSwapPeersTable(swapPeers: SwapPeerChannelsFlattened[]) {
    this.swapPeers = new MatTableDataSource<SwapPeerChannelsFlattened>([...swapPeers]);
    this.swapPeers.sort = this.sort;
    this.swapPeers.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.swapPeers.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.swapPeers);
  }

  onDownloadCSV() {
    if (this.swapPeers && this.swapPeers.data && this.swapPeers.data.length > 0) {
      this.commonService.downloadFile(this.swapPeers.data, 'Peerswap Peers');
    }
  }

  applyFilter() {
    this.swapPeers.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform((returnColumn.column || ''), '_') : this.commonService.titleCase(column);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
