import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faRoute, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { Routes } from '../../../shared/models/clnModels';
import { AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';

import { CLNEffects } from '../../store/cln.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getQueryRoutes } from '../../store/cln.actions';

@Component({
  selector: 'rtl-cln-query-routes',
  templateUrl: './query-routes.component.html',
  styleUrls: ['./query-routes.component.scss']
})
export class CLNQueryRoutesComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild('queryRoutesForm', { static: true }) form: any;
  public destinationPubkey = '';
  public amount: number = null;
  public qrHops: any;
  public flgSticky = false;
  public displayedColumns: any[] = [];
  public flgLoading: Array<Boolean | 'error'> = [false]; // 0: peers
  public faRoute = faRoute;
  public faExclamationTriangle = faExclamationTriangle;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private clnEffects: CLNEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'msatoshi', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'direction', 'msatoshi', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'direction', 'delay', 'msatoshi', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'channel', 'direction', 'delay', 'msatoshi', 'actions'];
    }
  }

  ngOnInit() {
    this.clnEffects.setQueryRoutesCL.pipe(takeUntil(this.unSubs[1])).subscribe((queryRoute) => {
      this.qrHops = new MatTableDataSource([]);
      this.qrHops.data = [];
      if (queryRoute.routes && queryRoute.routes.length && queryRoute.routes.length > 0) {
        this.flgLoading[0] = false;
        this.qrHops = new MatTableDataSource<Routes>([...queryRoute.routes]);
        this.qrHops.data = queryRoute.routes;
      } else {
        this.flgLoading[0] = 'error';
      }
      this.qrHops.sort = this.sort;
      this.qrHops.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    });
  }

  onQueryRoutes(): boolean | void {
    if (!this.destinationPubkey || !this.amount) {
      return true;
    }
    this.flgLoading[0] = true;
    this.store.dispatch(getQueryRoutes({ payload: { destPubkey: this.destinationPubkey, amount: this.amount * 1000 } }));
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
      [{ key: 'id', value: selHop.id, title: 'ID', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'channel', value: selHop.channel, title: 'Channel', width: 50, type: DataTypeEnum.STRING },
      { key: 'alias', value: selHop.alias, title: 'Peer Alias', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'msatoshi', value: selHop.msatoshi, title: 'mSatoshi', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'amount_msat', value: selHop.amount_msat, title: 'Amount mSat', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'direction', value: selHop.direction, title: 'Direction', width: 50, type: DataTypeEnum.STRING },
      { key: 'delay', value: selHop.delay, title: 'Delay', width: 50, type: DataTypeEnum.NUMBER }]
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
