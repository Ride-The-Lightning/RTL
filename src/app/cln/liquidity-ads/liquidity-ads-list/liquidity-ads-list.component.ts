import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { faBullhorn, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { DataService } from '../../../shared/services/data.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { AlertTypeEnum, APICallStatusEnum, DataTypeEnum, getPaginatorLabel, PAGE_SIZE, PAGE_SIZE_OPTIONS, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { GetInfo, LookupNode } from '../../../shared/models/clnModels';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';

import { RTLState } from '../../../store/rtl.state';
import { RTLEffects } from '../../../store/rtl.effects';
import { CLNOpenLiquidityChannelComponent } from '../open-liquidity-channel-modal/open-liquidity-channel-modal.component';
import { nodeInfoAndNodeSettingsAndBalance } from '../../store/cln.selector';

@Component({
  selector: 'rtl-cln-liquidity-ads-list',
  templateUrl: './liquidity-ads-list.component.html',
  styleUrls: ['./liquidity-ads-list.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Liquidity Ads') }
  ]
})
export class CLNLiquidityAdsListComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public askTooltipMsg = '';
  public nodesTooltipMsg = '';
  public displayedColumns: any[] = [];
  public faBullhorn = faBullhorn;
  public faExclamationTriangle = faExclamationTriangle;
  public totalBalance = 0;
  public information: GetInfo;
  public channelAmount = 100000;
  public channelOpeningFeeRate = 10;
  public nodeCapacity = 500000;
  public channelCount = 5;
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

  constructor(private logger: LoggerService, private store: Store<RTLState>, private dataService: DataService, private commonService: CommonService, private rtlEffects: RTLEffects) {
    this.askTooltipMsg = 'Specify the liquidity requirements for your node: \n 1. Channel Amount - Amount in Sats you need for the channel opened to your node \n 2. Channel opening fee rate - Rate in Sats/vByte that you are willing to pay to open the channel to you';
    this.nodesTooltipMsg = 'These nodes are advertising their liquidity offering on the network.\nYou should pay attention to the following aspects to evaluate each node offer: \n- The total bitcoin deployed on the node, the more the better\n';
    this.nodesTooltipMsg = this.nodesTooltipMsg + '- The number of channels open on the node, the more the better\n- The channel open fee which the node will charge from you\n- The routing fee which the node will charge on the payments, the lesser the better\n- The reliability of the node, ideally uptime. Refer to the information being provided by the node explorers';
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'channelOpeningFee', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'leaseFee', 'routingFee', 'channelOpeningFee', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'leaseFee', 'routingFee', 'channelOpeningFee', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['alias', 'leaseFee', 'routingFee', 'channelOpeningFee', 'actions'];
    }
  }

  ngOnInit(): void {
    combineLatest([this.store.select(nodeInfoAndNodeSettingsAndBalance), this.dataService.listNetworkNodes('?liquidity_ads=yes')]).pipe(takeUntil(this.unSubs[0])).
      subscribe({
        next: ([infoSettingsBalSelector, nodeListRes]) => {
          this.information = infoSettingsBalSelector.information;
          this.totalBalance = infoSettingsBalSelector.balance.totalBalance;
          this.logger.info(infoSettingsBalSelector);
          if (nodeListRes && !(<any[]>nodeListRes).length) { nodeListRes = []; }
          this.logger.info('Received Liquidity Ads Enabled Nodes: ' + JSON.stringify(nodeListRes));
          this.apiCallStatus.status = APICallStatusEnum.COMPLETED;
          this.liquidityNodesData = (<LookupNode[]>nodeListRes).filter((node) => node.nodeid !== this.information.id);
          this.onCalculateOpeningFee();
          this.loadLiqNodesTable(this.liquidityNodesData);
        }, error: (err) => {
          this.logger.error('Liquidity Ads Nodes Error: ' + JSON.stringify(err));
          this.apiCallStatus.status = APICallStatusEnum.ERROR;
          this.errorMessage = JSON.stringify(err);
        }
      });
  }

  onCalculateOpeningFee() {
    this.liquidityNodesData.forEach((lqNode) => {
      if (lqNode.option_will_fund) {
        lqNode.channelOpeningFee = (+(lqNode.option_will_fund.lease_fee_base_msat) / 1000) + (this.channelAmount * (+lqNode.option_will_fund.lease_fee_basis) / 10000) + ((+lqNode.option_will_fund.funding_weight / 4) * this.channelOpeningFeeRate);
      }
    });
    if (this.paginator) { this.paginator.firstPage(); }
  }

  onFilter() {
    // this.liquidityNodes.filter = 'Changed';
  }

  loadLiqNodesTable(liqNodes: LookupNode[]) {
    this.liquidityNodes = new MatTableDataSource<LookupNode>([...liqNodes]);
    this.liquidityNodes.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.liquidityNodes.sort = this.sort;
    this.liquidityNodes.paginator = this.paginator;
    if (this.sort) { this.sort.sort({ id: 'channelOpeningFee', start: 'asc', disableClear: true }); }
    this.liquidityNodes.filterPredicate = (node: LookupNode, fltr: string) => node.channelCount >= this.channelCount && node.nodeCapacity >= this.nodeCapacity;
    this.onFilter();
  }

  viewLeaseOn(lqNode: LookupNode, link: string) {
    if (link === 'LN') {
      window.open('https://lnrouter.app/node/' + lqNode.nodeid, '_blank');
    } else if (link === 'AM') {
      window.open('https://amboss.space/node/' + lqNode.nodeid, '_blank');
    }
  }

  onOpenChannel(lqNode: LookupNode) {
    const peerToAddChannelMessage = {
      node: lqNode,
      balance: this.totalBalance,
      requestedAmount: this.channelAmount,
      feeRate: this.channelOpeningFeeRate,
      localAmount: 20000
    };
    this.store.dispatch(openAlert({
      payload: {
        data: {
          alertTitle: 'Open Channel',
          message: peerToAddChannelMessage,
          component: CLNOpenLiquidityChannelComponent
        }
      }
    }));
  }

  onViewLeaseInfo(lqNode: LookupNode) {
    const addArr = lqNode.addresses.reduce((acc, curr) => {
      if (curr.address.length > 40) { curr.address = curr.address.substring(0, 39) + '...'; }
      return acc.concat(JSON.stringify(curr).replace('{', '').replace('}', '').replace(/:/g, ': ').replace(/,/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;').replace(/"/g, ''));
    }, []);
    const reorderedLQNode = [
      [{ key: 'alias', value: lqNode.alias, title: 'Node Alias', width: 50, type: DataTypeEnum.STRING },
      { key: 'last_timestamp', value: lqNode.last_timestamp, title: 'Last Timestamp', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'nodeid', value: lqNode.nodeid, title: 'Node ID', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'base_fee', value: (lqNode.option_will_fund.lease_fee_base_msat / 1000), title: 'Lease Base Fee (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'fee_basis', value: lqNode.option_will_fund.lease_fee_basis, title: 'Lease Base Basis (bps)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'channel_max_base', value: lqNode.option_will_fund.channel_fee_max_base_msat / 1000, title: 'Max Channel Routing Base Fee (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'channel_max_rate', value: lqNode.option_will_fund.channel_fee_max_proportional_thousandths * 1000, title: 'Max Channel Routing Fee Rate (ppm)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'funding_rate', value: lqNode.option_will_fund.funding_weight, title: 'Funding Weight', width: 100, type: DataTypeEnum.NUMBER }],
      [{ key: 'address', value: addArr, title: 'Address', width: 100, type: DataTypeEnum.ARRAY }]
    ];
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Lease Information',
          noBtnText: 'Close',
          yesBtnText: 'Open Channel',
          message: reorderedLQNode
        }
      }
    }));
    this.rtlEffects.closeConfirm.pipe(takeUntil(this.unSubs[1])).subscribe((confirmRes) => {
      if (confirmRes) {
        this.onOpenChannel(lqNode);
      }
    });
  }

  onDownloadCSV() {
    if (this.liquidityNodes.data && this.liquidityNodes.data.length > 0) {
      this.commonService.downloadFile(this.liquidityNodes.data, 'LiquidityNodes');
    }
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
