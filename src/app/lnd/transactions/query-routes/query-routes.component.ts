import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faRoute } from '@fortawesome/free-solid-svg-icons';

import { MatTableDataSource, MatSort } from '@angular/material';
import { Hop } from '../../../shared/models/lndModels';

import { LNDEffects } from '../../store/lnd.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { AlertTypeEnum, DataTypeEnum } from '../../../shared/services/consts-enums-functions';

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
  public faRoute = faRoute;
  // public faRoad = faRoad;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'fee_msat', 'actions'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'fee_msat', 'actions'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'chan_capacity', 'amt_to_forward_msat', 'fee_msat', 'actions'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'chan_capacity', 'amt_to_forward_msat', 'fee_msat', 'actions'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['hop_sequence', 'pubkey_alias', 'chan_capacity', 'amt_to_forward_msat', 'fee_msat', 'actions'];
        break;
    }
  }

  ngOnInit() {
    this.lndEffects.setQueryRoutes
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
    this.store.dispatch(new RTLActions.OpenAlert({ width: '55%', data: {
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
