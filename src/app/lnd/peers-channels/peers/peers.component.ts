import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { Peer, GetInfo } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { OpenChannelComponent } from '../../../shared/components/data-modal/open-channel/open-channel.component';
import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { LNDEffects } from '../../store/lnd.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { ErrorMessageComponent } from '../../../shared/components/data-modal/error-message/error-message.component';

@Component({
  selector: 'rtl-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') },
  ]
})
export class PeersComponent implements OnInit, OnDestroy {
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

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private lndEffects: LNDEffects, private actions$: Actions, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = [ 'alias', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = [ 'alias', 'sat_sent', 'sat_recv', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'sat_sent', 'sat_recv', 'ping_time', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'pub_key', 'sat_sent', 'sat_recv', 'ping_time', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPeers') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.availableBalance = rtlStore.blockchainBalance.total_balance || 0;
      this.peers = new MatTableDataSource([]);
      this.peers.data = [];
      if (undefined !== rtlStore.peers) {
        this.peers = new MatTableDataSource<Peer>([...rtlStore.peers]);
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
      filter((action) => action.type === RTLActions.SET_PEERS)
    ).subscribe((setPeers: RTLActions.SetPeers) => {
      this.peerAddress = undefined;
    });
  }

  onConnectPeer() {
    // if(!this.peerAddress) {
    //   // this.store.dispatch(new RTLActions.OpenAlert({ data: { type: AlertTypeEnum.ERROR, alertTitle: 'Error', message: { code: 'Invalid values', message: 'invalid or empty address.' }, component: ErrorMessageComponent}}));
    //   this.store.dispatch(new RTLActions.OpenSnackBar('Error: invalid or empty address.'));
    //   return true;
    // }
    this.flgAnimate = true;
    const pattern = '^([a-zA-Z0-9]){1,66}@(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$';
    const deviderIndex = this.peerAddress.search('@');
    let pubkey = '';
    let host = '';
    if (new RegExp(pattern).test(this.peerAddress)) {
      pubkey = this.peerAddress.substring(0, deviderIndex);
      host = this.peerAddress.substring(deviderIndex + 1);
      this.connectPeerWithParams(pubkey, host);
    } else {
      pubkey = (deviderIndex > -1) ? this.peerAddress.substring(0, deviderIndex) : this.peerAddress;
      this.store.dispatch(new RTLActions.OpenSpinner('Getting Node Address...'));
      this.store.dispatch(new RTLActions.FetchGraphNode(pubkey));
      this.lndEffects.setGraphNode
      .pipe(take(1))
      .subscribe(graphNode => {
        host = (undefined === graphNode.node.addresses || undefined === graphNode.node.addresses[0].addr) ? '' : graphNode.node.addresses[0].addr;
        this.connectPeerWithParams(pubkey, host);
      });
    }
  }

  connectPeerWithParams(pubkey: string, host: string) {
    this.newlyAddedPeer = pubkey;
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new RTLActions.SaveNewPeer({pubkey: pubkey, host: host, perm: false, showOpenChannelModal: true}));
  }

  onPeerClick(selRow: Peer, event: any) {
    const flgCloseClicked = event.target.className.includes('mat-column-detach') || event.target.className.includes('mat-icon');
    if (flgCloseClicked) {
      return;
    }
    const selPeer = this.peers.data.filter(peer => {
      return peer.pub_key === selRow.pub_key;
    })[0];
    const reorderedPeer = [
      [{key: 'pub_key', value: selPeer.pub_key, title: 'Public Key', width: 100}],
      [{key: 'address', value: selPeer.address, title: 'Address', width: 100}],
      [{key: 'alias', value: selPeer.alias, title: 'Alias', width: 40}, {key: 'inbound', value: selPeer.inbound ? 'True' : 'False', title: 'Inbound', width: 30}, {key: 'ping_time', value: selPeer.ping_time, title: 'Ping Time', width: 30, type: DataTypeEnum.NUMBER}],
      [{key: 'sat_sent', value: selPeer.sat_sent, title: 'Satoshis Sent', width: 50, type: DataTypeEnum.NUMBER}, {key: 'sat_recv', value: selPeer.sat_recv, title: 'Satoshis Received', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'bytes_sent', value: selPeer.bytes_sent, title: 'Bytes Sent', width: 50, type: DataTypeEnum.NUMBER}, {key: 'bytes_recv', value: selPeer.bytes_recv, title: 'Bytes Received', width: 50, type: DataTypeEnum.NUMBER}],
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Peer Information',
      showQRName: 'Public Key',
      showQRField: selPeer.pub_key,
      message: reorderedPeer
    }}));
  }

  resetData() {
    this.peerAddress = '';
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
      component: OpenChannelComponent
    }}));
  }

  onPeerDetach(peerToDetach: Peer) {
    const msg = 'Disconnect peer: ' + ((peerToDetach.alias) ? peerToDetach.alias : peerToDetach.pub_key);
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
        this.store.dispatch(new RTLActions.DetachPeer({pubkey: peerToDetach.pub_key}));
      }
    });
  }

  applyFilter(selFilter: string) {
    this.peers.filter = selFilter;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
