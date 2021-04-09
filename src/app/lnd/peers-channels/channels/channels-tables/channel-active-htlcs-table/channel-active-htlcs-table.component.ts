import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { Channel, ChannelHTLC } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-active-htlcs-table',
  templateUrl: './channel-active-htlcs-table.component.html',
  styleUrls: ['./channel-active-htlcs-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('HTLCs') }
  ]  
})
export class ChannelActiveHTLCsTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public channels: any;
  public channelsJSONArr: Channel[] = [];
  public displayedColumns: any[] = [];
  public htlcColumns = [];
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['amount', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['amount', 'incoming', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['amount', 'incoming', 'expiration_height', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['amount', 'incoming', 'expiration_height', 'hash_lock', 'actions'];
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
      this.channelsJSONArr = (rtlStore.allChannels && rtlStore.allChannels.length > 0) ? rtlStore.allChannels.filter(channel => channel.pending_htlcs && channel.pending_htlcs.length > 0) : [];
      this.loadHTLCsTable(this.channelsJSONArr);
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( this.channelsJSONArr) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    this.loadHTLCsTable(this.channelsJSONArr);
  }

  onHTLCClick(selHtlc: ChannelHTLC, selChannel: Channel) {
    const reorderedHTLC = [
      [{key: 'remote_alias', value: selChannel.remote_alias, title: 'Alias', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'amount', value: selHtlc.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'incoming', value: (selHtlc.incoming ? 'Yes' : 'No'), title: 'Incoming', width: 50, type: DataTypeEnum.STRING}],
      [{key: 'expiration_height', value: selHtlc.expiration_height, title: 'Expiration Height', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'hash_lock', value: selHtlc.hash_lock, title: 'Hash Lock', width: 50, type: DataTypeEnum.STRING}],
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'HTLC Information',
      message: reorderedHTLC
    }}));
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      channel: selChannel,
      showCopy: true,
      component: ChannelInformationComponent
    }}));
  }

  applyFilter(selFilter: any) {
    this.channels.filter = selFilter.value.trim().toLowerCase();
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
        channel.pending_htlcs.map(htlc => JSON.stringify(htlc) + (htlc.incoming ? 'yes' : 'no'));
      return newChannel.includes(fltr);
    };    
  }

  onDownloadCSV() {
    if(this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.flattenHTLCs(), 'ActiveHTLCs');
    }
  }

  flattenHTLCs() {
    let channelsDataCopy = JSON.parse(JSON.stringify(this.channels.data));
    let flattenedHTLCs = channelsDataCopy.reduce((acc, curr) => {
      if (curr.pending_htlcs) {
        return acc.concat(curr.pending_htlcs);
      } else {
        return acc.concat(curr);
      }
    }, []);
    return flattenedHTLCs;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
