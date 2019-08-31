import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { Hop } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-query-routes',
  templateUrl: './query-routes.component.html',
  styleUrls: ['./query-routes.component.scss']
})
export class QueryRoutesComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public destinationPubkey = '';
  public amount = null;
  public qrHops: any;
  public flgSticky = false;
  public displayedColumns = [];
  public flgLoading: Array<Boolean | 'error'> = [false]; // 0: peers
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private actions$: Actions) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'fee_msat'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'chan_id', 'fee_msat'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'chan_id', 'chan_capacity', 'amt_to_forward_msat', 'fee_msat'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'chan_id', 'chan_capacity', 'amt_to_forward_msat', 'fee_msat'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'chan_id', 'chan_capacity', 'amt_to_forward_msat', 'fee_msat'];
        break;
    }
  }

  ngOnInit() {
    this.rtlEffects.setQueryRoutes
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(queryRoute => {
      this.qrHops = new MatTableDataSource([]);
      this.qrHops.data = [];
      if (undefined !== queryRoute.routes && undefined !== queryRoute.routes[0].hops) {
        this.flgLoading[0] = false;
        this.qrHops = new MatTableDataSource<Hop>([...queryRoute.routes[0].hops]);
        this.qrHops.data = queryRoute.routes[0].hops;
      } else {
        this.flgLoading[0] = 'error';
      }
      this.qrHops.sort = this.sort;
    });
  }

  onQueryRoutes() {
    this.flgLoading[0] = true;
    this.store.dispatch(new RTLActions.GetQueryRoutes({destPubkey: this.destinationPubkey, amount: this.amount}));
  }

  resetData() {
    this.destinationPubkey = '';
    this.amount = null;
    this.flgLoading[0] = false;
  }

  onHopClick(selRow: Hop, event: any) {
    const selHop = this.qrHops.data.filter(hop => {
      return hop.hop_sequence === selRow.hop_sequence;
    })[0];
    const reorderedHop = JSON.parse(JSON.stringify(selHop, [
      'hop_sequence', 'pubkey_alias', 'pub_key', 'chan_id', 'chan_capacity', 'expiry', 'amt_to_forward', 'amt_to_forward_msat', 'fee_msat'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: { type: 'INFO', message: JSON.stringify(reorderedHop)}}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
