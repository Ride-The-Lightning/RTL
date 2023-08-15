import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { faBullhorn, faExclamationTriangle, faUsers } from '@fortawesome/free-solid-svg-icons';

import { DataService } from '../../../shared/services/data.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { AlertTypeEnum, APICallStatusEnum, DataTypeEnum, getPaginatorLabel, PAGE_SIZE, PAGE_SIZE_OPTIONS, ScreenSizeEnum, NODE_FEATURES_CLN, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, CLN_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { GetInfo, LookupNode } from '../../../shared/models/clnModels';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';

import { RTLState } from '../../../store/rtl.state';
import { RTLEffects } from '../../../store/rtl.effects';
import { CLNOpenLiquidityChannelComponent } from '../open-liquidity-channel-modal/open-liquidity-channel-modal.component';
import { clnPageSettings, nodeInfoAndNodeSettingsAndBalance } from '../../store/cln.selector';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

@Component({
  selector: 'rtl-cln-liquidity-ads-list',
  templateUrl: './liquidity-ads-list.component.html',
  styleUrls: ['./liquidity-ads-list.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Liquidity Ads') }
  ]
})
export class CLNLiquidityAdsListComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'liquidity_ads';
  public tableSetting: TableSetting = { tableId: 'liquidity_ads', recordsPerPage: PAGE_SIZE, sortBy: 'channel_opening_fee', sortOrder: SortOrderEnum.ASCENDING };
  public askTooltipMsg = '';
  public nodesTooltipMsg = '';
  public displayedColumns: any[] = [];
  public faBullhorn = faBullhorn;
  public faExclamationTriangle = faExclamationTriangle;
  public faUsers = faUsers;
  public totalBalance = 0;
  public information: GetInfo;
  public channelAmount = 100000;
  public channel_opening_feeRate = 10;
  public node_capacity = 500000;
  public channel_count = 5;
  public liquidityNodesData: LookupNode[] = [];
  public liquidityNodes: any = new MatTableDataSource([]);
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public listNodesCallStatus = APICallStatusEnum.INITIATED;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private dataService: DataService, private commonService: CommonService, private rtlEffects: RTLEffects, private datePipe: DatePipe, private decimalPipe: DecimalPipe, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.askTooltipMsg = 'Specify the liquidity requirements for your node: \n 1. Channel Amount - Amount in Sats you need on the channel opened to your node \n 2. Channel opening fee rate - Rate in Sats/vByte that you are willing to pay to open the channel to you';
    this.nodesTooltipMsg = 'These nodes are advertising their liquidity offering on the network.\nYou should pay attention to the following aspects to evaluate each node offer: \n- The total bitcoin deployed on the node, the more the better\n';
    this.nodesTooltipMsg = this.nodesTooltipMsg + '- The number of channels open on the node, the more the better' +
    '\n- The channel open fee which the node will charge from you\n- The routing fee which the node will charge on the payments, the lesser the better' +
    '\n- The reliability of the node, ideally uptime. Refer to the information being provided by the node explorers';
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit(): void {
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        if (settings.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = settings.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || CLN_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    combineLatest([this.store.select(nodeInfoAndNodeSettingsAndBalance), this.dataService.listNetworkNodes('?liquidity_ads=yes')]).pipe(takeUntil(this.unSubs[1])).
      subscribe({
        next: ([infoSettingsBalSelector, nodeListRes]) => {
          this.information = infoSettingsBalSelector.information;
          this.totalBalance = infoSettingsBalSelector.balance.totalBalance || 0;
          this.logger.info(infoSettingsBalSelector);
          if (nodeListRes && !(<any[]>nodeListRes).length) { nodeListRes = []; }
          this.logger.info('Received Liquidity Ads Enabled Nodes: ' + JSON.stringify(nodeListRes));
          this.listNodesCallStatus = APICallStatusEnum.COMPLETED;
          (<any[]>nodeListRes).forEach((lqNode) => {
            const a: string[] = [];
            lqNode.address_types = Array.from(new Set(lqNode.addresses?.reduce((acc, addr) => {
              if (addr.type?.includes('ipv') || addr.type?.includes('tor')) {
                acc.push(addr.type?.substring(0, 3));
              }
              return acc;
            }, a)));
          });
          this.liquidityNodesData = (<LookupNode[]>nodeListRes).filter((node) => node.nodeid !== this.information.id);
          this.onCalculateOpeningFee();
          this.loadLiqNodesTable(this.liquidityNodesData);
        }, error: (err) => {
          this.logger.error('Liquidity Ads Nodes Error: ' + JSON.stringify(err));
          this.listNodesCallStatus = APICallStatusEnum.ERROR;
          this.errorMessage = JSON.stringify(err);
        }
      });
  }

  onCalculateOpeningFee() {
    this.liquidityNodesData.forEach((lqNode) => {
      if (lqNode.option_will_fund) {
        lqNode.channel_opening_fee = (+(lqNode.option_will_fund.lease_fee_base_msat || 0) / 1000) + (this.channelAmount * (+(lqNode.option_will_fund.lease_fee_basis || 0)) / 10000) + ((+(lqNode.option_will_fund.funding_weight || 0) / 4) * this.channel_opening_feeRate);
      }
    });
    if (this.paginator) { this.paginator.firstPage(); }
  }

  onFilter() {
    // this.liquidityNodes.filter = 'Changed';
  }

  applyFilter() {
    this.liquidityNodes.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform((returnColumn.column || ''), '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.liquidityNodes.filterPredicate = (rowData: LookupNode, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = ((rowData.alias) ? rowData.alias.toLocaleLowerCase() : '') + (rowData.channel_opening_fee ? rowData.channel_opening_fee + ' Sats' : '') +
          (rowData.option_will_fund?.lease_fee_base_msat ? (rowData.option_will_fund?.lease_fee_base_msat / 1000) + ' Sats' : '') + (rowData.option_will_fund?.lease_fee_basis ? ((rowData.option_will_fund?.lease_fee_basis / 100) + '%') : '') +
          (rowData.option_will_fund?.channel_fee_max_base_msat ? (rowData.option_will_fund?.channel_fee_max_base_msat / 1000) + ' Sats' : '') + (rowData.option_will_fund?.channel_fee_max_proportional_thousandths ? (rowData.option_will_fund?.channel_fee_max_proportional_thousandths * 1000) + ' ppm' : '') +
          (rowData.address_types ? rowData.address_types.reduce((acc, curr) => acc + (curr === 'tor' ? ' tor' : curr === 'ipv' ? ' clearnet' : (' ' + curr.toLowerCase())), '') : '');
          break;

        case 'alias':
          rowToFilter = ((rowData?.alias?.toLowerCase() || ' ') + rowData?.address_types?.reduce((acc, curr) => acc + (!curr ? '' : (curr === 'ipv' ? 'clearnet' : curr)), ' ')) || '';
          break;

        case 'last_timestamp':
          rowToFilter = this.datePipe.transform(new Date((rowData.last_timestamp || 0) * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() || '';
          break;

        case 'compact_lease':
          rowToFilter = rowData?.option_will_fund?.compact_lease?.toLowerCase() || '';
          break;

        case 'lease_fee':
          rowToFilter = ((((rowData.option_will_fund?.lease_fee_base_msat || 0) / 1000) + ' sats ' || ' ') + (((rowData.option_will_fund?.lease_fee_basis || 0) / 100) + '%')) || '';
          break;

        case 'routing_fee':
          rowToFilter = ((((rowData.option_will_fund?.channel_fee_max_base_msat || 0) / 1000) + ' sats ' || ' ') + (((rowData.option_will_fund?.channel_fee_max_proportional_thousandths || 0) * 1000) + ' ppm')) || '';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return rowToFilter.includes(fltr);
    };
  }

  loadLiqNodesTable(liqNodes: LookupNode[]) {
    this.liquidityNodes = new MatTableDataSource<LookupNode>([...liqNodes]);
    this.liquidityNodes.sort = this.sort;
    this.liquidityNodes.paginator = this.paginator;
    if (this.sort) { this.sort.sort({ id: 'channelOpeningFee', start: 'asc', disableClear: true }); }
    this.liquidityNodes.filterPredicate = (node: LookupNode, fltr: string) => {
      const newNode = ((node.alias) ? node.alias.toLocaleLowerCase() : '') + (node.channel_opening_fee ? node.channel_opening_fee + ' Sats' : '') +
      (node.option_will_fund?.lease_fee_base_msat ? (node.option_will_fund?.lease_fee_base_msat / 1000) + ' Sats' : '') + (node.option_will_fund?.lease_fee_basis ? (this.decimalPipe.transform(node.option_will_fund?.lease_fee_basis / 100, '1.2-2') + '%') : '') +
      (node.option_will_fund?.channel_fee_max_base_msat ? (node.option_will_fund?.channel_fee_max_base_msat / 1000) + ' Sats' : '') + (node.option_will_fund?.channel_fee_max_proportional_thousandths ? (node.option_will_fund?.channel_fee_max_proportional_thousandths * 1000) + ' ppm' : '') +
      (node.address_types ? node.address_types.reduce((acc, curr) => acc + (curr === 'tor' ? ' tor' : curr === 'ipv' ? ' clearnet' : (' ' + curr.toLowerCase())), '') : '');
      return newNode.includes(fltr);
    };
    this.applyFilter();
    this.liquidityNodes.paginator = this.paginator;
    // this.liquidityNodes.filterPredicate = (rowData: LookupNode, fltr: string) => rowData.channel_count >= this.channel_count && rowData.node_capacity >= this.node_capacity;
    // this.onFilter();
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
      feeRate: this.channel_opening_feeRate,
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
    const addArr = lqNode.addresses?.reduce((acc, curr) => {
      if (curr.address && curr.address.length > 40) { curr.address = curr.address.substring(0, 39) + '...'; }
      return acc.concat(JSON.stringify(curr).replace('{', '').replace('}', '').replace(/:/g, ': ').replace(/,/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;').replace(/"/g, ''));
    }, <any>[]);
    const featureDescriptions: string[] = [];
    if (lqNode.features && lqNode.features.trim() !== '') {
      const featureHex = parseInt(lqNode.features, 16);
      NODE_FEATURES_CLN.forEach((feature) => {
        if (featureHex & (1 << feature.range.min)) {
          featureDescriptions.push('Mandatory: ' + feature.description);
        } else if (featureHex & (1 << feature.range.max)) {
          featureDescriptions.push('Optional: ' + feature.description);
        }
      });
    }
    const reorderedLQNode = [
      [{ key: 'alias', value: lqNode.alias, title: 'Node Alias', width: 50, type: DataTypeEnum.STRING },
      { key: 'last_timestamp', value: lqNode.last_timestamp, title: 'Last Timestamp', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'nodeid', value: lqNode.nodeid, title: 'Node ID', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'compact_lease', value: lqNode.option_will_fund?.compact_lease, title: 'Compact Lease', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'base_fee', value: lqNode.option_will_fund?.lease_fee_base_msat ? (lqNode.option_will_fund.lease_fee_base_msat / 1000) : 0, title: 'Lease Base Fee (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'fee_basis', value: lqNode.option_will_fund?.lease_fee_basis, title: 'Lease Base Basis (bps)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'channel_max_base', value: lqNode.option_will_fund?.channel_fee_max_base_msat ? (lqNode.option_will_fund.channel_fee_max_base_msat / 1000) : 0, title: 'Max Channel Routing Base Fee (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'channel_max_rate', value: (lqNode.option_will_fund?.channel_fee_max_proportional_thousandths || 0) * 1000, title: 'Max Channel Routing Fee Rate (ppm)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'funding_rate', value: lqNode.option_will_fund?.funding_weight, title: 'Funding Weight', width: 100, type: DataTypeEnum.NUMBER }],
      [{ key: 'features', value: featureDescriptions, title: 'Features', width: 100, type: DataTypeEnum.ARRAY }],
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
    this.rtlEffects.closeConfirm.pipe(takeUntil(this.unSubs[2])).subscribe((confirmRes) => {
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
    this.node_capacity = 0;
    this.channel_count = 0;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
