import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Channel, GetInfo } from '../../../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, FEE_RATE_TYPES } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { ECLChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { ECLEffects } from '../../../../store/ecl.effects';
import { RTLEffects } from '../../../../../store/rtl.effects';

import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-channel-inactive-table',
  templateUrl: './channel-inactive-table.component.html',
  styleUrls: ['./channel-inactive-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]  
})
export class ECLChannelInactiveTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  public inactiveChannels: Channel[];
  public totalBalance = 0;
  public displayedColumns = [];
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
      this.displayedColumns = ['state', 'alias', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['state', 'alias', 'toLocal', 'toRemote', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['state', 'alias', 'toLocal', 'toRemote', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['state', 'alias', 'toLocal', 'toRemote', 'actions'];
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
      this.inactiveChannels = rtlStore.inactiveChannels;
      this.loadChannelsTable();
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (rtlStore.inactiveChannels) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    if (this.inactiveChannels.length > 0) {
      this.loadChannelsTable();
    }
  }

  applyFilter() {
    this.channels.filter = this.selFilter;
  }

  onChannelClick(selChannel: Channel, event: any) {
      this.store.dispatch(new RTLActions.OpenAlert({ data: { 
        channel: selChannel,
        channelsType: 'inactive',
        component: ECLChannelInformationComponent
      }}));
    }

  loadChannelsTable() {
    this.inactiveChannels.sort(function(a, b) {
      return (a.alias === b.alias) ? 0 : ((b.alias) ? 1 : -1);
    });
    this.channels = new MatTableDataSource<Channel>([...this.inactiveChannels]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data, sortHeaderId) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.channels.paginator = this.paginator;
    this.logger.info(this.channels);
  }

  onDownloadCSV() {
    if(this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.channels.data, 'InactiveChannels');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
