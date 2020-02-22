import { Component, OnInit, OnChanges, OnDestroy, ViewChild, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { SwapStatus, SwapTypeEnum, SwapStateEnum } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { LoopService } from '../../../shared/services/loop.service';

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
export class SwapsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedSwapType: SwapTypeEnum = SwapTypeEnum.LOOP_OUT;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public swapStateEnum = SwapStateEnum;
  public faHistory = faHistory;
  public swapCaption = 'Loop Out';
  public displayedColumns = [];
  public listSwaps: any;
  public storedSwaps: SwapStatus[] = [];
  public filteredSwaps: SwapStatus[] = [];
  public flgLoading: Array<Boolean | 'error'> = [true];
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private loopService: LoopService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['state', 'amt', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['state', 'amt', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['state', 'initiation_time_str', 'amt', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['state', 'initiation_time_str', 'amt', 'cost_server', 'cost_offchain', 'cost_onchain', 'actions'];
    }
  }

  ngOnInit() {
    this.store.dispatch(new RTLActions.FetchLoopSwaps());
    this.actions$.pipe(takeUntil(this.unSubs[0]), filter((action) => action.type === RTLActions.RESET_LND_STORE)).subscribe((resetLndStore: RTLActions.ResetLNDStore) => {
      this.store.dispatch(new RTLActions.FetchLoopSwaps());
    });

    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchSwaps') { this.flgLoading[0] = 'error'; }
      });
      if (rtlStore.loopSwaps) {
        this.storedSwaps = rtlStore.loopSwaps;
        this.filteredSwaps = this.storedSwaps.filter(swap => swap.type === this.selectedSwapType);
        this.loadSwapsTable(this.filteredSwaps);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( rtlStore.transactions) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  ngOnChanges() {
    this.swapCaption = (this.selectedSwapType === SwapTypeEnum.LOOP_IN) ? 'Loop In' : 'Loop Out'
    this.filteredSwaps = this.storedSwaps.filter(swap => swap.type === this.selectedSwapType);
    this.loadSwapsTable(this.filteredSwaps);
  }
    
  applyFilter(selFilter: string) {
    this.listSwaps.filter = selFilter;
  }

  onSwapClick(selSwap: SwapStatus, event: any) {
    this.loopService.getSwap(selSwap.id_bytes.replace(/\//g, '_').replace(/\+/g, '-')).pipe(takeUntil(this.unSubs[2]))
    .subscribe((fetchedSwap: SwapStatus) => {
      const reorderedSwap = [
        [{key: 'state', value: SwapStateEnum[fetchedSwap.state], title: 'Status', width: 50, type: DataTypeEnum.STRING},
          {key: 'amt', value: fetchedSwap.amt, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
        [{key: 'initiation_time_str', value: fetchedSwap.initiation_time_str, title: 'Initiation Time', width: 50, type: DataTypeEnum.DATE_TIME},
          {key: 'last_update_time_str', value: fetchedSwap.last_update_time_str, title: 'Last Update Time', width: 50, type: DataTypeEnum.DATE_TIME}],
        [{key: 'cost_server', value: fetchedSwap.cost_server, title: 'Server Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER},
          {key: 'cost_offchain', value: fetchedSwap.cost_offchain, title: 'Offchain Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER},
          {key: 'cost_onchain', value: fetchedSwap.cost_onchain, title: 'Onchain Cost (Sats)', width: 34, type: DataTypeEnum.NUMBER}],
        [{key: 'id_bytes', value: fetchedSwap.id_bytes, title: 'ID Bytes', width: 100, type: DataTypeEnum.STRING}],
        [{key: 'id', value: fetchedSwap.id, title: 'ID (Deprecated)', width: 100, type: DataTypeEnum.STRING}],
        [{key: 'htlc_address', value: fetchedSwap.htlc_address, title: 'HTLC Address', width: 100, type: DataTypeEnum.STRING}]
      ];
      this.store.dispatch(new RTLActions.OpenAlert({ data: {
        type: AlertTypeEnum.INFORMATION,
        alertTitle: this.swapCaption + ' Status',
        message: reorderedSwap,
        openedBy: 'SWAP'
      }}));
    });
  }

  loadSwapsTable(swaps) {
    this.listSwaps = new MatTableDataSource<SwapStatus>([...swaps]);
    this.listSwaps.sort = this.sort;
    this.listSwaps.paginator = this.paginator;
    this.logger.info(this.listSwaps);
  }

  onDownloadCSV() {
    if(this.listSwaps.data && this.listSwaps.data.length > 0) {
      this.commonService.downloadCSV(this.listSwaps.data, (this.selectedSwapType === SwapTypeEnum.LOOP_IN) ? 'Loop-in' : 'Loop-out');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
