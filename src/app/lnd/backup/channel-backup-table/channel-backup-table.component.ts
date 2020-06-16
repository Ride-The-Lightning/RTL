import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
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
import { Channel } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as LNDActions from '../../store/lnd.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-backup-table',
  templateUrl: './channel-backup-table.component.html',
  styleUrls: ['./channel-backup-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]  
})
export class ChannelBackupTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public faArchive = faArchive;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public selNode: SelNodeChild = {};
  public displayedColumns = ['channel_point', 'actions'];
  public selChannel: Channel;
  public channels: any;
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: channels
  public flgSticky = false;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'Fetchchannels') {
          this.flgLoading[0] = 'error';
        }
      });
      this.channels = new MatTableDataSource([]);
      this.channels.data = [];
      if ( rtlStore.allChannels) {
        this.channels = new MatTableDataSource<Channel>([...rtlStore.allChannels]);
        this.channels.data = rtlStore.allChannels;
      }
      this.channels.sort = this.sort;
      this.channels.paginator = this.paginator;
      this.channels.filterPredicate = (channel: Channel, fltr: string) => {
        const newChannel = ((channel.active) ? 'active' : 'inactive') + (channel.channel_point ? channel.channel_point : '') + (channel.chan_id ? channel.chan_id : '') +
        (channel.remote_pubkey ? channel.remote_pubkey : '') + (channel.remote_alias ? channel.remote_alias : '') +
        (channel.capacity ? channel.capacity : '') + (channel.local_balance ? channel.local_balance : '') +
        (channel.remote_balance ? channel.remote_balance : '') + (channel.total_satoshis_sent ? channel.total_satoshis_sent : '') +
        (channel.total_satoshis_received ? channel.total_satoshis_received : '') + (channel.commit_fee ? channel.commit_fee : '') +
        (channel.private ? 'private' : 'public');
        return newChannel.includes(fltr);
      };
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = false;
      }
      this.logger.info(rtlStore);
    });
    this.actions$
    .pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === LNDActions.SET_ALL_CHANNELS)
    ).subscribe((setchannels: LNDActions.SetAllChannels) => {
      this.selChannel = undefined;
    });
  }

  onBackupChannels(selChannel: Channel) {
    this.store.dispatch(new RTLActions.OpenSpinner('Backup Channels...'));
    this.store.dispatch(new LNDActions.BackupChannels({channelPoint: (selChannel.channel_point) ? selChannel.channel_point : 'ALL', showMessage: ''}));
  }

  onVerifyChannels(selChannel: Channel) {
    this.store.dispatch(new RTLActions.OpenSpinner('Verify Channels...'));
    this.store.dispatch(new LNDActions.VerifyChannels({channelPoint: (selChannel.channel_point) ? selChannel.channel_point : 'ALL'}));
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      channel: selChannel,
      showCopy: false,
      component: ChannelInformationComponent
    }}));
  }

  applyFilter(selFilter: string) {
    this.channels.filter = selFilter;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
