import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';

import { ForwardingEvent, SwitchRes, Channel, ChannelsSummary, LightningBalance } from '../../../shared/models/lndModels';
import { APICallStatusEnum, getPaginatorLabel, LND_DEFAULT_PAGE_SETTINGS, PAGE_SIZE, PAGE_SIZE_OPTIONS, ScreenSizeEnum, SortOrderEnum } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { RTLState } from '../../../store/rtl.state';
import { channels, forwardingHistory, lndPageSettings } from '../../store/lnd.selector';
import { ActivatedRoute, Router } from '@angular/router';
import { PageSettings, TableSetting } from '../../../shared/models/pageSettings';

@Component({
  selector: 'rtl-non-routing-peers',
  templateUrl: './non-routing-peers.component.html',
  styleUrls: ['./non-routing-peers.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Non routing peers') }
  ]
})
export class NonRoutingPeersComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public PAGE_ID = 'routing';
  public tableSetting: TableSetting = { tableId: 'non_routing_peers', recordsPerPage: PAGE_SIZE, sortBy: 'remote_alias', sortOrder: SortOrderEnum.DESCENDING };
  public routingPeersData: any[] = [];
  public displayedColumns: any[] = [];
  public NonRoutingPeers: any = new MatTableDataSource<any>([]);
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public filter = '';
  public activeChannels: Channel[] = [];
  public timeUnit = 'mins:secs';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private router: Router, private activatedRoute: ActivatedRoute, private decimalPipe: DecimalPipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.logger.info(this.displayedColumns);
      });
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[1])).
      subscribe((fhSelector: { forwardingHistory: SwitchRes, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = fhSelector.apiCallStatus;
        if (fhSelector.apiCallStatus?.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (fhSelector.forwardingHistory.forwarding_events) {
          this.routingPeersData = fhSelector.forwardingHistory.forwarding_events;
        } else {
          this.routingPeersData = [];
        }
        if (this.routingPeersData.length > 0 && this.sort && this.paginator && this.displayedColumns.length > 0)  {
          this.loadNonRoutingPeersTable(this.routingPeersData);
        }
        this.logger.info(fhSelector.apiCallStatus);
        this.logger.info(fhSelector.forwardingHistory);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[2])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.activeChannels = channelsSelector.channels;
        this.logger.info(channelsSelector);
      });
  }

  ngAfterViewInit() {
    if (this.routingPeersData.length > 0) {
      this.loadNonRoutingPeersTable(this.routingPeersData);
    }
  }

  calculateUptime(channels: Channel[]) {
    const minutesDivider = 60;
    const hoursDivider = minutesDivider * 60;
    const daysDivider = hoursDivider * 24;
    const yearsDivider = daysDivider * 365;
    let maxDivider = minutesDivider;
    let minDivider = 1;
    let max_uptime = 0;
    channels.forEach((channel) => {
      if (channel.uptime && +channel.uptime > max_uptime) {
        max_uptime = +channel.uptime;
      }
    });
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
    channels.forEach((channel) => {
      channel.uptime_str = channel.uptime ? (this.decimalPipe.transform(Math.floor(+channel.uptime / maxDivider), '2.0-0') + ':' + this.decimalPipe.transform(Math.round((+channel.uptime % maxDivider) / minDivider), '2.0-0')) : '---';
      channel.lifetime_str = channel.lifetime ? (this.decimalPipe.transform(Math.floor(+channel.lifetime / maxDivider), '2.0-0') + ':' + this.decimalPipe.transform(Math.round((+channel.lifetime % maxDivider) / minDivider), '2.0-0')) : '---';
    });
    return channels;
  }

  onManagePeer(selNonRoutingChannel: Channel) {
    this.router.navigate(['../../', 'connections', 'channels', 'open'], { relativeTo: this.activatedRoute, state: { filter: selNonRoutingChannel.chan_id } });
  }

  // groupRoutingPeers(forwardingEvents: ForwardingEvent[]) {
  //   const results: any[] = [];
  //   forwardingEvents.forEach((event: ForwardingEvent) => {
  //     const foundEntryInIdx = results.findIndex((result) => result.chan_id === event.chan_id_in);
  //     const foundEntryOutIdx = results.findIndex((result) => result.chan_id === event.chan_id_out);
  //     if (foundEntryInIdx < 0 && foundEntryOutIdx < 0) {
  //       results.push({ chan_id: event.chan_id_in, alias: event.alias_in, amt_in_msat: +event.amt_in_msat, amt_out_msat: 0 });
  //       results.push({ chan_id: event.chan_id_out, alias: event.alias_out, amt_out_msat: +event.amt_out_msat, amt_in_msat: 0 });
  //     }
  //     if (foundEntryInIdx < 0 && foundEntryOutIdx > -1) {
  //       results.push({ chan_id: event.chan_id_in, alias: event.alias_in, amt_in_msat: +event.amt_in_msat, amt_out_msat: 0 });
  //       results[foundEntryOutIdx].amt_out_msat = results[foundEntryOutIdx].amt_out_msat + +event.amt_out_msat;
  //     }
  //     if (foundEntryInIdx > -1 && foundEntryOutIdx < 0) {
  //       results.push({ chan_id: event.chan_id_out, alias: event.alias_out, amt_out_msat: +event.amt_out_msat, amt_in_msat: 0 });
  //       results[foundEntryInIdx].amt_in_msat = results[foundEntryInIdx].amt_in_msat + +event.amt_in_msat;
  //     }
  //     if (foundEntryInIdx > -1 && foundEntryOutIdx > -1) {
  //       results[foundEntryInIdx].amt_in_msat = results[foundEntryInIdx].amt_in_msat + +event.amt_in_msat;
  //       results[foundEntryOutIdx].amt_out_msat = results[foundEntryOutIdx].amt_out_msat + +event.amt_out_msat;
  //     }
  //   });
  //   return this.commonService.sortDescByKey(results, 'alias');
  // }

  loadNonRoutingPeersTable(forwardingEvents: ForwardingEvent[]) {
    if (forwardingEvents.length > 0) {
      // const grpdRoutingPeers = this.groupRoutingPeers(forwardingEvents);
      const filteredNonRoutingChannels = this.calculateUptime(this.activeChannels?.filter((actvChnl) => forwardingEvents.findIndex((evnt) => (evnt.chan_id_in === actvChnl.chan_id || evnt.chan_id_out === actvChnl.chan_id)) < 0));
      this.NonRoutingPeers = new MatTableDataSource<Channel>(filteredNonRoutingChannels);
      this.NonRoutingPeers.sort = this.sort;
      this.NonRoutingPeers.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
      this.NonRoutingPeers.filterPredicate = (nrchnl: Channel, fltr: string) => JSON.stringify(nrchnl).toLowerCase().includes(fltr);
      this.NonRoutingPeers.paginator = this.paginator;
      this.logger.info(this.NonRoutingPeers);
    } else {
      this.NonRoutingPeers = new MatTableDataSource<Channel>([]);
    }
    this.applyFilter();
  }

  applyFilter() {
    this.NonRoutingPeers.filter = this.filter.toLowerCase();
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
