import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PeerCL, GetInfoCL } from '../../../shared/models/clModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { CLOpenChannelComponent } from '../channels/open-channel-modal/open-channel.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { CLEffects } from '../../store/cl.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { CLConnectPeerComponent } from '../connect-peer/connect-peer.component';

@Component({
  selector: 'rtl-cl-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') },
  ]
})
export class CLPeersComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public faUsers = faUsers;
  public newlyAddedPeer = '';
  public flgAnimate = true;
  public displayedColumns = [];
  public peerAddress = '';
  public peers: any;
  public information: GetInfoCL = {};
  public availableBalance = 0;
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: peers
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private clEffects: CLEffects, private actions$: Actions, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['id', 'alias', 'netaddr', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['id', 'alias', 'netaddr', 'globalfeatures', 'localfeatures', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['id', 'alias', 'netaddr', 'globalfeatures', 'localfeatures', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPeersCL') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.availableBalance = rtlStore.balance.totalBalance || 0;
      this.peers = new MatTableDataSource([]);
      this.peers.data = [];
      if ( rtlStore.peers) {
        this.peers = new MatTableDataSource<PeerCL>([...rtlStore.peers]);
        this.peers.data = rtlStore.peers;
        setTimeout(() => { this.flgAnimate = false; }, 3000);
      }
      this.peers.sort = this.sort;
      this.peers.paginator = this.paginator;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = false;
      }
      this.logger.info(rtlStore);
    });
    this.actions$
    .pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === RTLActions.SET_PEERS_CL)
    ).subscribe((setPeers: RTLActions.SetPeersCL) => {
      this.peerAddress = undefined;
      this.flgAnimate = true;
    });
  }

  onPeerClick(selPeer: PeerCL, event: any) {
    const reorderedPeer = [
      [{key: 'id', value: selPeer.id, title: 'Public Key', width: 100}],
      [{key: 'netaddr', value: selPeer.netaddr, title: 'Address', width: 100}],
      [{key: 'alias', value: selPeer.alias, title: 'Alias', width: 50},
        {key: 'connected', value: selPeer.connected ? 'True' : 'False', title: 'Connected', width: 50}],
      [{key: 'globalfeatures', value: selPeer.globalfeatures, title: 'Global Features', width: 50},
        {key: 'localfeatures', value: selPeer.localfeatures, title: 'Local Features', width: 50}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Peer Information',
      showQRName: 'Public Key',
      showQRField: selPeer.id,
      message: reorderedPeer
    }}));
  }

  onConnectPeer() {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      message: { peer: null, information: this.information, balance: this.availableBalance },
      component: CLConnectPeerComponent
    }}));
  }

  onOpenChannel(peerToAddChannel: PeerCL) {
    const peerToAddChannelMessage = {
      peer: peerToAddChannel, 
      information: this.information,
      balance: this.availableBalance
    };
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      alertTitle: 'Open Channel',
      message: peerToAddChannelMessage,
      newlyAdded: false,
      component: CLOpenChannelComponent
    }}));
  }

  onPeerDetach(peerToDetach: PeerCL) {
    const msg = 'Disconnect peer: ' + ((peerToDetach.alias) ? peerToDetach.alias : peerToDetach.id);
    this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
      type: AlertTypeEnum.CONFIRM,
      alertTitle: 'Disconnect Peer',
      titleMessage: msg,
      noBtnText: 'Cancel',
      yesBtnText: 'Disconnect'
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[3]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.store.dispatch(new RTLActions.OpenSpinner('Disconnecting Peer...'));
        this.store.dispatch(new RTLActions.DetachPeerCL({id: peerToDetach.id, force: false}));
      }
    });
  }

  applyFilter(selFilter: string) {
    this.peers.filter = selFilter;
  }

  onDownloadCSV() {
    if(this.peers.data && this.peers.data.length > 0) {
      this.commonService.downloadCSV(this.peers.data, 'Peers');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
