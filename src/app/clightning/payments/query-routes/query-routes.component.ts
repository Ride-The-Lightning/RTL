import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { RoutesCL } from '../../../shared/models/clModels';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLEffects } from '../../store/cl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-query-routes',
  templateUrl: './query-routes.component.html',
  styleUrls: ['./query-routes.component.scss']
})
export class CLQueryRoutesComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public destinationPubkey = '';
  public amount = null;
  public qRoutes: any;
  public flgSticky = false;
  public displayedColumns = [];
  public flgLoading: Array<Boolean | 'error'> = [false]; // 0: peers
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private clEffects: CLEffects, private actions$: Actions) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['alias', 'direction', 'msatoshi', 'delay'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['alias', 'channel', 'direction', 'msatoshi', 'delay'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['id', 'alias', 'channel', 'direction', 'msatoshi', 'amount_msat', 'delay'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['id', 'alias', 'channel', 'direction', 'msatoshi', 'amount_msat', 'delay'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['id', 'alias', 'channel', 'direction', 'msatoshi', 'amount_msat', 'delay'];
        break;
    }
  }

  ngOnInit() {
    this.clEffects.setQueryRoutesCL
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(queryRoute => {
      this.qRoutes = new MatTableDataSource([]);
      this.qRoutes.data = [];
      if (undefined !== queryRoute && undefined !== queryRoute.routes) {
        this.flgLoading[0] = false;
        this.qRoutes = new MatTableDataSource<RoutesCL>([...queryRoute.routes]);
        this.qRoutes.data = queryRoute.routes;
      } else {
        this.flgLoading[0] = 'error';
      }
      this.qRoutes.sort = this.sort;
    });
  }

  onQueryRoutes() {
    this.flgLoading[0] = true;
    this.store.dispatch(new RTLActions.GetQueryRoutesCL({destPubkey: this.destinationPubkey, amount: this.amount}));
  }

  resetData() {
    this.destinationPubkey = '';
    this.amount = null;
    this.flgLoading[0] = false;
  }

  onRouteClick(selRow: RoutesCL, event: any) {
    const selRoute = this.qRoutes.data.filter(route => {
      return route.id === route.id;
    })[0];
    const reorderedRoute = JSON.parse(JSON.stringify(selRoute, [
      'id', 'alias', 'channel', 'direction', 'msatoshi', 'amount_msat', 'delay'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ config: { width: '75%', data: { type: 'INFO', message: JSON.stringify(reorderedRoute)}}}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
