import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatTableDataSource, MatSort } from '@angular/material';
import { ChannelCL, PeerCL, GetInfoCL, ChannelEdgeCL } from '../../shared/models/clModels';
import { LoggerService } from '../../shared/services/logger.service';

import { CLEffects } from '../store/cl.effects';
import { RTLEffects } from '../../store/rtl.effects';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-channels',
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.scss']
})
export class CLChannelsComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public totalBalance = 0;
  public selectedPeer = '';
  public fundingAmount: number;
  public displayedColumns = [];
  public channels: any;
  public peers: PeerCL[] = [];
  public information: GetInfoCL = {};
  public flgLoading: Array<Boolean | 'error'> = [true];
  public selectedFilter = '';
  public myChanPolicy: any = {};
  public selFilter = '';
  public feeRateTypes = [];
  public selFeeRate = '';
  public isPrivate = false;
  public flgMinConf = false;
  public minConfValue = null;
  public moreOptions = false;
  public flgSticky = false;
  public redirectedWithPeer = false;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private clEffects: CLEffects, private activatedRoute: ActivatedRoute) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['close', 'update', 'short_channel_id', 'state', 'msatoshi_total'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['close', 'update', 'short_channel_id', 'state', 'msatoshi_to_us', 'msatoshi_total', 'spendable_msatoshi'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = [
          'close', 'update', 'short_channel_id', 'alias', 'connected', 'private', 'state', 'msatoshi_to_us', 'msatoshi_total', 'spendable_msatoshi'
        ];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = [
          'close', 'update', 'short_channel_id', 'alias', 'connected', 'private', 'state', 'msatoshi_to_us', 'msatoshi_total', 'spendable_msatoshi'
        ];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = [
          'close', 'update', 'short_channel_id', 'alias', 'connected', 'private', 'state', 'msatoshi_to_us', 'msatoshi_total', 'spendable_msatoshi'
        ];
        break;
    }
  }

  ngOnInit() {
    this.store.dispatch(new RTLActions.FetchChannelsCL());
    this.store.select('cl')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannelsCL') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.feeRateTypes = rtlStore.feeRateTypes;
      this.peers = rtlStore.peers;
      this.peers.forEach(peer => {
        if (undefined === peer.alias || peer.alias === '') {
          peer.alias = peer.id.substring(0, 15) + '...';
        }
      });

      this.totalBalance = +rtlStore.balance.totalBalance;
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
    this.store.dispatch(new RTLActions.SaveNewChannelCL({
      peerId: this.selectedPeer, satoshis: this.fundingAmount, announce: !this.isPrivate, feeRate: this.selFeeRate, minconf: this.flgMinConf ? this.minConfValue : null
    }));
  }

  onChannelUpdate(channelToUpdate: ChannelCL | 'all') {
    if(channelToUpdate !== 'all' && channelToUpdate.state === 'ONCHAIN') {
      return;
    }
    if (channelToUpdate === 'all') {
      const titleMsg = 'Updated Values for ALL Channels';
      const confirmationMsg = {};
      this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data: {
        type: 'CONFIRM', titleMessage: titleMsg, noBtnText: 'Cancel', yesBtnText: 'Update', message: JSON.stringify(confirmationMsg), flgShowInput: true, getInputs: [
          {placeholder: 'Base Fee msat', inputType: 'number', inputValue: 1000},
          {placeholder: 'Fee Rate mili msat', inputType: 'number', inputValue: 1, min: 1}
        ]
      }}));
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unsub[2]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          this.store.dispatch(new RTLActions.OpenSpinner('Updating Channel Policy...'));
          this.store.dispatch(new RTLActions.UpdateChannelsCL({baseFeeMsat: base_fee, feeRate: fee_rate, channelId: 'all'}));
        }
      });
    } else {
      this.myChanPolicy = {fee_base_msat: 0, fee_rate_milli_msat: 0};
      this.store.dispatch(new RTLActions.OpenSpinner('Fetching Channel Policy...'));
      this.store.dispatch(new RTLActions.ChannelLookupCL(channelToUpdate.short_channel_id));
      this.clEffects.setLookupCL
      .pipe(takeUntil(this.unsub[3]))
      .subscribe((resLookup: ChannelEdgeCL[]) => {
        this.logger.info(resLookup);
        if (resLookup.length > 0 && resLookup[0].source === this.information.id) {
          this.myChanPolicy = {fee_base_msat: resLookup[0].base_fee_millisatoshi, fee_rate_milli_msat: resLookup[0].fee_per_millionth};
        } else if (resLookup.length > 1 && resLookup[1].source === this.information.id) {
          this.myChanPolicy = {fee_base_msat: resLookup[1].base_fee_millisatoshi, fee_rate_milli_msat: resLookup[1].fee_per_millionth};
        } else {
          this.myChanPolicy = {fee_base_msat: 0, fee_rate_milli_msat: 0};
        }
        this.logger.info(this.myChanPolicy);
        this.store.dispatch(new RTLActions.CloseSpinner());
        const titleMsg = 'Updated Values for Channel: ' + channelToUpdate.channel_id;
        const confirmationMsg = {};
        this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data: {
          type: 'CONFIRM', titleMessage: titleMsg, noBtnText: 'Cancel', yesBtnText: 'Update', message: JSON.stringify(confirmationMsg), flgShowInput: true, getInputs: [
            {placeholder: 'Base Fee msat', inputType: 'number', inputValue: (this.myChanPolicy.fee_base_msat === '') ? 0 : this.myChanPolicy.fee_base_msat},
            {placeholder: 'Fee Rate mili msat', inputType: 'number', inputValue: this.myChanPolicy.fee_rate_milli_msat, min: 1}
          ]
        }}));
      });
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unsub[2]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          this.store.dispatch(new RTLActions.OpenSpinner('Updating Channel Policy...'));
          this.store.dispatch(new RTLActions.UpdateChannelsCL({baseFeeMsat: base_fee, feeRate: fee_rate, channelId: channelToUpdate.channel_id}));
        }
      });
    }
    this.applyFilter();
  }

  onChannelClose(channelToClose: ChannelCL) {
    if(channelToClose.state === 'ONCHAIN') {
      return;
    }
    if (channelToClose.state === 'AWAITING_UNILATERAL') {
      this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
        type: 'WARN',
        titleMessage: 'Channel can not be closed when it is in AWAITING UNILATERAL state.'
      }}));
    } else {
      this.store.dispatch(new RTLActions.OpenConfirmation({
        width: '70%', data: { type: 'CONFIRM', titleMessage: 'Closing channel: ' + channelToClose.channel_id, noBtnText: 'Cancel', yesBtnText: 'Close Channel'
      }}));
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unsub[1]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          this.store.dispatch(new RTLActions.OpenSpinner('Closing Channel...'));
          this.store.dispatch(new RTLActions.CloseChannelCL({channelId: channelToClose.channel_id}));
        }
      });
    }
  }

  applyFilter() {
    this.selectedFilter = this.selFilter;
    this.channels.filter = this.selFilter;
  }

  onChannelClick(selRow: ChannelCL, event: any) {
    const flgCloseClicked =
      event.target.className.includes('mat-column-close')
      || event.target.className.includes('mat-column-update')
      || event.target.className.includes('mat-icon');
    if (flgCloseClicked) {
      return;
    }
    const selChannel = this.channels.data.filter(channel => {
      return channel.channel_id === selRow.channel_id;
    })[0];
    const reorderedChannel = JSON.parse(JSON.stringify(selChannel, [
      'channel_id', 'short_channel_id', 'id', 'alias', 'connected', 'private', 'state', 'funding_txid', 'msatoshi_to_us', 'msatoshi_total', 'their_channel_reserve_satoshis', 'our_channel_reserve_satoshis', 'spendable_msatoshi'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedChannel)
    }}));
  }

  loadChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a && a.active === b.active) ? 0 : ((b.active) ? 1 : -1);
    });
    this.channels = new MatTableDataSource<ChannelCL>([...channels]);
    this.channels.sort = this.sort;
    this.channels.filterPredicate = (channel: ChannelCL, fltr: string) => {
      const newChannel = ((channel.connected) ? 'connected' : 'disconnected') + (channel.channel_id ? channel.channel_id : '') +
      (channel.short_channel_id ? channel.short_channel_id : '') + (channel.id ? channel.id : '') + (channel.alias ? channel.alias : '') +
      (channel.private ? 'private' : 'public') + (channel.state ? channel.state.toLowerCase() : '') +
      (channel.funding_txid ? channel.funding_txid : '') + (channel.msatoshi_to_us ? channel.msatoshi_to_us : '') +
      (channel.msatoshi_total ? channel.msatoshi_total : '') + (channel.their_channel_reserve_satoshis ? channel.their_channel_reserve_satoshis : '') +
      (channel.our_channel_reserve_satoshis ? channel.our_channel_reserve_satoshis : '') + (channel.spendable_msatoshi ? channel.spendable_msatoshi : '');
      return newChannel.includes(fltr.toLowerCase());
    };
    this.logger.info(this.channels);
  }

  resetData() {
    this.selectedPeer = '';
    this.fundingAmount = 0;
    this.moreOptions = false;
    this.flgMinConf = false;
    this.isPrivate = false;
    this.selFeeRate = '';
    this.minConfValue = null;
    this.redirectedWithPeer = false;
  }

  onMoreOptionsChange(event: any) {
    if (!event.checked) {
      this.flgMinConf = false;
      this.isPrivate = false;
      this.selFeeRate = '';
      this.minConfValue = null;
    }
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
