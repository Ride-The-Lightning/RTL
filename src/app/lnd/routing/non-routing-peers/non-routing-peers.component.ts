import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';

import { ForwardingEvent, SwitchRes, Channel, ChannelsSummary, LightningBalance } from '../../../shared/models/lndModels';
import { APICallStatusEnum, getPaginatorLabel, PAGE_SIZE, PAGE_SIZE_OPTIONS, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { RTLState } from '../../../store/rtl.state';
import { channels, forwardingHistory } from '../../store/lnd.selector';
import { ActivatedRoute, Router } from '@angular/router';

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
  public routingPeersData = [];
  public displayedColumns: any[] = [];
  public NonRoutingPeers = new MatTableDataSource<any>([]);
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public filter = '';
  public activeChannels: Channel[] = [];
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private router: Router, private activatedRoute: ActivatedRoute) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['remote_alias', 'local_balance', 'remote_balance', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['remote_alias', 'local_balance', 'remote_balance', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['chan_id', 'remote_alias', 'local_balance', 'remote_balance', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['chan_id', 'remote_alias', 'total_satoshis_received', 'total_satoshis_sent', 'local_balance', 'remote_balance', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[0])).
      subscribe((fhSelector: { forwardingHistory: SwitchRes, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = fhSelector.apiCallStatus;
        if (fhSelector.apiCallStatus?.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (fhSelector.forwardingHistory.forwarding_events) {
          this.routingPeersData = fhSelector.forwardingHistory.forwarding_events;
        } else {
          this.routingPeersData = [];
        }
        if (this.routingPeersData.length > 0 && this.sort && this.paginator) {
          this.loadNonRoutingPeersTable(this.routingPeersData);
        }
        this.logger.info(fhSelector.apiCallStatus);
        this.logger.info(fhSelector.forwardingHistory);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[1])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
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
      const filteredNonRoutingChannels = this.activeChannels.filter((actvChnl) => forwardingEvents.findIndex((evnt) => (evnt.chan_id_in === actvChnl.chan_id || evnt.chan_id_out === actvChnl.chan_id)) < 0);
      this.NonRoutingPeers = new MatTableDataSource<Channel>(filteredNonRoutingChannels);
      this.NonRoutingPeers.sort = this.sort;
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
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
