import { Component, OnInit, OnChanges, OnDestroy, ViewChild, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SwapStatus } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, SwapTypeEnum, SwapStateEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { LoopService } from '../../../shared/services/loop.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as LNDActions from '../../store/lnd.actions';

@Component({
  selector: 'rtl-boltz-swaps',
  templateUrl: './boltz-swaps.component.html',
  styleUrls: ['./boltz-swaps.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Swaps') }
  ]  
})
export class BoltzSwapsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedSwapType: SwapTypeEnum = SwapTypeEnum.WITHDRAWAL;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  public swapStateEnum = SwapStateEnum;
  public faHistory = faHistory;
  public swapCaption = 'Withdrawal';
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
      this.displayedColumns = ['state', 'initiation_time', 'amt', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['state', 'initiation_time', 'amt', 'cost_server', 'cost_offchain', 'cost_onchain', 'actions'];
    }
  }

  ngOnInit() {
    this.store.dispatch(new LNDActions.FetchBoltzSwaps());
    this.actions$.pipe(takeUntil(this.unSubs[0]), filter((action) => action.type === LNDActions.RESET_LND_STORE)).subscribe((resetLndStore: LNDActions.ResetLNDStore) => {
      this.store.dispatch(new LNDActions.FetchBoltzSwaps());
    });
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'LoopSwaps') { this.flgLoading[0] = 'error'; }
      });
      if (rtlStore.boltzSwaps) {
        this.storedSwaps = rtlStore.boltzSwaps.map(swap => ({...swap, state: Object.keys(SwapStateEnum).find(ss => SwapStateEnum[ss] === swap.state)}));
        this.filteredSwaps = this.storedSwaps.filter(swap => swap.type === this.selectedSwapType).sort((a, b) => {

          const x = a.initiation_time_str;
          const y = b.initiation_time_str;
          return x>y ? -1 : x<y ? 1 : 0;
        });
        this.loadSwapsTable(this.filteredSwaps);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( rtlStore.transactions) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  ngOnChanges() {
    this.swapCaption = (this.selectedSwapType === SwapTypeEnum.DEPOSIT) ? 'Deposit' : 'Withdrawal'
    this.filteredSwaps = this.storedSwaps.filter(swap => swap.type === this.selectedSwapType);
    this.loadSwapsTable(this.filteredSwaps);
  }
    
  applyFilter(selFilter: string) {
    this.listSwaps.filter = selFilter;
  }

  onSwapClick(selSwap: SwapStatus, event: any) {
    const reorderedSwap = [
      [{key: 'state', value: SwapStateEnum[selSwap.state], title: 'Status', width: 50, type: DataTypeEnum.STRING},
        {key: 'amt', value: selSwap.amt, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'initiation_time_str', value: selSwap.initiation_time_str, title: 'Initiation Time', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'last_update_time_str', value: selSwap.last_update_time_str, title: 'Last Update Time', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'cost_server', value: selSwap.cost_server, title: 'Server Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER},
        {key: 'cost_offchain', value: selSwap.cost_offchain, title: 'Offchain Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER},
        {key: 'cost_onchain', value: selSwap.cost_onchain, title: 'Onchain Cost (Sats)', width: 34, type: DataTypeEnum.NUMBER}],
      [{key: 'id_bytes', value: selSwap.id_bytes, title: 'ID', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'htlc_address', value: selSwap.htlc_address, title: 'HTLC Address', width: 100, type: DataTypeEnum.STRING}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: this.swapCaption + ' Status',
      message: reorderedSwap,
      openedBy: 'SWAP'
    }}));
  }

  loadSwapsTable(swaps) {
    this.listSwaps = new MatTableDataSource<SwapStatus>([...swaps]);
    this.listSwaps.sort = this.sort;
    this.listSwaps.sortingDataAccessor = (data, sortHeaderId) => {
      switch(sortHeaderId) {
        case 'initiation_time':
          return Date.parse(data.initiation_time_str);
        case 'last_update_time':
          return Date.parse(data.last_update_time_str);
        default:
        return  (data[sortHeaderId]  && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : +data[sortHeaderId];

      }
    }
    this.listSwaps.paginator = this.paginator;
    this.logger.info(this.listSwaps);
  }

  onDownloadCSV() {
    if(this.listSwaps.data && this.listSwaps.data.length > 0) {
      this.commonService.downloadFile(this.listSwaps.data, (this.selectedSwapType === SwapTypeEnum.DEPOSIT) ? 'Deposit' : 'Withdrawal');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
