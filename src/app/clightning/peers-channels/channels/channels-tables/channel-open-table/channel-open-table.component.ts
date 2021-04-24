import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Channel, GetInfo, ChannelEdge } from '../../../../../shared/models/clModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, FEE_RATE_TYPES } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { CLChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { CLEffects } from '../../../../store/cl.effects';
import { RTLEffects } from '../../../../../store/rtl.effects';
import * as CLActions from '../../../../store/cl.actions';
import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-channel-open-table',
  templateUrl: './channel-open-table.component.html',
  styleUrls: ['./channel-open-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]  
})
export class CLChannelOpenTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  public faEye = faEye;
  public faEyeSlash = faEyeSlash
  public totalBalance = 0;
  public displayedColumns: any[] = [];
  public channelsData: Channel[] = [];
  public channels: any;
  public myChanPolicy: any = {};
  public information: GetInfo = {};
  public numPeers = -1;
  public feeRateTypes = FEE_RATE_TYPES;
  public flgLoading: Array<Boolean | 'error'> = [true];
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
      this.displayedColumns = ['alias', 'msatoshi_to_us', 'msatoshi_to_them', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['short_channel_id', 'alias', 'msatoshi_to_us', 'msatoshi_to_them', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['short_channel_id', 'alias', 'msatoshi_to_us', 'msatoshi_to_them', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['short_channel_id', 'alias', 'msatoshi_to_us', 'msatoshi_to_them', 'balancedness', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannels') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.numPeers = (rtlStore.peers && rtlStore.peers.length) ? rtlStore.peers.length : 0;
      this.totalBalance = rtlStore.balance.totalBalance;
      this.channelsData = rtlStore.allChannels.filter(channel => channel.state === 'CHANNELD_NORMAL' && channel.connected);
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
    this.store.dispatch(new CLActions.ChannelLookup({shortChannelID: selChannel.short_channel_id, showError: true}));
    this.clEffects.setLookupCL
    .pipe(take(1))
    .subscribe((resLookup: ChannelEdge[]):boolean|void => {
      if(resLookup.length === 0) { return false; }
      let remoteNode: ChannelEdge = {};
      if(resLookup[0].source !== this.information.id) {
        remoteNode = resLookup[0];
      } else {
        remoteNode = resLookup[1];
      }
      const reorderedChannelPolicy = [
        [{key: 'base_fee_millisatoshi', value: remoteNode.base_fee_millisatoshi, title: 'Base Fees (mSats)', width: 34, type: DataTypeEnum.NUMBER},
          {key: 'fee_per_millionth', value: remoteNode.fee_per_millionth, title: 'Fee/Millionth', width: 33, type: DataTypeEnum.NUMBER},
          {key: 'delay', value: remoteNode.delay, title: 'Delay', width: 33, type: DataTypeEnum.NUMBER}]
      ];      
      this.store.dispatch(new RTLActions.OpenAlert({ data: { 
        type: AlertTypeEnum.INFORMATION,
        alertTitle: 'Remote Channel Policy',
        message: reorderedChannelPolicy
      }}));
    });

  }

  onChannelUpdate(channelToUpdate: any) {
    if(channelToUpdate !== 'all' && channelToUpdate.state === 'ONCHAIN') {
      return;
    }
    if (channelToUpdate === 'all') {
      const confirmationMsg = [];
      this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
        type: AlertTypeEnum.CONFIRM,
        alertTitle: 'Update Fee Policy',
        noBtnText: 'Cancel',
        yesBtnText: 'Update All',
        message: confirmationMsg,
        titleMessage: 'Update fee policy for all channels',
        flgShowInput: true,
        getInputs: [
          {placeholder: 'Base Fee (mSats)', inputType: 'number', inputValue: 1000, width: 48},
          {placeholder: 'Fee Rate (mili mSats)', inputType: 'number', inputValue: 1, min: 1, width: 48}
        ]
      }}));
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unSubs[1]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          this.store.dispatch(new RTLActions.OpenSpinner('Updating Channel Policy...'));
          this.store.dispatch(new CLActions.UpdateChannels({baseFeeMsat: base_fee, feeRate: fee_rate, channelId: 'all'}));
        }
      });
    } else {
      this.myChanPolicy = {fee_base_msat: 0, fee_rate_milli_msat: 0};
      this.store.dispatch(new RTLActions.OpenSpinner('Fetching Channel Policy...'));
      this.store.dispatch(new CLActions.ChannelLookup({shortChannelID: channelToUpdate.short_channel_id, showError: false}));
      this.clEffects.setLookupCL
      .pipe(take(1))
      .subscribe((resLookup: ChannelEdge[]) => {
        if (resLookup.length > 0 && resLookup[0].source === this.information.id) {
          this.myChanPolicy = {fee_base_msat: resLookup[0].base_fee_millisatoshi, fee_rate_milli_msat: resLookup[0].fee_per_millionth};
        } else if (resLookup.length > 1 && resLookup[1].source === this.information.id) {
          this.myChanPolicy = {fee_base_msat: resLookup[1].base_fee_millisatoshi, fee_rate_milli_msat: resLookup[1].fee_per_millionth};
        } else {
          this.myChanPolicy = {fee_base_msat: 0, fee_rate_milli_msat: 0};
        }
        this.logger.info(this.myChanPolicy);
        this.store.dispatch(new RTLActions.CloseSpinner());
        const titleMsg = 'Update fee policy for Channel: ' + channelToUpdate.channel_id;
        const confirmationMsg = [];
        this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Update Fee Policy',
          noBtnText: 'Cancel',
          yesBtnText: 'Update',
          message: confirmationMsg,
          titleMessage: titleMsg,
          flgShowInput: true,
          getInputs: [
            {placeholder: 'Base Fee (mSats)', inputType: 'number', inputValue: (this.myChanPolicy.fee_base_msat === '') ? 0 : this.myChanPolicy.fee_base_msat, width: 48},
            {placeholder: 'Fee Rate (mili mSats)', inputType: 'number', inputValue: this.myChanPolicy.fee_rate_milli_msat, min: 1, width: 48}
          ]
        }}));
      });
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unSubs[2]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          this.store.dispatch(new RTLActions.OpenSpinner('Updating Channel Policy...'));
          this.store.dispatch(new CLActions.UpdateChannels({baseFeeMsat: base_fee, feeRate: fee_rate, channelId: channelToUpdate.channel_id}));
        }
      });
    }
    this.applyFilter();
  }

  onChannelClose(channelToClose: Channel) {
    this.store.dispatch(new RTLActions.OpenConfirmation({ data: { 
      type: AlertTypeEnum.CONFIRM,
      alertTitle: 'Close Channel',
      titleMessage: 'Closing channel: ' + channelToClose.channel_id,
      noBtnText: 'Cancel',
      yesBtnText: 'Close Channel'
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[3]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.store.dispatch(new RTLActions.OpenSpinner('Closing Channel...'));
        this.store.dispatch(new CLActions.CloseChannel({channelId: channelToClose.channel_id, force: false}));
      }
    });
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  onChannelClick(selChannel: Channel, event: any) {
      this.store.dispatch(new RTLActions.OpenAlert({ data: { 
        channel: selChannel,
        showCopy: true,
        component: CLChannelInformationComponent
      }}));
    }

  loadChannelsTable(mychannels) {
    mychannels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? 1 : -1);
    });
    this.channels = new MatTableDataSource<Channel>([...mychannels]);
    this.channels.filterPredicate = (channel: Channel, fltr: string) => {
      const newChannel = ((channel.connected) ? 'connected' : 'disconnected') + (channel.channel_id ? channel.channel_id.toLowerCase() : '') +
      (channel.short_channel_id ? channel.short_channel_id.toLowerCase() : '') + (channel.id ? channel.id.toLowerCase() : '') + (channel.alias ? channel.alias.toLowerCase() : '') +
      (channel.private ? 'private' : 'public') + (channel.state ? channel.state.toLowerCase() : '') +
      (channel.funding_txid ? channel.funding_txid.toLowerCase() : '') + (channel.msatoshi_to_us ? channel.msatoshi_to_us : '') +
      (channel.msatoshi_total ? channel.msatoshi_total : '') + (channel.their_channel_reserve_satoshis ? channel.their_channel_reserve_satoshis : '') +
      (channel.our_channel_reserve_satoshis ? channel.our_channel_reserve_satoshis : '') + (channel.spendable_msatoshi ? channel.spendable_msatoshi : '');
      return newChannel.includes(fltr);
    };
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.channels.paginator = this.paginator;
    this.logger.info(this.channels);
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
