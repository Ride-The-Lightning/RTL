import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faRoute, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { CommonService } from '../../../shared/services/common.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Hop } from '../../../shared/models/lndModels';

import { AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LNDEffects } from '../../store/lnd.effects';
import * as LNDActions from '../../store/lnd.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-query-routes',
  templateUrl: './query-routes.component.html',
  styleUrls: ['./query-routes.component.scss']
})
export class QueryRoutesComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  public destinationPubkey = '';
  public amount = null;
  public qrHops: any;
  public flgSticky = false;
  public displayedColumns: any[] = [];
  public flgLoading: Array<Boolean | 'error'> = [false]; // 0: peers
  public faRoute = faRoute;
  public faExclamationTriangle = faExclamationTriangle;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['pubkey_alias', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'fee_msat', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'chan_capacity', 'amt_to_forward_msat', 'fee_msat', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'chan_capacity', 'amt_to_forward_msat', 'fee_msat', 'actions'];
    }
  }

  ngOnInit() {
    this.lndEffects.setQueryRoutes
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(queryRoute => {
      this.qrHops = new MatTableDataSource([]);
      this.qrHops.data = [];
      if ( queryRoute.routes &&  queryRoute.routes[0].hops) {
        this.flgLoading[0] = false;
        this.qrHops = new MatTableDataSource<Hop>([...queryRoute.routes[0].hops]);
        this.qrHops.data = queryRoute.routes[0].hops;
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
    this.store.dispatch(new LNDActions.GetQueryRoutes({destPubkey: this.destinationPubkey, amount: this.amount}));
  }

  resetData() {
    this.destinationPubkey = '';
    this.amount = null;
    this.flgLoading[0] = false;
  }

  onHopClick(selHop: Hop, event: any) {
    const reorderedHop = [
      [{key: 'hop_sequence', value: selHop.hop_sequence, title: 'Sequence', width: 30, type: DataTypeEnum.NUMBER},
        {key: 'amt_to_forward', value: selHop.amt_to_forward, title: 'Amount To Forward (Sats)', width: 30, type: DataTypeEnum.NUMBER},
        {key: 'fee_msat', value: selHop.fee_msat, title: 'Fee (mSats)', width: 40, type: DataTypeEnum.NUMBER}],
      [{key: 'pubkey_alias', value: selHop.pubkey_alias, title: 'Peer Alias', width: 30, type: DataTypeEnum.STRING},
        {key: 'pub_key', value: selHop.pub_key, title: 'Peer Pubkey', width: 70, type: DataTypeEnum.STRING}],
      [{key: 'expiry', value: selHop.expiry, title: 'Expiry', width: 30, type: DataTypeEnum.NUMBER},
        {key: 'chan_id', value: selHop.chan_id, title: 'Channel ID', width: 30, type: DataTypeEnum.STRING},
        {key: 'chan_capacity', value: selHop.chan_capacity, title: 'Channel Capacity', width: 40, type: DataTypeEnum.NUMBER}],
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
