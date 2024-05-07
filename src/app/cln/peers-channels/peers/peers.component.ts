import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { Peer, GetInfo, Balance, UTXO, LocalRemoteBalance } from '../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, ScreenSizeEnum, APICallStatusEnum, CLNActions, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, CLN_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { CLNConnectPeerComponent } from '../connect-peer/connect-peer.component';
import { CLNOpenChannelComponent } from '../channels/open-channel-modal/open-channel.component';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { detachPeer } from '../../store/cln.actions';
import { clnPageSettings, nodeInfoAndBalance, peers, utxoBalances } from '../../store/cln.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';
import { MessageDataField } from '../../../shared/models/alertData';

@Component({
  selector: 'rtl-cln-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class CLNPeersComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faUsers = faUsers;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'peers_channels';
  public tableSetting: TableSetting = { tableId: 'peers', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.DESCENDING };
  public newlyAddedPeer = '';
  public displayedColumns: any[] = [];
  public peerAddress: string | null = '';
  public peersData: Peer[] = [];
  public peers: any = new MatTableDataSource([]);
  public utxos: UTXO[] = [];
  public information: GetInfo = {};
  public availableBalance = 0;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private actions: Actions, private commonService: CommonService, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(nodeInfoAndBalance).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoBalSelector: { information: GetInfo, balance: Balance }) => {
        this.information = infoBalSelector.information;
        this.availableBalance = infoBalSelector.balance.totalBalance || 0;
      });
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[1])).
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
        this.displayedColumns.unshift('connected');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[2])).
      subscribe((peersSeletor: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = peersSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.peersData = peersSeletor.peers || [];
        if (this.peersData && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadPeersTable(this.peersData);
        }
        this.logger.info(peersSeletor);
      });
    this.store.select(utxoBalances).pipe(takeUntil(this.unSubs[3])).
      subscribe((utxoBalancesSeletor: { utxos: UTXO[], balance: Balance, localRemoteBalance: LocalRemoteBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.utxos = this.commonService.sortAscByKey(utxoBalancesSeletor.utxos?.filter((utxo) => utxo.status === 'confirmed'), 'value');
      });
    this.actions.
      pipe(
        takeUntil(this.unSubs[4]),
        filter((action) => action.type === CLNActions.SET_PEERS_CLN)
      ).subscribe((setPeers: any) => {
        this.peerAddress = null;
      });
  }

  ngAfterViewInit() {
    if (this.peersData.length > 0) {
      this.loadPeersTable(this.peersData);
    }
  }

  onPeerClick(selPeer: Peer, event: any) {
    const reorderedPeer: MessageDataField[][] = [
      [{ key: 'id', value: selPeer.id, title: 'Public Key', width: 100 }],
      [{ key: 'netaddr', value: selPeer.netaddr, title: 'Address', width: 100 }],
      [{ key: 'alias', value: selPeer.alias, title: 'Alias', width: 50 },
      { key: 'connected', value: selPeer.connected ? 'True' : 'False', title: 'Connected', width: 50 }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Peer Information',
          goToFieldValue: selPeer.id,
          goToName: 'Graph lookup',
          goToLink: '/cln/graph/lookups',
          showQRName: 'Public Key',
          showQRField: selPeer.id,
          message: reorderedPeer
        }
      }
    }));
  }

  onConnectPeer(selPeer: Peer) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          message: { peer: (selPeer.id ? selPeer : null), information: this.information, balance: this.availableBalance },
          component: CLNConnectPeerComponent
        }
      }
    }));
  }

  onOpenChannel(peerToAddChannel: Peer) {
    const peerToAddChannelMessage = {
      peer: peerToAddChannel,
      information: this.information,
      balance: this.availableBalance,
      utxos: this.utxos
    };
    this.store.dispatch(openAlert({
      payload: {
        data: {
          alertTitle: 'Open Channel',
          message: peerToAddChannelMessage,
          newlyAdded: false,
          component: CLNOpenChannelComponent
        }
      }
    }));
  }

  onPeerDetach(peerToDetach: Peer) {
    const msg = 'Disconnect peer: ' + ((peerToDetach.alias) ? peerToDetach.alias : peerToDetach.id);
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
      pipe(takeUntil(this.unSubs[5])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(detachPeer({ payload: { id: peerToDetach.id!, force: false } }));
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

        case 'connected':
          rowToFilter = rowData?.connected ? 'connected' : 'disconnected';
          break;

        case 'netaddr':
          rowToFilter = rowData.netaddr ? rowData.netaddr.reduce((acc, curr) => acc + curr, ' ') : '';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return this.selFilterBy === 'connected' ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadPeersTable(peersArr: Peer[]) {
    this.peers = new MatTableDataSource<Peer>([...peersArr]);
    this.peers.sort = this.sort;
    this.peers.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'netaddr':
          if (data.netaddr && data.netaddr[0]) {
            const firstSplit = data.netaddr[0].toString().split('.');
            return (firstSplit[0]) ? +firstSplit[0] : data.netaddr[0];
          } else {
            return '';
          }

        default: return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
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
