import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, NavigationStart, ActivatedRoute } from '@angular/router';

import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, map, subscribeOn } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { Channel, Peer, GetInfo } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLEffects } from '../../../shared/store/rtl.effects';
import * as RTLActions from '../../../shared/store/rtl.actions';
import * as fromRTLReducer from '../../../shared/store/rtl.reducers';

@Component({
  selector: 'rtl-channel-manage',
  templateUrl: './channel-manage.component.html',
  styleUrls: ['./channel-manage.component.scss']
})
export class ChannelManageComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  public totalBalance = 0;
  public selectedPeer = '';
  public fundingAmount: number;
  public displayedColumns = [];
  public channels: any;
  public peers: Peer[] = [];
  public information: GetInfo = {};
  public flgLoading: Array<Boolean | 'error'> = [true];
  public selectedFilter = '';
  public myChanPolicy: any = {};
  public selFilter = '';
  public transTypes = [{id: '0', name: 'Default Priority'}, {id: '1', name: 'Target Confirmation Blocks'}, {id: '2', name: 'Fee'}];
  public selTransType = '0';
  public transTypeValue = {blocks: '', fees: ''};
  public spendUnconfirmed = false;
  public isPrivate = false;
  public moreOptions = false;
  public flgSticky = false;
  public redirectedWithPeer = false;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>, private rtlEffects: RTLEffects, private activatedRoute: ActivatedRoute) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['close', 'update', 'active', 'chan_id', 'remote_alias'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['close', 'update', 'active', 'chan_id', 'remote_alias', 'capacity'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['close', 'update', 'active', 'chan_id', 'remote_alias', 'capacity', 'local_balance', 'remote_balance'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['close', 'update', 'active', 'chan_id', 'remote_alias', 'capacity', 'local_balance', 'remote_balance', 'total_satoshis_sent',
          'total_satoshis_received', 'commit_fee', 'private'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['close', 'update', 'active', 'chan_id', 'remote_pubkey', 'remote_alias', 'capacity', 'local_balance', 'remote_balance',
          'total_satoshis_sent', 'total_satoshis_received', 'commit_fee', 'private'];
        break;
    }
  }

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannels/all') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.peers = rtlStore.peers;
      this.peers.forEach(peer => {
        if (undefined === peer.alias || peer.alias === '') {
          peer.alias = peer.pub_key.substring(0, 15) + '...';
        }
      });

      this.totalBalance = +rtlStore.blockchainBalance.total_balance;
      if (undefined !== rtlStore.allChannels) {
        this.loadChannelsTable(rtlStore.allChannels);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== rtlStore.allChannels) ? false : true;
      }
      this.logger.info(rtlStore);
    });
    this.activatedRoute.paramMap.subscribe(() => {
      this.selectedPeer = window.history.state.peer;
      this.redirectedWithPeer = (window.history.state.peer) ? true : false;
    });
  }

  onOpenChannel(form: any) {
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    let transTypeValue = '0';
    if (this.selTransType === '1') {
      transTypeValue = this.transTypeValue.blocks;
    } else if (this.selTransType === '2') {
      transTypeValue = this.transTypeValue.fees;
    }
    this.store.dispatch(new RTLActions.SaveNewChannel({
      selectedPeerPubkey: this.selectedPeer, fundingAmount: this.fundingAmount, private: this.isPrivate,
      transType: this.selTransType, transTypeValue: transTypeValue, spendUnconfirmed: this.spendUnconfirmed
    }));
  }

  onChannelUpdate(channelToUpdate: any) {
    if (channelToUpdate === 'all') {
      const titleMsg = 'Updated Values for ALL Channels';
      const confirmationMsg = {};
      this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data: {
        type: 'CONFIRM', titleMessage: titleMsg, noBtnText: 'Cancel', yesBtnText: 'Update', message: JSON.stringify(confirmationMsg), flgShowInput: true, getInputs: [
          {placeholder: 'Base Fee msat', inputType: 'number', inputValue: 1000},
          {placeholder: 'Fee Rate mili msat', inputType: 'number', inputValue: 1, min: 1},
          {placeholder: 'Time Lock Delta', inputType: 'number', inputValue: 144}
        ]
      }}));
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unsub[2]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          const time_lock_delta = confirmRes[2].inputValue;
          this.store.dispatch(new RTLActions.OpenSpinner('Updating Channel Policy...'));
          this.store.dispatch(new RTLActions.UpdateChannels({baseFeeMsat: base_fee, feeRate: fee_rate, timeLockDelta: time_lock_delta, chanPoint: 'all'}));
        }
      });
    } else {
      this.myChanPolicy = {fee_base_msat: 0, fee_rate_milli_msat: 0, time_lock_delta: 0};
      this.store.dispatch(new RTLActions.OpenSpinner('Fetching Channel Policy...'));
      this.store.dispatch(new RTLActions.ChannelLookup(channelToUpdate.chan_id.toString()));
      this.rtlEffects.setLookup
      .pipe(takeUntil(this.unsub[3]))
      .subscribe(resLookup => {
        this.logger.info(resLookup);
        if (resLookup.node1_pub === this.information.identity_pubkey) {
          this.myChanPolicy = resLookup.node1_policy;
        } else if (resLookup.node2_pub === this.information.identity_pubkey) {
          this.myChanPolicy = resLookup.node2_policy;
        } else {
          this.myChanPolicy = {fee_base_msat: 0, fee_rate_milli_msat: 0, time_lock_delta: 0};
        }
        this.logger.info(this.myChanPolicy);
        this.store.dispatch(new RTLActions.CloseSpinner());
        const titleMsg = 'Updated Values for Channel Point: ' + channelToUpdate.channel_point;
        const confirmationMsg = {};
        this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data: {
          type: 'CONFIRM', titleMessage: titleMsg, noBtnText: 'Cancel', yesBtnText: 'Update', message: JSON.stringify(confirmationMsg), flgShowInput: true, getInputs: [
            {placeholder: 'Base Fee msat', inputType: 'number', inputValue: (this.myChanPolicy.fee_base_msat === '') ? 0 : this.myChanPolicy.fee_base_msat},
            {placeholder: 'Fee Rate mili msat', inputType: 'number', inputValue: this.myChanPolicy.fee_rate_milli_msat, min: 1},
            {placeholder: 'Time Lock Delta', inputType: 'number', inputValue: this.myChanPolicy.time_lock_delta}
          ]
        }}));
      });
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unsub[2]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          const time_lock_delta = confirmRes[2].inputValue;
          this.store.dispatch(new RTLActions.OpenSpinner('Updating Channel Policy...'));
          this.store.dispatch(new RTLActions.UpdateChannels({baseFeeMsat: base_fee, feeRate: fee_rate, timeLockDelta: time_lock_delta, chanPoint: channelToUpdate.channel_point}));
        }
      });
    }
    this.applyFilter();
  }

  onChannelClose(channelToClose: Channel) {
    this.store.dispatch(new RTLActions.OpenConfirmation({
      width: '70%', data: { type: 'CONFIRM', titleMessage: 'Closing channel: ' + channelToClose.chan_id, noBtnText: 'Cancel', yesBtnText: 'Close Channel'
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unsub[1]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.store.dispatch(new RTLActions.OpenSpinner('Closing Channel...'));
        this.store.dispatch(new RTLActions.CloseChannel({channelPoint: channelToClose.channel_point, forcibly: !channelToClose.active}));
      }
    });
  }

  applyFilter() {
    this.selectedFilter = this.selFilter;
    this.channels.filter = this.selFilter;
  }

  onChannelClick(selRow: Channel, event: any) {
    const flgCloseClicked =
      event.target.className.includes('mat-column-close')
      || event.target.className.includes('mat-column-update')
      || event.target.className.includes('mat-icon');
    if (flgCloseClicked) {
      return;
    }
    const selChannel = this.channels.data.filter(channel => {
      return channel.chan_id === selRow.chan_id;
    })[0];
    const reorderedChannel = JSON.parse(JSON.stringify(selChannel, [
      'active', 'remote_pubkey', 'remote_alias', 'channel_point', 'chan_id', 'capacity', 'local_balance', 'remote_balance', 'commit_fee', 'commit_weight',
      'fee_per_kw', 'unsettled_balance', 'total_satoshis_sent', 'total_satoshis_received', 'num_updates', 'pending_htlcs', 'csv_delay', 'private'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedChannel)
    }}));
  }

  loadChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? 1 : -1);
    });
    this.channels = new MatTableDataSource<Channel>([...channels]);
    this.channels.sort = this.sort;
    this.logger.info(this.channels);
  }

  resetData() {
    this.selectedPeer = '';
    this.fundingAmount = 0;
    this.moreOptions = false;
    this.spendUnconfirmed = false;
    this.isPrivate = false;
    this.selTransType = '0';
    this.transTypeValue = {blocks: '', fees: ''};
    this.redirectedWithPeer = false;
  }

  onMoreOptionsChange(event: any) {
    if (!event.checked) {
      this.spendUnconfirmed = false;
      this.isPrivate = false;
      this.selTransType = '0';
      this.transTypeValue = {blocks: '', fees: ''};
    }
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
