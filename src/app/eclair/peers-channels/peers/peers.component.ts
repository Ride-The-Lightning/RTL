import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Peer, GetInfo } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, ScreenSizeEnum, APICallStatusEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { ApiCallsListECL } from '../../../shared/models/apiCallsPayload';
import { ECLOpenChannelComponent } from '../channels/open-channel-modal/open-channel.component';
import { ECLConnectPeerComponent } from '../connect-peer/connect-peer.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';

import { RTLEffects } from '../../../store/rtl.effects';
import * as ECLActions from '../../store/ecl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class ECLPeersComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator|undefined;
  public faUsers = faUsers;
  public newlyAddedPeer = '';
  public flgAnimate = true;
  public displayedColumns: any[] = [];
  public peerAddress = '';
  public peersData: Peer[] = [];
  public peers: any;
  public information: GetInfo = {};
  public availableBalance = 0;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apisCallStatus: ApiCallsListECL = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private actions: Actions, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'nodeId', 'address', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'nodeId', 'address', 'channels', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'nodeId', 'address', 'channels', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('ecl').
      pipe(takeUntil(this.unSubs[0])).
      subscribe((rtlStore) => {
        this.errorMessage = '';
        this.apisCallStatus = rtlStore.apisCallStatus;
        if (rtlStore.apisCallStatus.FetchPeers.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apisCallStatus.FetchPeers.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchPeers.message) : this.apisCallStatus.FetchPeers.message;
        }
        this.information = rtlStore.information;
        this.availableBalance = rtlStore.onchainBalance.total || 0;
        this.peersData = rtlStore.peers;
        this.loadPeersTable(this.peersData);
        setTimeout(() => {
          this.flgAnimate = false;
        }, 3000);
        this.logger.info(rtlStore);
      });
    this.actions.
      pipe(
        takeUntil(this.unSubs[1]),
        filter((action) => action.type === ECLActions.SET_PEERS_ECL)
      ).subscribe((setPeers: ECLActions.SetPeers) => {
        this.peerAddress = null;
        this.flgAnimate = true;
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
      [{ key: 'state', value: this.commonService.titleCase(selPeer.state), title: 'State', width: 50 },
        { key: 'channels', value: selPeer.channels, title: 'Channels', width: 50 }]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Peer Information',
      showQRName: 'Public Key',
      showQRField: selPeer.nodeId,
      message: reorderedPeer
    } }));
  }

  onConnectPeer(selPeer: Peer) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      message: {
        peer: selPeer.nodeId ? selPeer : null,
        information: this.information,
        balance: this.availableBalance
      },
      component: ECLConnectPeerComponent
    } }));
  }

  onOpenChannel(peerToAddChannel: Peer) {
    const peerToAddChannelMessage = {
      peer: peerToAddChannel,
      information: this.information,
      balance: this.availableBalance
    };
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      alertTitle: 'Open Channel',
      message: peerToAddChannelMessage,
      newlyAdded: false,
      component: ECLOpenChannelComponent
    } }));
  }

  onPeerDetach(peerToDetach: Peer) {
    if (peerToDetach.channels > 0) {
      this.store.dispatch(new RTLActions.OpenAlert({ data: {
        type: AlertTypeEnum.ERROR,
        alertTitle: 'Disconnect Not Allowed',
        titleMessage: 'Channel active with this peer.'
      } }));
    } else {
      this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
        type: AlertTypeEnum.CONFIRM,
        alertTitle: 'Disconnect Peer',
        titleMessage: 'Disconnect peer: ' + ((peerToDetach.alias) ? peerToDetach.alias : peerToDetach.nodeId),
        noBtnText: 'Cancel',
        yesBtnText: 'Disconnect'
      } }));
    }
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[3])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(new ECLActions.DisconnectPeer({ nodeId: peerToDetach.nodeId }));
        }
      });
  }

  applyFilter(selFilter: any) {
    this.peers.filter = selFilter.value.trim().toLowerCase();
  }

  loadPeersTable(peers: Peer[]) {
    this.peers = (peers) ? new MatTableDataSource<Peer>([...peers]) : new MatTableDataSource([]);
    this.peers.sort = this.sort;
    this.peers.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.peers.filterPredicate = (peer: Peer, fltr: string) => JSON.stringify(peer).toLowerCase().includes(fltr);
    this.peers.paginator = this.paginator;
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
