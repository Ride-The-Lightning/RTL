import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { SwapStatus } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-swaps',
  templateUrl: './swaps.component.html',
  styleUrls: ['./swaps.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Swaps') }
  ]  
})
export class SwapsComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  faHistory = faHistory;
  public displayedColumns = [];
  public listSwaps: any;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['type', 'state', 'amt', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['type', 'state', 'amt', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['type', 'state', 'initiation_time_str', 'amt', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['type', 'state', 'initiation_time_str', 'amt', 'cost_server', 'cost_offchain', 'cost_onchain', 'actions'];
    }
  }

  ngOnInit() {
    this.store.dispatch(new RTLActions.FetchLoopSwaps());
    this.actions$.pipe(takeUntil(this.unsub[2]), filter((action) => action.type === RTLActions.RESET_LND_STORE)).subscribe((resetLndStore: RTLActions.ResetLNDStore) => {
      this.store.dispatch(new RTLActions.FetchLoopSwaps());
    });

    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchSwaps') { this.flgLoading[0] = 'error'; }
      });
      if (rtlStore.loopSwaps) {
        this.loadSwapsTable(rtlStore.loopSwaps);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( rtlStore.transactions) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  applyFilter(selFilter: string) {
    this.listSwaps.filter = selFilter;
  }

  onSwapClick(selSwap: SwapStatus, event: any) {
    const reorderedSwap = [
      [{key: 'type', value: selSwap.type, title: 'Type', width: 33, type: DataTypeEnum.STRING},
        {key: 'state', value: selSwap.state, title: 'State', width: 33, type: DataTypeEnum.STRING},
        {key: 'amt', value: selSwap.amt, title: 'Amount (Sats)', width: 33, type: DataTypeEnum.NUMBER}],
      [{key: 'initiation_time_str', value: selSwap.initiation_time_str, title: 'Initiation Time', width: 50, type: DataTypeEnum.DATE_TIME},
        {key: 'last_update_time_str', value: selSwap.last_update_time_str, title: 'Last Update Time', width: 50, type: DataTypeEnum.DATE_TIME}],
      [{key: 'id_bytes', value: selSwap.id_bytes, title: 'ID Bytes', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'id', value: selSwap.id, title: 'ID (Deprecated)', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'htlc_address', value: selSwap.htlc_address, title: 'HTLC Address', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'cost_server', value: selSwap.cost_server, title: 'Server Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER},
        {key: 'cost_offchain', value: selSwap.cost_offchain, title: 'Offchain Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER},
        {key: 'cost_onchain', value: selSwap.cost_onchain, title: 'Onchain Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Swap Information',
      message: reorderedSwap,
    }}));
  }

  loadSwapsTable(swaps) {
    this.listSwaps = new MatTableDataSource<SwapStatus>([...swaps]);
    this.listSwaps.sort = this.sort;
    this.listSwaps.paginator = this.paginator;
    this.logger.info(this.listSwaps);
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
