import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Peer, GetInfo, BlockchainBalance } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { OpenChannelComponent } from '../channels/open-channel-modal/open-channel.component';
import { ConnectPeerComponent } from '../connect-peer/connect-peer.component';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { detachPeer } from '../../store/lnd.actions';
import { blockchainBalance, lndNodeInformation, peers } from '../../store/lnd.selector';

@Component({
  selector: 'rtl-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class PeersComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public availableBalance = 0;
  public faUsers = faUsers;
  public displayedColumns: any[] = [];
  public peersData: Peer[] = [];
  public peers: any;
  public information: GetInfo = {};
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'sat_sent', 'sat_recv', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'sat_sent', 'sat_recv', 'ping_time', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'pub_key', 'sat_sent', 'sat_recv', 'ping_time', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[0])).subscribe((nodeInfo: GetInfo) => { this.information = nodeInfo; });
    this.store.select(blockchainBalance).pipe(takeUntil(this.unSubs[1])).
      subscribe((bcBalanceSelector: { blockchainBalance: BlockchainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.availableBalance = bcBalanceSelector.blockchainBalance.total_balance || 0;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[0])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = peersSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.peersData = peersSelector.peers;
        if (this.peersData.length > 0) {
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
    const reorderedPeer = [
      [{ key: 'pub_key', value: selPeer.pub_key, title: 'Public Key', width: 100 }],
      [{ key: 'address', value: selPeer.address, title: 'Address', width: 100 }],
      [{ key: 'alias', value: selPeer.alias, title: 'Alias', width: 40 }, { key: 'inbound', value: selPeer.inbound ? 'True' : 'False', title: 'Inbound', width: 30 }, { key: 'ping_time', value: selPeer.ping_time, title: 'Ping Time', width: 30, type: DataTypeEnum.NUMBER }],
      [{ key: 'sat_sent', value: selPeer.sat_sent, title: 'Satoshis Sent', width: 50, type: DataTypeEnum.NUMBER }, { key: 'sat_recv', value: selPeer.sat_recv, title: 'Satoshis Received', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'bytes_sent', value: selPeer.bytes_sent, title: 'Bytes Sent', width: 50, type: DataTypeEnum.NUMBER }, { key: 'bytes_recv', value: selPeer.bytes_recv, title: 'Bytes Received', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Peer Information',
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
      pipe(takeUntil(this.unSubs[3])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(detachPeer({ payload: { pubkey: peerToDetach.pub_key } }));
        }
      });
  }

  applyFilter() {
    this.peers.filter = this.selFilter.trim().toLowerCase();
  }

  loadPeersTable(peers: Peer[]) {
    this.peers = peers ? new MatTableDataSource<Peer>([...peers]) : new MatTableDataSource([]);
    this.peers.sort = this.sort;
    this.peers.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.peers.filterPredicate = (peer: Peer, fltr: string) => JSON.stringify(peer).toLowerCase().includes(fltr);
    this.peers.paginator = this.paginator;
    this.applyFilter();
  }

  onDownloadCSV() {
    if (this.peers.data && this.peers.data.length > 0) {
      this.commonService.downloadFile(this.peers.data, 'Peers');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
