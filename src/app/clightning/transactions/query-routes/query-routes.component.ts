import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faRoute, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { CommonService } from '../../../shared/services/common.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Routes } from '../../../shared/models/clModels';

import { CLEffects } from '../../store/cl.effects';
import * as CLActions from '../../store/cl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-cl-query-routes',
  templateUrl: './query-routes.component.html',
  styleUrls: ['./query-routes.component.scss']
})
export class CLQueryRoutesComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild('queryRoutesForm', { static: true }) form: any;  
  public destinationPubkey = '';
  public amount:number = null;
  public qrHops: any;
  public flgSticky = false;
  public displayedColumns: any[] = [];
  public flgLoading: Array<Boolean | 'error'> = [false]; // 0: peers
  public faRoute = faRoute;
  public faExclamationTriangle = faExclamationTriangle;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private clEffects: CLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'msatoshi', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'direction', 'msatoshi', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'direction', 'delay', 'msatoshi', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'channel', 'direction', 'delay', 'msatoshi', 'actions'];
    }
  }

  ngOnInit() {
    this.clEffects.setQueryRoutesCL
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(queryRoute => {
      this.qrHops = new MatTableDataSource([]);
      this.qrHops.data = [];
      if (queryRoute.routes) {
        this.flgLoading[0] = false;
        this.qrHops = new MatTableDataSource<Routes>([...queryRoute.routes]);
        this.qrHops.data = queryRoute.routes;
      } else {
        this.flgLoading[0] = 'error';
      }
      this.qrHops.sort = this.sort;
      this.qrHops.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    });
  }

  onQueryRoutes():boolean|void {
    if(!this.destinationPubkey || !this.amount) { return true; }
    this.flgLoading[0] = true;
    this.store.dispatch(new CLActions.GetQueryRoutes({destPubkey: this.destinationPubkey, amount: this.amount*1000}));
  }

  resetData() {
    this.destinationPubkey = '';
    this.amount = null;
    this.flgLoading[0] = false;
    this.qrHops.data = [];
    this.form.resetForm();
  }

  onHopClick(selHop: Routes, event: any) {
    const reorderedHop = [
      [{key: 'id', value: selHop.id, title: 'ID', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'channel', value: selHop.channel, title: 'Channel', width: 50, type: DataTypeEnum.STRING},
        {key: 'alias', value: selHop.alias, title: 'Peer Alias', width: 50, type: DataTypeEnum.STRING}],
      [{key: 'msatoshi', value: selHop.msatoshi, title: 'mSatoshi', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'amount_msat', value: selHop.amount_msat, title: 'Amount mSat', width: 50, type: DataTypeEnum.STRING}],
      [{key: 'direction', value: selHop.direction, title: 'Direction', width: 50, type: DataTypeEnum.STRING},
        {key: 'delay', value: selHop.delay, title: 'Delay', width: 50, type: DataTypeEnum.NUMBER}]
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
