import { Component, OnInit, OnChanges, ViewChild, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PaymentRelayed, RoutingPeers } from '../../../shared/models/eclModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as fromRTLReducer from '../../../store/rtl.reducers';
import { ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-ecl-routing-peers',
  templateUrl: './routing-peers.component.html',
  styleUrls: ['./routing-peers.component.scss']
})
export class ECLRoutingPeersComponent implements OnInit, OnChanges {
  @ViewChild(MatSort, { static: true }) sortIn: MatSort;
  @ViewChild('tableOut', {read: MatSort, static: true}) sortOut: MatSort;
  @Input() routingPeersData: any;
  public displayedColumns = [];
  public RoutingPeersIncoming: any;
  public RoutingPeersOutgoing: any;
  public flgSticky = false;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'totalFee'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'events', 'totalFee'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'events', 'totalAmount', 'totalFee'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['channelId', 'alias', 'events', 'totalAmount', 'totalFee'];
    }
  }

  ngOnInit() {}

  ngOnChanges() {
    this.loadRoutingPeersTable(this.routingPeersData);
  }

  loadRoutingPeersTable(forwardingEvents: PaymentRelayed[]) {
    if (forwardingEvents.length > 0) {
      const results = this.groupRoutingPeers(forwardingEvents);
      this.RoutingPeersIncoming = new MatTableDataSource<RoutingPeers>(results[0]);
      this.RoutingPeersIncoming.sort = this.sortIn;
      this.logger.info(this.RoutingPeersIncoming);
      this.RoutingPeersOutgoing = new MatTableDataSource<RoutingPeers>(results[1]);
      this.RoutingPeersOutgoing.sort = this.sortOut;
      this.logger.info(this.RoutingPeersOutgoing);
    } else {
       // To reset table after other Forwarding history calls
      this.RoutingPeersIncoming = new MatTableDataSource<RoutingPeers>([]);
      this.RoutingPeersOutgoing = new MatTableDataSource<RoutingPeers>([]);
    }
  }

  groupRoutingPeers(forwardingEvents: PaymentRelayed[]) {
    const incomingResults: RoutingPeers[] = [];
    const outgoingResults: RoutingPeers[] = [];
    forwardingEvents.forEach(event => {
      const incoming = incomingResults.find(result => result.channelId === event.fromChannelId);
      const outgoing = outgoingResults.find(result => result.channelId === event.toChannelId);
      if (!incoming) {
        incomingResults.push({channelId: event.fromChannelId, alias: event.fromChannelAlias, events: 1, totalAmount: +event.amountIn, totalFee: (event.amountIn - event.amountOut)});
      } else {
        incoming.events++;
        incoming.totalAmount = +incoming.totalAmount + +event.amountIn;
        incoming.totalFee = +incoming.totalFee + (event.amountIn - event.amountOut);
      }
      if (!outgoing) {
        outgoingResults.push({channelId: event.toChannelId, alias: event.toChannelAlias, events: 1, totalAmount: +event.amountOut, totalFee: (event.amountIn - event.amountOut)});
      } else {
        outgoing.events++;
        outgoing.totalAmount = +outgoing.totalAmount + +event.amountOut;
        outgoing.totalFee = +outgoing.totalFee + (event.amountIn - event.amountOut);
      }
    });
    return [this.commonService.sortDescByKey(incomingResults, 'totalFee'), this.commonService.sortDescByKey(outgoingResults, 'totalFee')];
  }

  applyIncomingFilter(selFilter: string) {
    this.RoutingPeersIncoming.filter = selFilter;
  }

  applyOutgoingFilter(selFilter: string) {
    this.RoutingPeersOutgoing.filter = selFilter;
  }

}
