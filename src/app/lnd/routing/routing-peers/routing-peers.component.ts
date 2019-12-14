import { Component, OnInit, OnChanges, ViewChild, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { ForwardingEvent, RoutingPeers } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-routing-peers',
  templateUrl: './routing-peers.component.html',
  styleUrls: ['./routing-peers.component.scss']
})
export class RoutingPeersComponent implements OnInit, OnChanges {
  @ViewChild(MatSort, { static: true }) sortIn: MatSort;
  @ViewChild(MatSort, { static: true }) sortOut: MatSort;
  @Input() routingPeersData: any;
  public displayedColumns = [];
  public displayIncomingHeader = ['incoming'];
  public displayOutgoingHeader = ['outgoing'];
  public RoutingPeersIncoming: any;
  public RoutingPeersOutgoing: any;
  public flgSticky = false;

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    let ss = this.commonService.getScreenSize();
    if(ss === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['chan_id', 'events', 'actions'];
    } else if(ss === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['chan_id', 'events', 'total_amount', 'actions'];
    } else if(ss === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['chan_id', 'alias', 'events', 'total_amount', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['chan_id', 'alias', 'events', 'total_amount', 'actions'];
    }
  }

  ngOnInit() {}

  ngOnChanges() {
    this.loadRoutingPeersTable(this.routingPeersData);
  }

  onRoutingPeerClick(selRow: RoutingPeers, event: any, direction: string) {
    let selRPeer: RoutingPeers = {};
    let alertTitle = ' Routing Information';
    if (direction === 'in') {
      alertTitle = 'Incoming' + alertTitle;
      selRPeer = this.RoutingPeersIncoming.data.find(rPeer => {
        return rPeer.chan_id === selRow.chan_id;
      });
    } else {
      alertTitle = 'Outgoing' + alertTitle;
      selRPeer = this.RoutingPeersOutgoing.data.find(rPeer => {
        return rPeer.chan_id === selRow.chan_id;
      });
    }
    const reorderedRoutingPeer = [
      [{key: 'chan_id', value: selRPeer.chan_id, title: 'Channel ID', width: 50, type: DataTypeEnum.STRING},
        {key: 'alias', value: selRPeer.alias, title: 'Peer Alias', width: 50, type: DataTypeEnum.STRING}],
      [{key: 'events', value: selRPeer.events, title: 'Events', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'total_amount', value: selRPeer.total_amount, title: 'Total Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: alertTitle,
      message: reorderedRoutingPeer
    }}));
  }

  loadRoutingPeersTable(forwardingEvents: ForwardingEvent[]) {
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

  groupRoutingPeers(forwardingEvents: ForwardingEvent[]) {
    const incomingResults = [];
    const outgoingResults = [];
    forwardingEvents.forEach(event => {
      const incoming = incomingResults.find(result => result.chan_id === event.chan_id_in);
      const outgoing = outgoingResults.find(result => result.chan_id === event.chan_id_out);
      if (undefined === incoming) {
        incomingResults.push({chan_id: event.chan_id_in, alias: event.alias_in, events: 1, total_amount: +event.amt_in});
      } else {
        incoming.events++;
        incoming.total_amount = +incoming.total_amount + +event.amt_in;
      }
      if (undefined === outgoing) {
        outgoingResults.push({chan_id: event.chan_id_out, alias: event.alias_out, events: 1, total_amount: +event.amt_out});
      } else {
        outgoing.events++;
        outgoing.total_amount = +outgoing.total_amount + +event.amt_out;
      }
    });
    return [this.commonService.sortDescByKey(incomingResults, 'total_amount'), this.commonService.sortDescByKey(outgoingResults, 'total_amount')];
  }

}
