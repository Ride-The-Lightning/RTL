import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { GetInfo, Channel, Balance } from '../../../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, FEE_RATE_TYPES, AlertTypeEnum, APICallStatusEnum, CLNChannelPendingState, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS } from '../../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';
import { CLNChannelInformationComponent } from '../../channel-information-modal/channel-information.component';

import { RTLEffects } from '../../../../../store/rtl.effects';
import { CLNBumpFeeComponent } from '../../bump-fee-modal/bump-fee.component';
import { openAlert, openConfirmation } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { closeChannel } from '../../../../store/cln.actions';
import { channels, clnPageSettings, nodeInfoAndBalanceAndNumPeers } from '../../../../store/cln.selector';
import { PageSettingsCLN, TableSetting } from '../../../../../shared/models/pageSettings';

@Component({
  selector: 'rtl-cln-channel-pending-table',
  templateUrl: './channel-pending-table.component.html',
  styleUrls: ['./channel-pending-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class CLNChannelPendingTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faEye = faEye;
  public faEyeSlash = faEyeSlash;
  public PAGE_ID = 'peers_channels';
  public tableSetting: TableSetting = { tableId: 'pending_inactive_channels', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.DESCENDING };
  public isCompatibleVersion = false;
  public totalBalance = 0;
  public displayedColumns: any[] = [];
  public channelsData: Channel[] = [];
  public channels: any;
  public myChanPolicy: any = {};
  public information: GetInfo = {};
  public numPeers = -1;
  public feeRateTypes = FEE_RATE_TYPES;
  public selFilter = '';
  public CLNChannelPendingState = CLNChannelPendingState;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(nodeInfoAndBalanceAndNumPeers).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoBalNumpeersSelector: { information: GetInfo, balance: Balance, numPeers: number }) => {
        this.information = infoBalNumpeersSelector.information;
        if (this.information.api_version) {
          this.isCompatibleVersion = this.commonService.isVersionCompatible(this.information.api_version, '0.4.2');
        }
        this.numPeers = infoBalNumpeersSelector.numPeers;
        this.totalBalance = infoBalNumpeersSelector.balance.totalBalance || 0;
        this.logger.info(infoBalNumpeersSelector);
      });
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[1])).
      subscribe((settings: { pageSettings: PageSettingsCLN[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || CLN_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.unshift('private');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.logger.info(this.displayedColumns);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[2])).
      subscribe((channelsSeletor: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.channelsData = [...channelsSeletor.pendingChannels, ...channelsSeletor.inactiveChannels];
        this.channelsData = this.channelsData.sort((a, b) => ((this.CLNChannelPendingState[a.state || ''] >= this.CLNChannelPendingState[b.state || '']) ? 1 : -1));
        if (this.channelsData && this.channelsData.length > 0) {
          this.loadChannelsTable(this.channelsData);
        }
        this.logger.info(channelsSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.channelsData && this.channelsData.length > 0) {
      this.loadChannelsTable(this.channelsData);
    }
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  onBumpFee(selChannel: Channel) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: selChannel,
          component: CLNBumpFeeComponent
        }
      }
    }));
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: selChannel,
          showCopy: true,
          component: CLNChannelInformationComponent
        }
      }
    }));
  }

  onChannelClose(channelToClose: Channel) {
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Force Close Channel',
          titleMessage: 'Force closing channel: ' + ((!channelToClose.alias && !channelToClose.short_channel_id) ? channelToClose.channel_id : (channelToClose.alias && channelToClose.short_channel_id) ? channelToClose.alias + ' (' + channelToClose.short_channel_id + ')' : channelToClose.alias ? channelToClose.alias : channelToClose.short_channel_id),
          noBtnText: 'Cancel',
          yesBtnText: 'Force Close'
        }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[3])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(closeChannel({ payload: { id: channelToClose.id!, channelId: channelToClose.channel_id!, force: true } }));
        }
      });
  }

  loadChannelsTable(mychannels) {
    // mychannels.sort((a, b) => ((a.active === b.active) ? 0 : ((b.active) ? 1 : -1)));
    this.channels = new MatTableDataSource<Channel>([...mychannels]);
    this.channels.filterPredicate = (channel: Channel, fltr: string) => {
      const newChannel = ((channel.connected) ? 'connected' : 'disconnected') + (channel.channel_id ? channel.channel_id.toLowerCase() : '') +
        (channel.short_channel_id ? channel.short_channel_id.toLowerCase() : '') + (channel.id ? channel.id.toLowerCase() : '') + (channel.alias ? channel.alias.toLowerCase() : '') +
        (channel.private ? 'private' : 'public') + ((channel.state && this.CLNChannelPendingState[channel.state]) ? this.CLNChannelPendingState[channel.state].toLowerCase() : '') +
        (channel.funding_txid ? channel.funding_txid.toLowerCase() : '') + (channel.msatoshi_to_us ? channel.msatoshi_to_us : '') +
        (channel.msatoshi_total ? channel.msatoshi_total : '') + (channel.their_channel_reserve_satoshis ? channel.their_channel_reserve_satoshis : '') +
        (channel.our_channel_reserve_satoshis ? channel.our_channel_reserve_satoshis : '') + (channel.spendable_msatoshi ? channel.spendable_msatoshi : '');
      return newChannel.includes(fltr);
    };
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'state':
          return this.CLNChannelPendingState[data.state];

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.channels.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.channels.paginator = this.paginator;
    this.logger.info(this.channels);
  }

  onDownloadCSV() {
    if (this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.channels.data, 'Pending-inactive-channels');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
