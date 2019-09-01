import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { ForwardingEvent, RoutingPeers } from '../../shared/models/lndModels';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-routing-peers',
  templateUrl: './routing-peers.component.html',
  styleUrls: ['./routing-peers.component.scss']
})
export class RoutingPeersComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sortIn: MatSort;
  @ViewChild('tableOut', {read: MatSort, static: true}) sortOut: MatSort;
  public displayedColumns = [];
  public RoutingPeersIncoming: any;
  public RoutingPeersOutgoing: any;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public today = new Date(Date.now());
  public lastMonthDay = new Date(
    this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 30,
    this.today.getHours(), this.today.getMinutes(), this.today.getSeconds()
  );
  public yesterday = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1, this.today.getHours(), this.today.getMinutes(), this.today.getSeconds());
  public endDate = this.today;
  public startDate = this.lastMonthDay;
  public flgSticky = false;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['chan_id', 'events', 'total_amount'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['chan_id', 'alias', 'events', 'total_amount'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['chan_id', 'alias', 'events', 'total_amount'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['chan_id', 'alias', 'events', 'total_amount'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['chan_id', 'alias', 'events', 'total_amount'];
        break;
    }
  }

  ngOnInit() {
    this.onRoutingPeersFetch();
    this.actions$.pipe(takeUntil(this.unsub[2]), filter((action) => action.type === RTLActions.RESET_LND_STORE)).subscribe((resetLndStore: RTLActions.ResetLNDStore) => {
      this.onRoutingPeersFetch();
    });
    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'GetForwardingHistory') {
          this.flgLoading[0] = 'error';
        }
      });
      if (undefined !== rtlStore.forwardingHistory && undefined !== rtlStore.forwardingHistory.forwarding_events) {
        this.loadRoutingPeersTable(rtlStore.forwardingHistory.forwarding_events);
      } else {
        // To reset table after other Forwarding history calls
        this.loadRoutingPeersTable([]);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== rtlStore.forwardingHistory) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onRoutingPeerClick(selRow: RoutingPeers, event: any, direction: string) {
    let selRPeer = {};
    if (direction === 'in') {
      selRPeer = this.RoutingPeersIncoming.data.find(rPeer => {
        return rPeer.chan_id === selRow.chan_id;
      });
    } else {
      selRPeer = this.RoutingPeersOutgoing.data.find(rPeer => {
        return rPeer.chan_id === selRow.chan_id;
      });
    }
    const reorderedRoutingPeer = JSON.parse(JSON.stringify(selRPeer, ['chan_id', 'alias', 'events', 'total_amount'] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedRoutingPeer)
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

  onRoutingPeersFetch() {
    if (undefined === this.endDate || this.endDate == null) {
      this.endDate = new Date();
    }
    if (undefined === this.startDate || this.startDate == null) {
      this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() - 30);
    }
    this.store.dispatch(new RTLActions.GetForwardingHistory({
      end_time: Math.round(this.endDate.getTime() / 1000).toString(),
      start_time: Math.round(this.startDate.getTime() / 1000).toString()
    }));
  }

  resetData() {
    this.endDate = new Date();
    this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() - 1);
    if (undefined !== this.RoutingPeersIncoming) {
      this.RoutingPeersIncoming.data = [];
    }
    if (undefined !== this.RoutingPeersOutgoing) {
      this.RoutingPeersOutgoing.data = [];
    }
  }

  ngOnDestroy() {
    this.resetData();
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
