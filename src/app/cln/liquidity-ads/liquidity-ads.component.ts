import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { faWater, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { DataService } from '../../shared/services/data.service';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';
import { APICallStatusEnum, getPaginatorLabel, PAGE_SIZE, PAGE_SIZE_OPTIONS, ScreenSizeEnum } from '../../shared/services/consts-enums-functions';
import { LookupNode } from '../../shared/models/clnModels';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-cln-liquidity-ads',
  templateUrl: './liquidity-ads.component.html',
  styleUrls: ['./liquidity-ads.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Liquidity Ads') }
  ]
})
export class CLNLiquidityAdsComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public displayedColumns: any[] = [];
  public faWater = faWater;
  public faExclamationTriangle = faExclamationTriangle;
  public channelAmount = 0;
  public channelOpeningFeeRate = 0;
  public nodeCapacity = 0;
  public channelCount = 0;
  public liquidityNodesData: LookupNode[] = [];
  public liquidityNodes: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload = { status: APICallStatusEnum.INITIATED };
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private dataService: DataService, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'capacity', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'capacity', 'numChannels', 'leaseFeeBasis', 'routingFee', 'channelOpenFee', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'capacity', 'numChannels', 'leaseFeeBasis', 'routingFee', 'channelOpenFee', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'capacity', 'numChannels', 'leaseFeeBasis', 'routingFee', 'channelOpenFee', 'actions'];
    }
  }

  ngOnInit(): void {
    this.dataService.listNetworkNodes('?liquidity_ads=yes').pipe(takeUntil(this.unSubs[0])).subscribe({
      next: (res: any) => {
        this.logger.info('Received Liquidity Ads Enabled Nodes: ' + JSON.stringify(res));
        this.apiCallStatus.status = APICallStatusEnum.COMPLETED;
        this.liquidityNodesData = res;
        this.loadLiqNodesTable(this.liquidityNodesData);
      }, error: (err) => {
        this.logger.error('Liquidity Ads Nodes Error: ' + JSON.stringify(err));
        this.apiCallStatus.status = APICallStatusEnum.ERROR;
        this.errorMessage = JSON.stringify(err);
      }
    });
  }

  onRecalculate() {

  }

  onFilter() {
    this.logger.info(this.nodeCapacity);
    this.logger.info(this.channelCount);
    // this.liquidityNodes.filter = this.nodeCapacity + ' ' + this.channelCount;
  }

  loadLiqNodesTable(liqNodes: LookupNode[]) {
    this.liquidityNodes = new MatTableDataSource<LookupNode>([...liqNodes]);
    this.liquidityNodes.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.liquidityNodes.sort = this.sort;
    this.liquidityNodes.filterPredicate = (node: LookupNode, fltr: string) => JSON.stringify(node).toLowerCase().includes(fltr);
    this.liquidityNodes.paginator = this.paginator;
    this.onFilter();
  }

  onOpenChannel(lqNode: LookupNode) {
  }

  onNodeClick(lqNode: LookupNode) {

  }

  onDownloadCSV() {
    if (this.liquidityNodes.data && this.liquidityNodes.data.length > 0) {
      this.commonService.downloadFile(this.liquidityNodes.data, 'LiquidityNodes');
    }
  }

  onReset() {
    this.channelAmount = 0;
    this.channelOpeningFeeRate = 0;
  }

  onFilterReset() {
    this.nodeCapacity = 0;
    this.channelCount = 0;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
