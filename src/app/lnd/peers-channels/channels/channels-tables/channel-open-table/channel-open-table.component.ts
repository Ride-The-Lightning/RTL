import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {faEye, faEyeSlash} from "@fortawesome/free-solid-svg-icons";

import { ChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { SelNodeChild } from '../../../../../shared/models/RTLconfig';
import { Channel, GetInfo } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, UserPersonaEnum, LoopTypeEnum } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { LoopService } from '../../../../../shared/services/loop.service';
import { CommonService } from '../../../../../shared/services/common.service';
import { ChannelRebalanceComponent } from '../../channel-rebalance-modal/channel-rebalance.component';
import { CloseChannelComponent } from '../../close-channel-modal/close-channel.component';
import { LoopModalComponent } from '../../../../../shared/components/services/loop/loop-modal/loop-modal.component';

import { LNDEffects } from '../../../../store/lnd.effects';
import { RTLEffects } from '../../../../../store/rtl.effects';
import * as LNDActions from '../../../../store/lnd.actions';
import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';


@Component({
  selector: 'rtl-channel-open-table',
  templateUrl: './channel-open-table.component.html',
  styleUrls: ['./channel-open-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]  
})
export class ChannelOpenTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  public timeUnit = 'mins:secs';
  public userPersonaEnum = UserPersonaEnum;
  public selNode: SelNodeChild = {};
  public totalBalance = 0;
  public displayedColumns: any[] = [];
  public channelsData: Channel[] = [];
  public channels: any;
  public myChanPolicy: any = {};
  public information: GetInfo = {};
  public numPeers = -1;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public selFilter = '';
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public versionsArr = [];
  public faEye = faEye;
  public faEyeSlash = faEyeSlash
  private targetConf = 6;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private lndEffects: LNDEffects, private commonService: CommonService, private loopService: LoopService, private decimalPipe: DecimalPipe) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['remote_alias', 'local_balance', 'remote_balance', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['remote_alias', 'uptime', 'local_balance', 'remote_balance', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['remote_alias', 'uptime', 'local_balance', 'remote_balance', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['remote_alias', 'uptime', 'total_satoshis_sent', 'total_satoshis_received', 'local_balance', 'remote_balance', 'balancedness', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannels/all') {
          this.flgLoading[0] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      if(this.information && this.information.version) { this.versionsArr = this.information.version.split('.'); }
      this.numPeers = (rtlStore.peers && rtlStore.peers.length) ? rtlStore.peers.length : 0;
      this.totalBalance = +rtlStore.blockchainBalance.total_balance;
      this.channelsData = this.calculateUptime(rtlStore.allChannels);
      if (this.channelsData.length > 0) {
        this.loadChannelsTable(this.channelsData);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (rtlStore.allChannels) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    if (this.channelsData.length > 0) {
      this.loadChannelsTable(this.channelsData);
    }
  }

  onViewRemotePolicy(selChannel: Channel) {
    this.store.dispatch(new LNDActions.ChannelLookup(selChannel.chan_id.toString() + '/' + this.information.identity_pubkey));
    this.lndEffects.setLookup
    .pipe(take(1))
    .subscribe((resLookup):boolean|void => {
      if(!resLookup.fee_base_msat && !resLookup.fee_rate_milli_msat && !resLookup.time_lock_delta) { return false; }        
      const reorderedChannelPolicy = [
        [{key: 'fee_base_msat', value: resLookup.fee_base_msat, title: 'Base Fees (mSats)', width: 34, type: DataTypeEnum.NUMBER},
          {key: 'fee_rate_milli_msat', value: resLookup.fee_rate_milli_msat, title: 'Fee Rate (milli mSats)', width: 33, type: DataTypeEnum.NUMBER},
          {key: 'time_lock_delta', value: resLookup.time_lock_delta, title: 'Time Lock Delta', width: 33, type: DataTypeEnum.NUMBER}]
      ];      
      this.store.dispatch(new RTLActions.OpenAlert({ data: { 
        type: AlertTypeEnum.INFORMATION,
        alertTitle: 'Remote Channel Policy',
        message: reorderedChannelPolicy
      }}));
    });

  }

  onCircularRebalance(selChannel: any) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      channel: selChannel,
      component: ChannelRebalanceComponent
    }}));
  }

  onChannelUpdate(channelToUpdate: any) {
    if (channelToUpdate === 'all') {
      const confirmationMsg = [];
      this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
        type: AlertTypeEnum.CONFIRM,
        alertTitle: 'Update Fee Policy',
        noBtnText: 'Cancel',
        yesBtnText: 'Update All Channels',
        message: confirmationMsg,
        titleMessage: 'Update fee policy for all channels',
        flgShowInput: true,
        getInputs: [
          {placeholder: 'Base Fee (mSat)', inputType: DataTypeEnum.NUMBER.toLowerCase(), inputValue: 1000, width: 32},
          {placeholder: 'Fee Rate (mili mSat)', inputType: DataTypeEnum.NUMBER.toLowerCase(), inputValue: 1, min: 1, width: 32},
          {placeholder: 'Time Lock Delta', inputType: DataTypeEnum.NUMBER.toLowerCase(), inputValue: 40, width: 32}
        ]
      }}));
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unSubs[1]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          const time_lock_delta = confirmRes[2].inputValue;
          this.store.dispatch(new RTLActions.OpenSpinner('Updating Channel Policy...'));
          this.store.dispatch(new LNDActions.UpdateChannels({baseFeeMsat: base_fee, feeRate: fee_rate, timeLockDelta: time_lock_delta, chanPoint: 'all'}));
        }
      });
    } else {
      this.myChanPolicy = {fee_base_msat: 0, fee_rate_milli_msat: 0, time_lock_delta: 0};      
      this.store.dispatch(new RTLActions.OpenSpinner('Fetching Channel Policy...'));
      this.store.dispatch(new LNDActions.ChannelLookup(channelToUpdate.chan_id.toString()));
      this.lndEffects.setLookup
      .pipe(take(1))
      .subscribe(resLookup => {
        if (resLookup.node1_pub === this.information.identity_pubkey) {
          this.myChanPolicy = resLookup.node1_policy;
        } else if (resLookup.node2_pub === this.information.identity_pubkey) {
          this.myChanPolicy = resLookup.node2_policy;
        } else {
          this.myChanPolicy = {fee_base_msat: 0, fee_rate_milli_msat: 0, time_lock_delta: 0};
        }
        this.logger.info(this.myChanPolicy);
        this.store.dispatch(new RTLActions.CloseSpinner());
        const titleMsg = 'Update fee policy for channel point: ' + channelToUpdate.channel_point;
        const confirmationMsg = [];
        this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Update Fee Policy',
          titleMessage: titleMsg,
          noBtnText: 'Cancel',
          yesBtnText: 'Update Channel',
          message: confirmationMsg,
          flgShowInput: true,
          getInputs: [
            {placeholder: 'Base Fee (mSat)', inputType: DataTypeEnum.NUMBER.toLowerCase(), inputValue: (this.myChanPolicy.fee_base_msat === '') ? 0 : this.myChanPolicy.fee_base_msat, width: 32},
            {placeholder: 'Fee Rate (mili mSat)', inputType: DataTypeEnum.NUMBER.toLowerCase(), inputValue: this.myChanPolicy.fee_rate_milli_msat, min: 1, width: 32},
            {placeholder: 'Time Lock Delta', inputType: DataTypeEnum.NUMBER.toLowerCase(), inputValue: this.myChanPolicy.time_lock_delta, width: 32}
          ]
        }}));
      });
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unSubs[2]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          const time_lock_delta = confirmRes[2].inputValue;
          this.store.dispatch(new RTLActions.OpenSpinner('Updating Channel Policy...'));
          this.store.dispatch(new LNDActions.UpdateChannels({baseFeeMsat: base_fee, feeRate: fee_rate, timeLockDelta: time_lock_delta, chanPoint: channelToUpdate.channel_point}));
        }
      });
    }
    this.applyFilter();
  }

  onChannelClose(channelToClose: Channel) {
    if (channelToClose.active) {
      this.store.dispatch(new LNDActions.FetchAllChannels()); //To get latest pending htlc status
    }
    this.store.dispatch(new RTLActions.OpenAlert({width: '70%', data: {
      channel: channelToClose,
      component: CloseChannelComponent
    }}));    
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      channel: selChannel,
      showCopy: true,
      component: ChannelInformationComponent
    }}));
  }

  loadChannelsTable(mychannels: Channel[]) {
    mychannels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? 1 : -1);
    });
    this.channels = new MatTableDataSource<Channel>([...mychannels]);
    this.channels.filterPredicate = (channel: Channel, fltr: string) => {
      const newChannel = ((channel.active) ? 'active' : 'inactive') + (channel.chan_id ? channel.chan_id.toLowerCase() : '') +
      (channel.remote_pubkey ? channel.remote_pubkey.toLowerCase() : '') + (channel.remote_alias ? channel.remote_alias.toLowerCase() : '') +
      (channel.capacity ? channel.capacity : '') + (channel.local_balance ? channel.local_balance : '') +
      (channel.remote_balance ? channel.remote_balance : '') + (channel.total_satoshis_sent ? channel.total_satoshis_sent : '') +
      (channel.total_satoshis_received ? channel.total_satoshis_received : '') + (channel.commit_fee ? channel.commit_fee : '') +
      (channel.private ? 'private' : 'public');
      return newChannel.includes(fltr);
    };
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.channels.paginator = this.paginator;
    this.logger.info(this.channels);
  }

  calculateUptime(channels: Channel[]) {
    const minutesDivider = 60;
    const hoursDivider = minutesDivider * 60;
    const daysDivider = hoursDivider * 24;
    const yearsDivider = daysDivider * 365;
    let maxDivider = minutesDivider;
    let minDivider = 1;
    let max_uptime = 0;
    channels.forEach(channel => { if(channel.uptime && +channel.uptime > max_uptime) { max_uptime = +channel.uptime; }});
    switch (true) {
      case max_uptime < hoursDivider:
        this.timeUnit = 'Mins:Secs';
        maxDivider = minutesDivider;
        minDivider = 1;
        break;

      case max_uptime >= hoursDivider && max_uptime < daysDivider:
        this.timeUnit = 'Hrs:Mins';
        maxDivider = hoursDivider;
        minDivider = minutesDivider;
        break;

      case max_uptime >= daysDivider && max_uptime < yearsDivider:
        this.timeUnit = 'Days:Hrs';
        maxDivider = daysDivider;
        minDivider = hoursDivider;
        break;
  
      case max_uptime > yearsDivider:
        this.timeUnit = 'Yrs:Days';
        maxDivider = yearsDivider;
        minDivider = daysDivider;
        break;
  
      default:
        this.timeUnit = 'Mins:Secs';
        maxDivider = minutesDivider;
        minDivider = 1;
        break;
    }
    channels.forEach(channel => {
      channel.uptime_str = channel.uptime ? (this.decimalPipe.transform(Math.floor(+channel.uptime / maxDivider), '2.0-0') + ':' + this.decimalPipe.transform(Math.round((+channel.uptime % maxDivider) / minDivider), '2.0-0')) : '---';
    });
    return channels;
  }

  onLoopOut(selChannel: Channel) {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Terms and Quotes...'));
    this.loopService.getLoopOutTermsAndQuotes(this.targetConf)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(response => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.OpenAlert({ minHeight: '56rem', data: {
        channel: selChannel,
        minQuote: response[0],
        maxQuote: response[1],
        direction: LoopTypeEnum.LOOP_OUT,
        component: LoopModalComponent
      }}));    
    });
  }

  onDownloadCSV() {
    if(this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.channels.data, 'Open-channels');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
