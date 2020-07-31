import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faRoute, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { CommonService } from '../../../shared/services/common.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Route } from '../../../shared/models/eclModels';

import { AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { ECLEffects } from '../../store/ecl.effects';
import * as ECLActions from '../../store/ecl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-query-routes',
  templateUrl: './query-routes.component.html',
  styleUrls: ['./query-routes.component.scss']
})
export class ECLQueryRoutesComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('queryRoutesForm', { static: false }) form: any;  
  public nodeId = '';
  public amount = null;
  public qrHops: any;
  public flgSticky = false;
  public displayedColumns = [];
  public flgLoading: Array<Boolean | 'error'> = [false]; // 0: peers
  public faRoute = faRoute;
  public faExclamationTriangle = faExclamationTriangle;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private eclEffects: ECLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'nodeId', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'nodeId', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'nodeId', 'actions'];
    }
  }

  ngOnInit() {
    this.qrHops = new MatTableDataSource([]);
    this.eclEffects.setQueryRoutes
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(queryRoute => {
      this.qrHops.data = [];
      if (queryRoute) {
        this.flgLoading[0] = false;
        this.qrHops = new MatTableDataSource<Route>([...queryRoute]);
        this.qrHops.data = queryRoute;
      } else {
        this.flgLoading[0] = 'error';
      }
      this.qrHops.sort = this.sort;
    });
  }

  onQueryRoutes() {
    if(!this.nodeId || !this.amount) { return true; }
    this.qrHops.data = [];
    this.flgLoading[0] = true;
    this.store.dispatch(new ECLActions.GetQueryRoutes({nodeId: this.nodeId, amount: this.amount*1000}));
  }

  resetData() {
    this.nodeId = '';
    this.amount = null;
    this.flgLoading[0] = false;
    this.qrHops.data = [];
    this.form.resetForm();
  }

  onHopClick(selHop: Route, event: any) {
    const reorderedHop = [
      [{key: 'alias', value: selHop.alias, title: 'Alias', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'nodeId', value: selHop.nodeId, title: 'Node ID', width: 100, type: DataTypeEnum.STRING}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Route Information',
      message: reorderedHop
    }}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
