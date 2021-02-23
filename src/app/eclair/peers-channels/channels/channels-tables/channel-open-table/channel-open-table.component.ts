import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Channel, GetInfo } from '../../../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, FEE_RATE_TYPES, AlertTypeEnum } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { ECLChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { ECLEffects } from '../../../../store/ecl.effects';
import { RTLEffects } from '../../../../../store/rtl.effects';
import * as ECLActions from '../../../../store/ecl.actions';
import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-channel-open-table',
  templateUrl: './channel-open-table.component.html',
  styleUrls: ['./channel-open-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]  
})
export class ECLChannelOpenTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  public faEye = faEye;
  public faEyeSlash = faEyeSlash
  public activeChannels: Channel[];
  public totalBalance = 0;
  public displayedColumns: any[] = [];
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

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private eclEffects: ECLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'toLocal', 'toRemote', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['shortChannelId', 'alias', 'toLocal', 'toRemote', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['shortChannelId', 'alias', 'toLocal', 'toRemote', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['shortChannelId', 'alias', 'toLocal', 'toRemote', 'balancedness', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannels') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.numPeers = (rtlStore.peers && rtlStore.peers.length) ? rtlStore.peers.length : 0;
      this.totalBalance = rtlStore.onchainBalance.total;
      this.activeChannels = rtlStore.activeChannels;
      if (this.activeChannels.length > 0 && this.sort && this.paginator) {
        this.loadChannelsTable();
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (rtlStore.activeChannels) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    if (this.activeChannels.length > 0 && this.sort && this.paginator) {
      this.loadChannelsTable();
    }
  }

  onChannelUpdate(channelToUpdate: any) {
    if(channelToUpdate !== 'all' && channelToUpdate.state !== 'NORMAL') {
      return;
    }
    const titleMsg = channelToUpdate === 'all' ? 'Update fee policy for selected/all channels' : 'Update fee policy for Channel: ' + channelToUpdate.channelId;
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
        {placeholder: 'Base Fee (mSats)', inputType: 'number', inputValue: channelToUpdate && channelToUpdate.feeBaseMsat ? channelToUpdate.feeBaseMsat : 1000, width: 48},
        {placeholder: 'Fee Rate (mili mSats)', inputType: 'number', inputValue: channelToUpdate && channelToUpdate.feeProportionalMillionths ? channelToUpdate.feeProportionalMillionths : 100, min: 1, width: 48}
      ]
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        const base_fee = confirmRes[0].inputValue;
        const fee_rate = confirmRes[1].inputValue;
        let updateRequestPayload = null;
        let channel_ids = '';
        if (channelToUpdate === 'all') {
          this.activeChannels.forEach(channel => { channel_ids = channel_ids + ',' + channel.channelId; });
          channel_ids = channel_ids.substring(1);
          updateRequestPayload = { baseFeeMsat: base_fee, feeRate: fee_rate, channelIds: channel_ids };
        } else {
          updateRequestPayload = { baseFeeMsat: base_fee, feeRate: fee_rate, channelId: channelToUpdate.channelId };
        }
        this.store.dispatch(new RTLActions.OpenSpinner('Updating Channel Policy...'));
        this.store.dispatch(new ECLActions.UpdateChannels(updateRequestPayload));
      }
    });
    this.applyFilter();
  }

  onChannelClose(channelToClose: Channel, forceClose: boolean) {
    const alertTitle = (forceClose) ? 'Force Close Channel' : 'Close Channel';
    const titleMessage = (forceClose) ? ('Force closing channel: ' + channelToClose.channelId) : ('Closing channel: ' + channelToClose.channelId);
    const yesBtnText = (forceClose) ? 'Force Close' : 'Close Channel';
    this.store.dispatch(new RTLActions.OpenConfirmation({ data: { 
      type: AlertTypeEnum.CONFIRM,
      alertTitle: alertTitle,
      titleMessage: titleMessage,
      noBtnText: 'Cancel',
      yesBtnText: yesBtnText
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[3]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.store.dispatch(new RTLActions.OpenSpinner((forceClose) ? 'Force Closing Channel...' : 'Closing Channel...'));
        this.store.dispatch(new ECLActions.CloseChannel({channelId: channelToClose.channelId, force: forceClose}));
      }
    });
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  onChannelClick(selChannel: Channel, event: any) {
      this.store.dispatch(new RTLActions.OpenAlert({ data: { 
        channel: selChannel,
        channelsType: 'open',
        component: ECLChannelInformationComponent
      }}));
    }

  loadChannelsTable() {
    this.activeChannels.sort(function(a, b) {
      return (a.alias === b.alias) ? 0 : ((b.alias) ? 1 : -1);
    });
    this.channels = new MatTableDataSource<Channel>([...this.activeChannels]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.channels.filterPredicate = (channel: Channel, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.channels.paginator = this.paginator;
    this.logger.info(this.channels);
  }

  onDownloadCSV() {
    if(this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.channels.data, 'ActiveChannels');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
