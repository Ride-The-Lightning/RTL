import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Peer, GetInfo, Balance } from '../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, ScreenSizeEnum, APICallStatusEnum, CLNActions } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { CLNConnectPeerComponent } from '../connect-peer/connect-peer.component';
import { CLNOpenChannelComponent } from '../channels/open-channel-modal/open-channel.component';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { detachPeer } from '../../store/cln.actions';
import { nodeInfoAndBalance, peers } from '../../store/cln.selector';

@Component({
  selector: 'rtl-cln-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class CLNPeersComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faUsers = faUsers;
  public newlyAddedPeer = '';
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
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private actions: Actions, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'id', 'netaddr', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'id', 'netaddr', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'id', 'netaddr', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(nodeInfoAndBalance).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoBalSelector: { information: GetInfo, balance: Balance }) => {
        this.information = infoBalSelector.information;
        this.availableBalance = infoBalSelector.balance.totalBalance || 0;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[1])).
      subscribe((peersSeletor: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = peersSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.peersData = peersSeletor.peers || [];
        if (this.peersData.length > 0) {
          this.loadPeersTable(this.peersData);
        }
        this.logger.info(peersSeletor);
      });
    this.actions.
      pipe(
        takeUntil(this.unSubs[2]),
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
    const reorderedPeer = [
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
      balance: this.availableBalance
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
      pipe(takeUntil(this.unSubs[3])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(detachPeer({ payload: { id: peerToDetach.id, force: false } }));
        }
      });
  }

  applyFilter() {
    this.peers.filter = this.selFilter.trim().toLowerCase();
  }

  loadPeersTable(peersArr: Peer[]) {
    this.peers = new MatTableDataSource<Peer>([...peersArr]);
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
    this.peers.sort = this.sort;
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
