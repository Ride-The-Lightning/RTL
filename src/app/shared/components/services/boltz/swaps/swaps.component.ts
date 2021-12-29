import { Component, OnChanges, OnDestroy, ViewChild, Input, AfterViewInit, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Swap, ReverseSwap } from '../../../../models/boltzModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, SwapTypeEnum, SwapStateEnum } from '../../../../services/consts-enums-functions';
import { LoggerService } from '../../../../services/logger.service';
import { CommonService } from '../../../../services/common.service';
import { BoltzService } from '../../../../services/boltz.service';

import { openAlert } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';

@Component({
  selector: 'rtl-boltz-swaps',
  templateUrl: './swaps.component.html',
  styleUrls: ['./swaps.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Swaps') }
  ]
})
export class BoltzSwapsComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() selectedSwapType: SwapTypeEnum = SwapTypeEnum.SWAP_OUT;
  @Input() swapsData: Swap[] | ReverseSwap[] = [];
  @Input() flgLoading: Array<Boolean | 'error'> = [true];
  @Input() emptyTableMessage = 'No swaps available.';
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public swapStateEnum = SwapStateEnum;
  public faHistory = faHistory;
  public swapCaption = 'Swap Out';
  public displayedColumns: any[] = [];
  public listSwaps: any;
  public selFilter = '';
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private boltzService: BoltzService) {
    this.screenSize = this.commonService.getScreenSize();
    this.setTableColumns();
  }

  ngAfterViewInit() {
    if (this.swapsData && this.swapsData.length > 0) {
      this.loadSwapsTable(this.swapsData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedSwapType && !changes.selectedSwapType.firstChange) {
      this.setTableColumns();
    }
    this.swapCaption = (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ? 'Swap In' : 'Swap Out';
    this.loadSwapsTable(this.swapsData);
  }

  setTableColumns() {
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ?
        ['status', 'id', 'expectedAmount', 'actions'] : ['status', 'id', 'onchainAmount', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ?
        ['status', 'id', 'expectedAmount', 'actions'] : ['status', 'id', 'onchainAmount', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ?
        ['status', 'id', 'expectedAmount', 'timeoutBlockHeight', 'actions'] :
        ['status', 'id', 'onchainAmount', 'timeoutBlockHeight', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ?
        ['status', 'id', 'lockupAddress', 'expectedAmount', 'timeoutBlockHeight', 'actions'] :
        ['status', 'id', 'claimAddress', 'onchainAmount', 'timeoutBlockHeight', 'actions'];
    }
  }

  applyFilter() {
    if (this.listSwaps && this.selFilter !== '') {
      this.listSwaps.filter = this.selFilter.trim().toLowerCase();
    }
  }

  onSwapClick(selSwap: Swap | ReverseSwap, event: any) {
    this.boltzService.swapInfo(selSwap.id).pipe(takeUntil(this.unSubs[1])).
      subscribe((fetchedSwap: any) => {
        fetchedSwap = (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ? fetchedSwap.swap : fetchedSwap.reverseSwap;
        const reorderedSwap = [
          [{ key: 'status', value: SwapStateEnum[fetchedSwap.status], title: 'Status', width: 50, type: DataTypeEnum.STRING },
          { key: 'id', value: fetchedSwap.id, title: 'ID', width: 50, type: DataTypeEnum.STRING }],
          [{ key: 'amount', value: fetchedSwap.onchainAmount ? fetchedSwap.onchainAmount : fetchedSwap.expectedAmount ? fetchedSwap.expectedAmount : 0, title: fetchedSwap.onchainAmount ? 'Onchain Amount (Sats)' : fetchedSwap.expectedAmount ? 'Expected Amount (Sats)' : 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER },
          { key: 'timeoutBlockHeight', value: fetchedSwap.timeoutBlockHeight, title: 'Timeout Block Height', width: 50, type: DataTypeEnum.NUMBER }],
          [{ key: 'address', value: fetchedSwap.claimAddress ? fetchedSwap.claimAddress : fetchedSwap.lockupAddress ? fetchedSwap.lockupAddress : '', title: fetchedSwap.claimAddress ? 'Claim Address' : fetchedSwap.lockupAddress ? 'Lockup Address' : 'Address', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'invoice', value: fetchedSwap.invoice, title: 'Invoice', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'privateKey', value: fetchedSwap.privateKey, title: 'Private Key', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'preimage', value: fetchedSwap.preimage, title: 'Preimage', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'redeemScript', value: fetchedSwap.redeemScript, title: 'Redeem Script', width: 100, type: DataTypeEnum.STRING }],
          [{ key: 'lockupTransactionId', value: fetchedSwap.lockupTransactionId, title: 'Lockup Transaction ID', width: 50, type: DataTypeEnum.STRING },
          { key: 'transactionId', value: fetchedSwap.claimTransactionId ? fetchedSwap.claimTransactionId : fetchedSwap.refundTransactionId ? fetchedSwap.refundTransactionId : '', title: fetchedSwap.claimTransactionId ? 'Claim Transaction ID' : fetchedSwap.refundTransactionId ? 'Refund Transaction ID' : 'Transaction ID', width: 50, type: DataTypeEnum.STRING }]
        ];
        this.store.dispatch(openAlert({
          payload: {
            data: {
              type: AlertTypeEnum.INFORMATION,
              alertTitle: this.swapCaption + ' Status',
              message: reorderedSwap,
              openedBy: 'SWAP'
            }
          }
        }));
      });
  }

  loadSwapsTable(swaps) {
    this.listSwaps = swaps ? new MatTableDataSource<Swap>([...swaps]) : new MatTableDataSource<Swap>([]);
    this.listSwaps.sort = this.sort;
    this.listSwaps.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.listSwaps.filterPredicate = (swap: Swap, fltr: string) => JSON.stringify(swap).toLowerCase().includes(fltr);
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.listSwaps.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.listSwaps);
  }

  onDownloadCSV() {
    if (this.listSwaps.data && this.listSwaps.data.length > 0) {
      this.commonService.downloadFile(this.listSwaps.data, (this.selectedSwapType === SwapTypeEnum.SWAP_IN) ? 'Swap in' : 'Swap out');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
