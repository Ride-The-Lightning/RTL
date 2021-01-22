import { Component, OnInit, OnChanges, OnDestroy, ViewChild, Input, AfterViewInit, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LoopSwapStatus } from '../../../../models/loopModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, LoopTypeEnum, LoopStateEnum } from '../../../../services/consts-enums-functions';
import { LoggerService } from '../../../../services/logger.service';
import { CommonService } from '../../../../services/common.service';
import { LoopService } from '../../../../services/loop.service';

import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-swaps',
  templateUrl: './swaps.component.html',
  styleUrls: ['./swaps.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Swaps') }
  ]  
})
export class SwapsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() selectedSwapType: LoopTypeEnum = LoopTypeEnum.LOOP_OUT;
  @Input() swapsData: LoopSwapStatus[] = [];
  @Input() flgLoading: Array<Boolean | 'error'> = [true];
  @Input() emptyTableMessage = 'No swaps available.';
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  public LoopStateEnum = LoopStateEnum;
  public faHistory = faHistory;
  public swapCaption = 'Loop Out';
  public displayedColumns: any[] = [];
  public listSwaps: any;
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

  ngOnInit() {}

  ngAfterViewInit() {
    if (this.swapsData && this.swapsData.length > 0) {
      this.loadSwapsTable(this.swapsData);
    }
  }

  ngOnChanges(change: SimpleChanges) {
    this.swapCaption = (this.selectedSwapType === LoopTypeEnum.LOOP_IN) ? 'Loop In' : 'Loop Out';
    this.loadSwapsTable(this.swapsData);
  }
    
  applyFilter(selFilter: any) {
    this.listSwaps.filter = selFilter.value.trim().toLowerCase();
  }

  onSwapClick(selSwap: LoopSwapStatus, event: any) {
    this.loopService.getSwap(selSwap.id_bytes.replace(/\//g, '_').replace(/\+/g, '-')).pipe(takeUntil(this.unSubs[2]))
    .subscribe((fetchedSwap: LoopSwapStatus) => {
      const reorderedSwap = [
        [{key: 'state', value: LoopStateEnum[fetchedSwap.state], title: 'Status', width: 50, type: DataTypeEnum.STRING},
          {key: 'amt', value: fetchedSwap.amt, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
        [{key: 'initiation_time_str', value: fetchedSwap.initiation_time_str, title: 'Initiation Time', width: 50, type: DataTypeEnum.DATE_TIME},
          {key: 'last_update_time_str', value: fetchedSwap.last_update_time_str, title: 'Last Update Time', width: 50, type: DataTypeEnum.DATE_TIME}],
        [{key: 'cost_server', value: fetchedSwap.cost_server, title: 'Server Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER},
          {key: 'cost_offchain', value: fetchedSwap.cost_offchain, title: 'Offchain Cost (Sats)', width: 33, type: DataTypeEnum.NUMBER},
          {key: 'cost_onchain', value: fetchedSwap.cost_onchain, title: 'Onchain Cost (Sats)', width: 34, type: DataTypeEnum.NUMBER}],
        [{key: 'id_bytes', value: fetchedSwap.id_bytes, title: 'ID', width: 100, type: DataTypeEnum.STRING}],
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
    this.listSwaps = new MatTableDataSource<LoopSwapStatus>([...swaps]);
    this.listSwaps.sort = this.sort;
    this.listSwaps.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.listSwaps.filterPredicate = (swap: LoopSwapStatus, fltr: string) => JSON.stringify(swap).toLowerCase().includes(fltr);
    this.listSwaps.paginator = this.paginator;
    this.logger.info(this.listSwaps);
  }

  onDownloadCSV() {
    if(this.listSwaps.data && this.listSwaps.data.length > 0) {
      this.commonService.downloadFile(this.listSwaps.data, (this.selectedSwapType === LoopTypeEnum.LOOP_IN) ? 'Loop in' : 'Loop out');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
