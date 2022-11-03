import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Peer, GetInfo, OnChainBalance } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, ScreenSizeEnum, APICallStatusEnum, ECLActions, SortOrderEnum, ECL_DEFAULT_PAGE_SETTINGS, ECL_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { ECLOpenChannelComponent } from '../channels/open-channel-modal/open-channel.component';
import { ECLConnectPeerComponent } from '../connect-peer/connect-peer.component';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { disconnectPeer } from '../../store/ecl.actions';
import { eclNodeInformation, eclPageSettings, onchainBalance, peers } from '../../store/ecl.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';

@Component({
  selector: 'rtl-ecl-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class ECLPeersComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs = ECL_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'peers_channels';
  public tableSetting: TableSetting = { tableId: 'peers', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.DESCENDING };
  public faUsers = faUsers;
  public newlyAddedPeer = '';
  public displayedColumns: any[] = [];
  public peerAddress: string | null = '';
  public peersData: Peer[] = [];
  public peers: any = new MatTableDataSource([]);
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
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private actions: Actions, private commonService: CommonService, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeInfo: any) => {
        this.information = nodeInfo;
      });
    this.store.select(eclPageSettings).pipe(takeUntil(this.unSubs[1])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || ECL_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.unshift('state');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });

    this.store.select(peers).pipe(takeUntil(this.unSubs[2])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = peersSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.peersData = peersSelector.peers;
        this.loadPeersTable(this.peersData);
        this.logger.info(peersSelector);
      });
    this.store.select(onchainBalance).pipe(takeUntil(this.unSubs[3])).
      subscribe((oCBalanceSelector: { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.availableBalance = oCBalanceSelector.onchainBalance.total || 0;
      });
    this.actions.pipe(takeUntil(this.unSubs[4]), filter((action) => action.type === ECLActions.SET_PEERS_ECL)).
      subscribe((setPeers: any) => {
        this.peerAddress = null;
      });
  }

  ngAfterViewInit() {
    if (this.peersData.length > 0) {
      this.loadPeersTable(this.peersData);
    }
  }

  onPeerClick(selPeer: Peer, event: any) {
    const reorderedPeer = [
      [{ key: 'nodeId', value: selPeer.nodeId, title: 'Public Key', width: 100 }],
      [{ key: 'address', value: selPeer.address, title: 'Address', width: 50 },
      { key: 'alias', value: selPeer.alias, title: 'Alias', width: 50 }],
      [{ key: 'state', value: this.commonService.titleCase(selPeer.state || ''), title: 'State', width: 50 },
      { key: 'channels', value: selPeer.channels, title: 'Channels', width: 50 }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Peer Information',
          showQRName: 'Public Key',
          showQRField: selPeer.nodeId,
          message: reorderedPeer
        }
      }
    }));
  }

  onConnectPeer(selPeer: Peer) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          message: {
            peer: selPeer.nodeId ? selPeer : null,
            information: this.information,
            balance: this.availableBalance
          },
          component: ECLConnectPeerComponent
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
          newlyAdded: false,
          component: ECLOpenChannelComponent
        }
      }
    }));
  }

  onPeerDetach(peerToDetach: Peer) {
    if (peerToDetach && peerToDetach.channels && peerToDetach.channels > 0) {
      this.store.dispatch(openAlert({
        payload: {
          data: {
            type: AlertTypeEnum.ERROR,
            alertTitle: 'Disconnect Not Allowed',
            titleMessage: 'Channel active with this peer.'
          }
        }
      }));
    } else {
      this.store.dispatch(openConfirmation({
        payload: {
          data: {
            type: AlertTypeEnum.CONFIRM,
            alertTitle: 'Disconnect Peer',
            titleMessage: 'Disconnect peer: ' + ((peerToDetach.alias) ? peerToDetach.alias : peerToDetach.nodeId),
            noBtnText: 'Cancel',
            yesBtnText: 'Disconnect'
          }
        }
      }));
    }
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[5])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(disconnectPeer({ payload: { nodeId: (peerToDetach.nodeId || '') } }));
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

        case 'state':
          rowToFilter = rowData?.state?.toLowerCase() || '';
          break;

        default:
          rowToFilter = !rowData[this.selFilterBy] ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return this.selFilterBy === 'state' ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadPeersTable(peers: Peer[]) {
    this.peers = (peers) ? new MatTableDataSource<Peer>([...peers]) : new MatTableDataSource([]);
    this.peers.sort = this.sort;
    this.peers.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.peers.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
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
