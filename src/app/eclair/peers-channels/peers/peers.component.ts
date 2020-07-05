import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Peer, GetInfo } from '../../../shared/models/eclrModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { ECLROpenChannelComponent } from '../channels/open-channel-modal/open-channel.component';
import { ECLRConnectPeerComponent } from '../connect-peer/connect-peer.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';

import { ECLREffects } from '../../store/eclr.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as ECLRActions from '../../store/eclr.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-eclr-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') },
  ]
})
export class ECLRPeersComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public faUsers = faUsers;
  public newlyAddedPeer = '';
  public flgAnimate = true;
  public displayedColumns = [];
  public peerAddress = '';
  public peers: any;
  public information: GetInfo = {};
  public availableBalance = 0;
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: peers
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private eclrEffects: ECLREffects, private actions$: Actions, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'nodeId', 'address', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'nodeId', 'address', 'channels', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'nodeId', 'address', 'channels', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('eclr')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPeers') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.availableBalance = rtlStore.onchainBalance.total || 0;
      this.peers = (rtlStore.peers) ? new MatTableDataSource<Peer>([...rtlStore.peers]) : new MatTableDataSource([]);
      this.peers.sort = this.sort;
      this.peers.paginator = this.paginator;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = false;
      }
      setTimeout(() => { this.flgAnimate = false; }, 3000);
      this.logger.info(rtlStore);
    });
    this.actions$
    .pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === ECLRActions.SET_PEERS_ECLR)
    ).subscribe((setPeers: ECLRActions.SetPeers) => {
      this.peerAddress = undefined;
      this.flgAnimate = true;
    });
  }

  onPeerClick(selPeer: Peer, event: any) {
    const reorderedPeer = [
      [{key: 'nodeId', value: selPeer.nodeId, title: 'Public Key', width: 100}],
      [{key: 'address', value: selPeer.address, title: 'Address', width: 50},
        {key: 'alias', value: selPeer.alias, title: 'Alias', width: 50}],
      [{key: 'state', value: this.commonService.titleCase(selPeer.state), title: 'State', width: 50},
        {key: 'channels', value: selPeer.channels, title: 'Channels', width: 50}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Peer Information',
      showQRName: 'Public Key',
      showQRField: selPeer.nodeId,
      message: reorderedPeer
    }}));
  }

  onConnectPeer() {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      message: { 
        peer: null,
        information: this.information,
        balance: this.availableBalance
      },
      component: ECLRConnectPeerComponent
    }}));
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
      component: ECLROpenChannelComponent
    }}));
  }

  onPeerDetach(peerToDetach: Peer) {
    const msg = 'Disconnect peer: ' + ((peerToDetach.alias) ? peerToDetach.alias : peerToDetach.nodeId);
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
        this.store.dispatch(new ECLRActions.DisconnectPeer({nodeId: peerToDetach.nodeId}));
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
