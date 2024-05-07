import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { Peer, GetInfo, BlockchainBalance } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, LND_DEFAULT_PAGE_SETTINGS, LND_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { OpenChannelComponent } from '../channels/open-channel-modal/open-channel.component';
import { ConnectPeerComponent } from '../connect-peer/connect-peer.component';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { detachPeer } from '../../store/lnd.actions';
import { blockchainBalance, lndNodeInformation, lndPageSettings, peers } from '../../store/lnd.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';
import { MessageDataField } from '../../../shared/models/alertData';

@Component({
  selector: 'rtl-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class PeersComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs = LND_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'peers_channels';
  public tableSetting: TableSetting = { tableId: 'peers', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.DESCENDING };
  public availableBalance = 0;
  public faUsers = faUsers;
  public displayedColumns: any[] = [];
  public peersData: Peer[] = [];
  public peers: any = new MatTableDataSource([]);
  public information: GetInfo = {};
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[0])).subscribe((nodeInfo: GetInfo) => { this.information = nodeInfo; });
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[1])).
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
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(blockchainBalance).pipe(takeUntil(this.unSubs[2])).
      subscribe((bcBalanceSelector: { blockchainBalance: BlockchainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.availableBalance = bcBalanceSelector.blockchainBalance.total_balance || 0;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[3])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = peersSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.peersData = peersSelector.peers;
        if (this.peersData && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadPeersTable(this.peersData);
        }
        this.logger.info(peersSelector);
      });
  }

  ngAfterViewInit() {
    if (this.peersData.length > 0) {
      this.loadPeersTable(this.peersData);
    }
  }

  onPeerClick(selPeer: Peer, event: any) {
    const reorderedPeer: MessageDataField[][] = [
      [{ key: 'pub_key', value: selPeer.pub_key, title: 'Public Key', width: 100 }],
      [{ key: 'address', value: selPeer.address, title: 'Address', width: 100 }],
      [{ key: 'alias', value: selPeer.alias, title: 'Alias', width: 40 }, { key: 'inbound', value: selPeer.inbound ? 'True' : 'False', title: 'Inbound', width: 30 }, { key: 'ping_time', value: selPeer.ping_time, title: 'Ping Time (\u00B5s)', width: 30, type: DataTypeEnum.NUMBER }],
      [{ key: 'sat_sent', value: selPeer.sat_sent, title: 'Satoshis Sent', width: 50, type: DataTypeEnum.NUMBER }, { key: 'sat_recv', value: selPeer.sat_recv, title: 'Satoshis Received', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'bytes_sent', value: selPeer.bytes_sent, title: 'Bytes Sent', width: 50, type: DataTypeEnum.NUMBER }, { key: 'bytes_recv', value: selPeer.bytes_recv, title: 'Bytes Received', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Peer Information',
          goToFieldValue: selPeer.pub_key,
          goToName: 'Graph lookup',
          goToLink: '/lnd/graph/lookups',
          showQRName: 'Public Key',
          showQRField: selPeer.pub_key,
          message: reorderedPeer
        }
      }
    }));
  }

  onConnectPeer() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          message: { peer: null, information: this.information, balance: this.availableBalance },
          component: ConnectPeerComponent
        }
      }
    }));
  }

  onOpenChannel(peerToAddChannel: Peer) {
    const peerToAddChannelMessage = {
      peer: peerToAddChannel,
      information: this.information,
      balance: this.availableBalance
    };
    this.store.dispatch(openAlert({
      payload: {
        data: {
          alertTitle: 'Open Channel',
          message: peerToAddChannelMessage,
          component: OpenChannelComponent
        }
      }
    }));
  }

  onPeerDetach(peerToDetach: Peer) {
    const msg = 'Disconnect peer: ' + ((peerToDetach.alias) ? peerToDetach.alias : peerToDetach.pub_key);
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Disconnect Peer',
          titleMessage: msg,
          noBtnText: 'Cancel',
          yesBtnText: 'Disconnect'
        }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[4])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(detachPeer({ payload: { pubkey: peerToDetach.pub_key! } }));
        }
      });
  }

  applyFilter() {
    this.peers.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.peers.filterPredicate = (rowData: Peer, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = JSON.stringify(rowData).toLowerCase();
          break;

        case 'sync_type':
          rowToFilter = this.camelCaseWithReplace.transform((rowData.sync_type || ''), 'sync', '_').trim().toLowerCase();
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return this.selFilterBy === 'sync_type' ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadPeersTable(peers: Peer[]) {
    this.peers = peers ? new MatTableDataSource<Peer>([...peers]) : new MatTableDataSource([]);
    this.peers.sort = this.sort;
    this.peers.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.peers.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
  }

  onDownloadCSV() {
    if (this.peers.data && this.peers.data.length > 0) {
      this.commonService.downloadFile(this.peers.data, 'Peers');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
