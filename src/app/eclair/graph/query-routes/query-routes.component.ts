import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faRoute, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { MatTableDataSource } from '@angular/material/table';

import { AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { QueryRoutes, RouteNode } from '../../../shared/models/eclModels';
import { CommonService } from '../../../shared/services/common.service';

import { ECLEffects } from '../../store/ecl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getQueryRoutes } from '../../store/ecl.actions';

@Component({
  selector: 'rtl-ecl-query-routes',
  templateUrl: './query-routes.component.html',
  styleUrls: ['./query-routes.component.scss']
})
export class ECLQueryRoutesComponent implements OnInit, OnDestroy {

  @ViewChild('queryRoutesForm', { static: true }) form: any;
  public allQRoutes = [];
  public nodeId = '';
  public amount = 0;
  public qrHops: Array<any> = [];
  public flgSticky = false;
  public displayedColumns: any;
  public flgLoading: Array<Boolean | 'error'> = [false]; // 0: peers
  public faRoute = faRoute;
  public faExclamationTriangle = faExclamationTriangle;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private eclEffects: ECLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'nodeId', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'nodeId', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'nodeId', 'actions'];
    }
  }

  ngOnInit() {
    this.qrHops[0] = new MatTableDataSource([]);
    this.qrHops[0].data = [];
    this.eclEffects.setQueryRoutes.pipe(takeUntil(this.unSubs[1])).subscribe((queryRoute: any) => {
      if (queryRoute && queryRoute.routes && queryRoute.routes.length) {
        this.flgLoading[0] = false;
        this.allQRoutes = queryRoute.routes;
        this.allQRoutes.forEach((route, i) => {
          this.qrHops[i] = new MatTableDataSource<QueryRoutes>([...route.nodeIds]);
        });
      } else {
        this.flgLoading[0] = 'error';
        this.allQRoutes = [];
        this.qrHops = [];
      }
    });
  }

  onQueryRoutes(): boolean | void {
    if (!this.nodeId || !this.amount) {
      return true;
    }
    this.qrHops = [];
    this.flgLoading[0] = true;
    this.store.dispatch(getQueryRoutes({ payload: { nodeId: this.nodeId, amount: this.amount * 1000 } }));
  }

  resetData() {
    this.allQRoutes = [];
    this.nodeId = '';
    this.amount = 0;
    this.flgLoading[0] = false;
    this.qrHops = [];
    this.form.resetForm();
  }

  onHopClick(selHop: RouteNode) {
    const reorderedHop = [
      [{ key: 'alias', value: selHop.alias, title: 'Alias', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'nodeId', value: selHop.nodeId, title: 'Node ID', width: 100, type: DataTypeEnum.STRING }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Route Information',
          message: reorderedHop
        }
      }
    }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
