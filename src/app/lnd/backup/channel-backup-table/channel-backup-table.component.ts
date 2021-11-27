import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faInfoCircle, faExclamationTriangle, faArchive } from '@fortawesome/free-solid-svg-icons';

import { ChannelInformationComponent } from '../../peers-channels/channels/channel-information-modal/channel-information.component';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { Channel, ChannelsSummary, LightningBalance } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, UI_MESSAGES, LNDActions, RTLActions } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { fetchFile, openAlert } from '../../../store/rtl.actions';
import { backupChannels, verifyChannel } from '../../store/lnd.actions';
import { channels, lndNodeSettings } from '../../store/lnd.selector';

@Component({
  selector: 'rtl-channel-backup-table',
  templateUrl: './channel-backup-table.component.html',
  styleUrls: ['./channel-backup-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class ChannelBackupTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public faArchive = faArchive;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public selNode: SelNodeChild = {};
  public displayedColumns = ['channel_point', 'actions'];
  public selectedChannel: Channel;
  public channelsData = [];
  public channels: any;
  public flgSticky = false;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private actions: Actions, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild) => { this.selNode = nodeSettings; });
    this.store.select(channels).pipe(takeUntil(this.unSubs[1])).
      subscribe((channelsSeletor: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.channelsData = channelsSeletor.channels;
        if (this.channelsData.length > 0) {
          this.loadBackupTable(this.channelsData);
        }
        this.logger.info(channelsSeletor);
      });
    this.actions.pipe(takeUntil(this.unSubs[2]), filter((action) => action.type === LNDActions.SET_CHANNELS_LND || action.type === RTLActions.SHOW_FILE)).subscribe((action: any) => {
      if (action.type === LNDActions.SET_CHANNELS_LND) {
        this.selectedChannel = null;
      }
      if (action.type === RTLActions.SHOW_FILE) {
        this.commonService.downloadFile(action.payload, 'channel-' + (this.selectedChannel.channel_point ? this.selectedChannel.channel_point : 'all'), '.bak', '.bak');
        this.selectedChannel = null;
      }
    });
  }

  ngAfterViewInit() {
    if (this.channelsData.length > 0) {
      this.loadBackupTable(this.channelsData);
    }
  }

  onBackupChannels(selChannel: Channel) {
    this.store.dispatch(backupChannels({ payload: { uiMessage: UI_MESSAGES.BACKUP_CHANNEL, channelPoint: (selChannel.channel_point) ? selChannel.channel_point : 'ALL', showMessage: '' } }));
  }

  onVerifyChannels(selChannel: Channel) {
    this.store.dispatch(verifyChannel({ payload: { channelPoint: (selChannel.channel_point) ? selChannel.channel_point : 'ALL' } }));
  }

  onDownloadBackup(selChannel: Channel) {
    this.selectedChannel = selChannel;
    this.store.dispatch(fetchFile({ payload: { channelPoint: selChannel.channel_point ? selChannel.channel_point : 'all' } }));
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: selChannel,
          showCopy: false,
          component: ChannelInformationComponent
        }
      }
    }));
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  loadBackupTable(channels: any[]) {
    this.channels = channels ? new MatTableDataSource<Channel>([...channels]) : new MatTableDataSource([]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.channels.paginator = this.paginator;
    this.channels.filterPredicate = (channel: Channel, fltr: string) => {
      const newChannel = ((channel.active) ? 'active' : 'inactive') + (channel.channel_point ? channel.channel_point.toLowerCase() : '') + (channel.chan_id ? channel.chan_id.toLowerCase() : '') +
        (channel.remote_pubkey ? channel.remote_pubkey.toLowerCase() : '') + (channel.remote_alias ? channel.remote_alias.toLowerCase() : '') +
        (channel.capacity ? channel.capacity : '') + (channel.local_balance ? channel.local_balance : '') +
        (channel.remote_balance ? channel.remote_balance : '') + (channel.total_satoshis_sent ? channel.total_satoshis_sent : '') +
        (channel.total_satoshis_received ? channel.total_satoshis_received : '') + (channel.commit_fee ? channel.commit_fee : '') +
        (channel.private ? 'private' : 'public');
      return newChannel.includes(fltr);
    };
    this.applyFilter();
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
