import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { ChannelCL, GetInfoCL } from '../../../../../shared/models/clModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, FEE_RATE_TYPES } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { CLEffects } from '../../../../store/cl.effects';
import { RTLEffects } from '../../../../../store/rtl.effects';
import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-channel-pending-table',
  templateUrl: './channel-pending-table.component.html',
  styleUrls: ['./channel-pending-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]  
})
export class CLChannelPendingTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public totalBalance = 0;
  public displayedColumns = [];
  public channels: any;
  public myChanPolicy: any = {};
  public information: GetInfoCL = {};
  public numPeers = -1;
  public feeRateTypes = FEE_RATE_TYPES;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public selectedFilter = '';
  public selFilter = '';
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private clEffects: CLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['short_channel_id', 'state', 'msatoshi_total', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['short_channel_id', 'alias', 'state', 'msatoshi_total', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['short_channel_id', 'alias', 'state', 'msatoshi_total', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['short_channel_id', 'alias', 'state', 'msatoshi_total', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannelsCL') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.numPeers = (rtlStore.peers && rtlStore.peers.length) ? rtlStore.peers.length : 0;
      this.totalBalance = rtlStore.balance.totalBalance;
      if (rtlStore.allChannels) {
        this.loadChannelsTable(rtlStore.allChannels.filter(channel => channel.state !== 'CHANNELD_NORMAL'));
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (rtlStore.allChannels) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  applyFilter() {
    this.selectedFilter = this.selFilter;
    this.channels.filter = this.selFilter;
  }

  onChannelClick(selChannel: ChannelCL, event: any) {
    const reorderedChannel = [
      [{key: 'alias', value: selChannel.alias, title: 'Peer Alias', width: 40},
        {key: 'connected', value: selChannel.connected, title: 'Connected', width: 30, type: DataTypeEnum.BOOLEAN},
        {key: 'private', value: selChannel.private, title: 'Private', width: 30, type: DataTypeEnum.BOOLEAN}],
      [{key: 'id', value: selChannel.id, title: 'Peer Public Key', width: 100}],
      [{key: 'short_channel_id', value: selChannel.short_channel_id, title: 'Short Channel ID', width: 100}],
      [{key: 'channel_id', value: selChannel.channel_id, title: 'Channel ID', width: 50},
        {key: 'state', value: selChannel.state, title: 'State', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'our_channel_reserve_satoshis', value: selChannel.our_channel_reserve_satoshis, title: 'Our Channel Reserve Satoshis', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'their_channel_reserve_satoshis', value: selChannel.their_channel_reserve_satoshis, title: 'Their Channel Reserve Satoshis', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'msatoshi_to_us', value: selChannel.msatoshi_to_us, title: 'mSatoshi to Us', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'spendable_msatoshi', value: selChannel.spendable_msatoshi, title: 'Spendable mSatoshi', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'msatoshi_total', value: selChannel.msatoshi_total, title: 'Total mSatoshi', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'funding_txid', value: selChannel.funding_txid, title: 'Funding Transaction Id', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Channel Information',
      showCopyName: 'Short Channel ID',
      showCopyField: selChannel.short_channel_id,
      message: reorderedChannel
    }}));
  }

  loadChannelsTable(mychannels) {
    mychannels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? 1 : -1);
    });
    this.channels = new MatTableDataSource<ChannelCL>([...mychannels]);
    this.channels.filterPredicate = (channel: ChannelCL, fltr: string) => {
      const newChannel = ((channel.connected) ? 'connected' : 'disconnected') + (channel.channel_id ? channel.channel_id : '') +
      (channel.short_channel_id ? channel.short_channel_id : '') + (channel.id ? channel.id : '') + (channel.alias ? channel.alias : '') +
      (channel.private ? 'private' : 'public') + (channel.state ? channel.state.toLowerCase() : '') +
      (channel.funding_txid ? channel.funding_txid : '') + (channel.msatoshi_to_us ? channel.msatoshi_to_us : '') +
      (channel.msatoshi_total ? channel.msatoshi_total : '') + (channel.their_channel_reserve_satoshis ? channel.their_channel_reserve_satoshis : '') +
      (channel.our_channel_reserve_satoshis ? channel.our_channel_reserve_satoshis : '') + (channel.spendable_msatoshi ? channel.spendable_msatoshi : '');
      return newChannel.includes(fltr.toLowerCase());
    };
    this.channels.sort = this.sort;
    this.channels.paginator = this.paginator;
    this.logger.info(this.channels);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
