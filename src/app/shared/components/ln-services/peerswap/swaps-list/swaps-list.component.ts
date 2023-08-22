import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faArrowRightFromBracket, faArrowRightToBracket, faPersonArrowDownToLine, faPersonArrowUpFromLine, faPersonCircleXmark } from '@fortawesome/free-solid-svg-icons';

import { Swap } from '../../../../models/peerswapModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, DataTypeEnum, AlertTypeEnum, PeerswapRoles } from '../../../../services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { RTLState } from '../../../../../store/rtl.state';
import { openAlert } from '../../../../../store/rtl.actions';
import { fetchSwaps, getSwap } from '../../../../../cln/store/cln.actions';
import { swaps } from '../../../../../cln/store/cln.selector';
import { SwapStatePipe } from '../../../../pipes/app.pipe';

@Component({
  selector: 'rtl-peer-swaps-list',
  templateUrl: './swaps-list.component.html',
  styleUrls: ['./swaps-list.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Swaps') }
  ]
})
export class PeerswapsListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faPersonArrowDownToLine = faPersonArrowDownToLine;
  public faPersonArrowUpFromLine = faPersonArrowUpFromLine;
  public faPersonCircleXmark = faPersonCircleXmark;
  public faArrowRightFromBracket = faArrowRightFromBracket;
  public faArrowRightToBracket = faArrowRightToBracket;
  public displayedColumns: any[] = [];
  public allSwapsData: any = null;
  public swapsData: Swap[] = [];
  public swaps: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public swapLists = ['psout', 'psin', 'pscanceled'];
  public selSwapList = this.swapLists[0];
  public peerswapRoles = PeerswapRoles;
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private router: Router, private swapStatePipe: SwapStatePipe, private titleCasePipe: TitleCasePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.selSwapList = this.router.url.substring(this.router.url.lastIndexOf('/') + 1);
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd) => {
          this.selSwapList = value.url.substring(value.url.lastIndexOf('/') + 1);
          this.loadTableWithSelection();
        }
      });
    this.store.select(swaps).pipe(takeUntil(this.unSubs[1])).
      subscribe((swapsSeletor: { swapOuts: Swap[], swapIns: Swap[], swapsCanceled: Swap[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = swapsSeletor.apiCallStatus;
        if (this.apiCallStatus?.status === APICallStatusEnum.UN_INITIATED) {
          this.store.dispatch(fetchSwaps());
        }
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (this.apiCallStatus?.status === APICallStatusEnum.COMPLETED) {
          this.allSwapsData = { swapOuts: swapsSeletor.swapOuts, swapIns: swapsSeletor.swapIns, swapsCanceled: swapsSeletor.swapsCanceled };
          if (this.sort && this.paginator) {
            this.loadTableWithSelection();
          }
        }
        this.logger.info(swapsSeletor);
      });
  }

  ngAfterViewInit(): void {
    if (this.allSwapsData) {
      this.loadTableWithSelection();
    }
  }

  loadTableWithSelection() {
    switch (this.selSwapList) {
      case this.swapLists[0]:
        if (this.screenSize === ScreenSizeEnum.XS) {
          this.flgSticky = false;
          this.displayedColumns = ['id', 'state', 'amount', 'actions'];
        } else if (this.screenSize === ScreenSizeEnum.SM) {
          this.flgSticky = false;
          this.displayedColumns = ['id', 'alias', 'short_channel_id', 'state', 'amount', 'actions'];
        } else if (this.screenSize === ScreenSizeEnum.MD) {
          this.flgSticky = false;
          this.displayedColumns = ['id', 'alias', 'short_channel_id', 'created_at', 'state', 'amount', 'actions'];
        } else {
          this.flgSticky = true;
          this.displayedColumns = ['id', 'alias', 'short_channel_id', 'created_at', 'state', 'amount', 'actions'];
        }
        this.swapsData = this.allSwapsData?.swapOuts || [];
        break;
      case this.swapLists[1]:
        if (this.screenSize === ScreenSizeEnum.XS) {
          this.flgSticky = false;
          this.displayedColumns = ['id', 'state', 'amount', 'actions'];
        } else if (this.screenSize === ScreenSizeEnum.SM) {
          this.flgSticky = false;
          this.displayedColumns = ['id', 'alias', 'short_channel_id', 'state', 'amount', 'actions'];
        } else if (this.screenSize === ScreenSizeEnum.MD) {
          this.flgSticky = false;
          this.displayedColumns = ['id', 'alias', 'short_channel_id', 'created_at', 'state', 'amount', 'actions'];
        } else {
          this.flgSticky = true;
          this.displayedColumns = ['id', 'alias', 'short_channel_id', 'created_at', 'state', 'amount', 'actions'];
        }
        this.swapsData = this.allSwapsData?.swapIns || [];
        break;
      case this.swapLists[2]:
        if (this.screenSize === ScreenSizeEnum.XS) {
          this.flgSticky = false;
          this.displayedColumns = ['id', 'amount', 'cancel_message', 'actions'];
        } else if (this.screenSize === ScreenSizeEnum.SM) {
          this.flgSticky = false;
          this.displayedColumns = ['id', 'alias', 'short_channel_id', 'amount', 'cancel_message', 'actions'];
        } else if (this.screenSize === ScreenSizeEnum.MD) {
          this.flgSticky = false;
          this.displayedColumns = ['id', 'alias', 'short_channel_id', 'created_at', 'amount', 'cancel_message', 'actions'];
        } else {
          this.flgSticky = true;
          this.displayedColumns = ['id', 'alias', 'short_channel_id', 'created_at', 'amount', 'cancel_message', 'actions'];
        }
        this.swapsData = this.allSwapsData?.swapsCanceled || [];
        break;
      default:
        break;
    }
    if (this.swapsData && this.swapsData.length && this.swapsData.length > 0 && this.sort && this.paginator) {
      this.loadswapsTable(this.swapsData);
    }
  }

  onSwapClick(selSwap: Swap) {
    const reorderedSwap = [
      [{ key: 'id', value: selSwap.id, title: 'Swap Id', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'state', value: this.swapStatePipe.transform(selSwap.state || ''), title: 'State', width: 50, type: DataTypeEnum.STRING },
      { key: 'role', value: this.titleCasePipe.transform(selSwap.role), title: 'Role', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'alias', value: selSwap.alias, title: 'Alias', width: 50, type: DataTypeEnum.STRING },
        { key: 'short_channel_id', value: selSwap.short_channel_id, title: 'Short Channel ID', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'amount', value: selSwap.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER },
        { key: 'created_at', value: this.datePipe.transform(new Date(selSwap.created_at || ''), 'dd/MMM/YYYY HH:mm'), title: 'Created At', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'peer_node_id', value: selSwap.peer_node_id, title: 'Peer Node Id', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'initiator_node_id', value: selSwap.initiator_node_id, title: 'Initiator Node Id', width: 100, type: DataTypeEnum.STRING }]
    ];
    if (selSwap.opening_tx_id) {
      reorderedSwap.push([{ key: 'opening_tx_id', value: selSwap.opening_tx_id, title: 'Opening Transaction Id', width: 100, type: DataTypeEnum.STRING }]);
    }
    if (selSwap.claim_tx_id) {
      reorderedSwap.push([{ key: 'claim_tx_id', value: selSwap.claim_tx_id, title: 'Claim Transaction Id', width: 100, type: DataTypeEnum.STRING }]);
    }
    if (selSwap.cancel_message) {
      reorderedSwap.push([{ key: 'cancel_message', value: selSwap.cancel_message, title: 'Cancel Message', width: 100, type: DataTypeEnum.STRING }]);
    }
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: this.selSwapList === this.swapLists[0] ? 'Swapout Information' : this.selSwapList === this.swapLists[1] ? 'Swapin Information' : 'Swap Canceled Information',
          message: reorderedSwap
        }
      }
    }));
  }

  loadswapsTable(swaps: Swap[]) {
    this.swaps = new MatTableDataSource<Swap>([...swaps]);
    this.swaps.sort = this.sort;
    this.swaps.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.swaps.filterPredicate = (swap: Swap, fltr: string) => {
      const newSwap =
      (swap.id ? swap.id : '') +
      (swap.alias ? swap.alias.toLowerCase() : '') +
      (swap.role ? swap.role : '') +
      (swap.short_channel_id ? swap.short_channel_id : '') +
      (swap.amount ? swap.amount : '') +
      (swap.state ? swap.state : '') +
      ((swap.created_at) ? this.datePipe.transform(new Date(swap.created_at), 'dd/MMM/YYYY HH:mm')?.toLowerCase() : '') +
      (swap.cancel_message ? swap.cancel_message.toLowerCase : '');
      return newSwap?.includes(fltr) || false;
    };
    this.swaps.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.swaps);
  }

  onSwapRefresh(selSwap: Swap) {
    this.store.dispatch(getSwap({ payload: selSwap.id || '' }));
  }

  onDownloadCSV() {
    if (this.swaps && this.swaps.data && this.swapsData.length && this.swaps.data.length > 0) {
      this.commonService.downloadFile(this.swaps.data, 'Peerswap-' + this.selSwapList);
    }
  }

  applyFilter() {
    this.swaps.filter = this.selFilter.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
