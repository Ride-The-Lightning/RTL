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
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, ScreenSizeEnum, APICallStatusEnum, ECLActions } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { ECLOpenChannelComponent } from '../channels/open-channel-modal/open-channel.component';
import { ECLConnectPeerComponent } from '../connect-peer/connect-peer.component';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { disconnectPeer } from '../../store/ecl.actions';
import { eclNodeInformation, onchainBalance, peers } from '../../store/ecl.selector';

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
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private actions: Actions, private commonService: CommonService) {
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
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeInfo: any) => {
        this.information = nodeInfo;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[1])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = peersSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.peersData = peersSelector.peers;
        this.loadPeersTable(this.peersData);
        this.logger.info(peersSelector);
      });
    this.store.select(onchainBalance).pipe(takeUntil(this.unSubs[2])).
      subscribe((oCBalanceSelector: { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.availableBalance = oCBalanceSelector.onchainBalance.total || 0;
      });
    this.actions.pipe(takeUntil(this.unSubs[3]), filter((action) => action.type === ECLActions.SET_PEERS_ECL)).
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
      [{ key: 'state', value: this.commonService.titleCase(selPeer.state), title: 'State', width: 50 },
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
    if (peerToDetach.channels > 0) {
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
      pipe(takeUntil(this.unSubs[4])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(disconnectPeer({ payload: { nodeId: peerToDetach.nodeId } }));
        }
      });
  }

  applyFilter() {
    this.peers.filter = this.selFilter.trim().toLowerCase();
  }

  loadPeersTable(peers: Peer[]) {
    this.peers = (peers) ? new MatTableDataSource<Peer>([...peers]) : new MatTableDataSource([]);
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
