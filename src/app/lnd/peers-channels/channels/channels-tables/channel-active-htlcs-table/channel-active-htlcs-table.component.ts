import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { Channel, ChannelHTLC, ChannelsSummary, LightningBalance } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum } from '../../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { openAlert } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { channels } from '../../../../store/lnd.selector';

@Component({
  selector: 'rtl-channel-active-htlcs-table',
  templateUrl: './channel-active-htlcs-table.component.html',
  styleUrls: ['./channel-active-htlcs-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('HTLCs') }
  ]
})
export class ChannelActiveHTLCsTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public channels: any;
  public channelsJSONArr: Channel[] = [];
  public displayedColumns: any[] = [];
  public htlcColumns = [];
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['amount', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['amount', 'incoming', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['amount', 'incoming', 'expiration_height', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['amount', 'incoming', 'expiration_height', 'hash_lock', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(channels).pipe(takeUntil(this.unSubs[0])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.channelsJSONArr = channelsSelector.channels.filter((channel) => channel.pending_htlcs && channel.pending_htlcs.length > 0) || [];
        this.loadHTLCsTable(this.channelsJSONArr);
        this.logger.info(channelsSelector);
      });
  }

  ngAfterViewInit() {
    this.loadHTLCsTable(this.channelsJSONArr);
  }

  onHTLCClick(selHtlc: ChannelHTLC, selChannel: Channel) {
    const reorderedHTLC = [
      [{ key: 'remote_alias', value: selChannel.remote_alias, title: 'Alias', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'amount', value: selHtlc.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'incoming', value: (selHtlc.incoming ? 'Yes' : 'No'), title: 'Incoming', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'expiration_height', value: selHtlc.expiration_height, title: 'Expiration Height', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'hash_lock', value: selHtlc.hash_lock, title: 'Hash Lock', width: 50, type: DataTypeEnum.STRING }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'HTLC Information',
          message: reorderedHTLC
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
          component: ChannelInformationComponent
        }
      }
    }));
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  loadHTLCsTable(channels: Channel[]) {
    this.channels = (channels) ? new MatTableDataSource<Channel>([...channels]) : new MatTableDataSource([]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'amount':
          this.commonService.sortByKey(data.pending_htlcs, sortHeaderId, 'number', this.sort.direction);
          return data.pending_htlcs && data.pending_htlcs.length ? data.pending_htlcs.length : null;

        case 'incoming':
          this.commonService.sortByKey(data.pending_htlcs, sortHeaderId, 'boolean', this.sort.direction);
          return data.remote_alias ? data.remote_alias : data.remote_pubkey ? data.remote_pubkey : null;

        case 'expiration_height':
          this.commonService.sortByKey(data.pending_htlcs, sortHeaderId, 'number', this.sort.direction);
          return data;

        case 'hash_lock':
          this.commonService.sortByKey(data.pending_htlcs, sortHeaderId, 'number', this.sort.direction);
          return data;

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.channels.paginator = this.paginator;
    this.channels.filterPredicate = (channel: Channel, fltr: string) => {
      const newChannel = (channel.remote_alias ? channel.remote_alias.toLowerCase() : '') +
        channel.pending_htlcs.map((htlc) => JSON.stringify(htlc) + (htlc.incoming ? 'yes' : 'no'));
      return newChannel.includes(fltr);
    };
    this.applyFilter();
  }

  onDownloadCSV() {
    if (this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.flattenHTLCs(), 'ActiveHTLCs');
    }
  }

  flattenHTLCs() {
    const channelsDataCopy = JSON.parse(JSON.stringify(this.channels.data));
    const flattenedHTLCs = channelsDataCopy.reduce((acc, curr) => {
      if (curr.pending_htlcs) {
        return acc.concat(curr.pending_htlcs);
      } else {
        return acc.concat(curr);
      }
    }, []);
    return flattenedHTLCs;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
