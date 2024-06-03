import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { Channel, GetInfo, PendingChannels, PendingClosingChannel, PendingForceClosingChannel, PendingOpenChannel, WaitingCloseChannel } from '../../../../../shared/models/lndModels';
import { AlertTypeEnum, APICallStatusEnum, DataTypeEnum, getPaginatorLabel, LND_DEFAULT_PAGE_SETTINGS, PAGE_SIZE, ScreenSizeEnum, SortOrderEnum } from '../../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { Node } from '../../../../../shared/models/RTLconfig';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';
import { BumpFeeComponent } from '../../bump-fee-modal/bump-fee.component';

import { openAlert } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../../store/rtl.selector';
import { lndNodeInformation, lndPageSettings, pendingChannels } from '../../../../store/lnd.selector';
import { PageSettings, TableSetting } from '../../../../../shared/models/pageSettings';
import { MessageDataField } from '../../../../../shared/models/alertData';

@Component({
  selector: 'rtl-channel-pending-table',
  templateUrl: './channel-pending-table.component.html',
  styleUrls: ['./channel-pending-table.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class ChannelPendingTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  public PAGE_ID = 'peers_channels';
  public openTableSetting: TableSetting = { tableId: 'pending_open', recordsPerPage: PAGE_SIZE, sortBy: 'capacity', sortOrder: SortOrderEnum.DESCENDING };
  public forceClosingTableSetting: TableSetting = { tableId: 'pending_force_closing', recordsPerPage: PAGE_SIZE, sortBy: 'limbo_balance', sortOrder: SortOrderEnum.DESCENDING };
  public closingTableSetting: TableSetting = { tableId: 'pending_closing', recordsPerPage: PAGE_SIZE, sortBy: 'capacity', sortOrder: SortOrderEnum.DESCENDING };
  public waitingCloseTableSetting: TableSetting = { tableId: 'pending_waiting_close', recordsPerPage: PAGE_SIZE, sortBy: 'limbo_balance', sortOrder: SortOrderEnum.DESCENDING };
  public selNode: Node | null;
  public information: GetInfo = {};
  public pendingChannels: PendingChannels = {};
  public displayedOpenColumns: any[] = [];
  public pendingOpenChannelsLength = 0;
  public pendingOpenChannels: any = new MatTableDataSource<PendingOpenChannel>([]);
  public displayedForceClosingColumns: any[] = [];
  public pendingForceClosingChannelsLength = 0;
  public pendingForceClosingChannels: any = new MatTableDataSource<PendingForceClosingChannel>([]);
  public displayedClosingColumns: any[] = [];
  public pendingClosingChannelsLength = 0;
  public pendingClosingChannels: any = new MatTableDataSource<PendingClosingChannel>([]);
  public displayedWaitClosingColumns: any[] = [];
  public pendingWaitClosingChannelsLength = 0;
  public pendingWaitClosingChannels: any = new MatTableDataSource<WaitingCloseChannel>([]);
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: Node | null) => { this.selNode = nodeSettings; });
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => { this.information = nodeInfo; });
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[2])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.openTableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.openTableSetting.tableId) || LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.openTableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedOpenColumns = JSON.parse(JSON.stringify(this.openTableSetting.columnSelectionSM));
        } else {
          this.displayedOpenColumns = JSON.parse(JSON.stringify(this.openTableSetting.columnSelection));
        }
        this.displayedOpenColumns.push('actions');
        this.logger.info(this.displayedOpenColumns);
        this.forceClosingTableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.forceClosingTableSetting.tableId) ||
          LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.forceClosingTableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedForceClosingColumns = JSON.parse(JSON.stringify(this.forceClosingTableSetting.columnSelectionSM));
        } else {
          this.displayedForceClosingColumns = JSON.parse(JSON.stringify(this.forceClosingTableSetting.columnSelection));
        }
        this.displayedForceClosingColumns.push('actions');
        this.logger.info(this.displayedForceClosingColumns);
        this.closingTableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.closingTableSetting.tableId) ||
          LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.closingTableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedClosingColumns = JSON.parse(JSON.stringify(this.closingTableSetting.columnSelectionSM));
        } else {
          this.displayedClosingColumns = JSON.parse(JSON.stringify(this.closingTableSetting.columnSelection));
        }
        this.displayedClosingColumns.push('actions');
        this.logger.info(this.displayedClosingColumns);
        this.waitingCloseTableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.waitingCloseTableSetting.tableId) ||
          LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.waitingCloseTableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedWaitClosingColumns = JSON.parse(JSON.stringify(this.waitingCloseTableSetting.columnSelectionSM));
        } else {
          this.displayedWaitClosingColumns = JSON.parse(JSON.stringify(this.waitingCloseTableSetting.columnSelection));
        }
        this.displayedWaitClosingColumns.push('actions');
        this.logger.info(this.displayedWaitClosingColumns);
      });
    this.store.select(pendingChannels).pipe(takeUntil(this.unSubs[3])).
      subscribe((pendingChannelsSelector: { pendingChannels: PendingChannels, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = pendingChannelsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.pendingChannels = pendingChannelsSelector.pendingChannels;
        if (this.pendingChannels.pending_open_channels && this.pendingChannels.pending_open_channels.length && this.pendingChannels.pending_open_channels.length > 0) {
          this.loadOpenChannelsTable(this.pendingChannels.pending_open_channels);
        }
        if (this.pendingChannels.pending_force_closing_channels && this.pendingChannels.pending_force_closing_channels.length && this.pendingChannels.pending_force_closing_channels.length > 0) {
          this.loadForceClosingChannelsTable(this.pendingChannels.pending_force_closing_channels);
        }
        if (this.pendingChannels.pending_closing_channels && this.pendingChannels.pending_closing_channels.length && this.pendingChannels.pending_closing_channels.length > 0) {
          this.loadClosingChannelsTable(this.pendingChannels.pending_closing_channels);
        }
        if (this.pendingChannels.waiting_close_channels && this.pendingChannels.waiting_close_channels.length && this.pendingChannels.waiting_close_channels.length > 0) {
          this.loadWaitClosingChannelsTable(this.pendingChannels.waiting_close_channels);
        }
        this.logger.info(pendingChannelsSelector);
      });
  }

  ngAfterViewInit() {
    if (this.pendingChannels.pending_open_channels && this.pendingChannels.pending_open_channels.length && this.pendingChannels.pending_open_channels.length > 0) {
      this.loadOpenChannelsTable(this.pendingChannels.pending_open_channels);
    }
    if (this.pendingChannels.pending_force_closing_channels && this.pendingChannels.pending_force_closing_channels.length && this.pendingChannels.pending_force_closing_channels.length > 0) {
      this.loadForceClosingChannelsTable(this.pendingChannels.pending_force_closing_channels);
    }
    if (this.pendingChannels.pending_closing_channels && this.pendingChannels.pending_closing_channels.length && this.pendingChannels.pending_closing_channels.length > 0) {
      this.loadClosingChannelsTable(this.pendingChannels.pending_closing_channels);
    }
    if (this.pendingChannels.waiting_close_channels && this.pendingChannels.waiting_close_channels.length && this.pendingChannels.waiting_close_channels.length > 0) {
      this.loadWaitClosingChannelsTable(this.pendingChannels.waiting_close_channels);
    }
  }

  onOpenClick(selChannel: any) {
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['commit_weight', 'confirmation_height', 'fee_per_kw', 'commit_fee'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['remote_alias', 'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel: MessageDataField[][] = [
      [{ key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING, explorerLink: 'tx' }],
      [{ key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'remote_alias', value: preOrderedChannel.remote_alias, title: 'Peer Alias', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'confirmation_height', value: preOrderedChannel.confirmation_height, title: 'Confirmation Height', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 25, type: DataTypeEnum.NUMBER }],
      [{ key: 'fee_per_kw', value: preOrderedChannel.fee_per_kw, title: 'Fee/KW', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'commit_weight', value: preOrderedChannel.commit_weight, title: 'Commit Weight', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'commit_fee', value: preOrderedChannel.commit_fee, title: 'Commit Fee', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Opening Channel Information',
          message: reorderedChannel
        }
      }
    }));
  }

  onBumpFee(selChannel: PendingOpenChannel) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          pendingChannel: selChannel,
          component: BumpFeeComponent
        }
      }
    }));
  }

  onForceClosingClick(selChannel: any) {
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['closing_txid', 'limbo_balance', 'maturity_height', 'blocks_til_maturity', 'recovered_balance'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['remote_alias', 'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel: MessageDataField[][] = [
      [{ key: 'closing_txid', value: preOrderedChannel.closing_txid, title: 'Closing Transaction ID', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING, explorerLink: 'tx' }],
      [{ key: 'remote_alias', value: preOrderedChannel.remote_alias, title: 'Peer Alias', width: 25, type: DataTypeEnum.STRING },
      { key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 75, type: DataTypeEnum.STRING }],
      [{ key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'limbo_balance', value: preOrderedChannel.limbo_balance, title: 'Limbo Balance', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 25, type: DataTypeEnum.NUMBER }],
      [{ key: 'maturity_height', value: preOrderedChannel.maturity_height, title: 'Maturity Height', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'blocks_til_maturity', value: preOrderedChannel.blocks_til_maturity, title: 'Blocks Till Maturity', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'recovered_balance', value: preOrderedChannel.recovered_balance, title: 'Recovered Balance', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Force Closing Channel Information',
          message: reorderedChannel
        }
      }
    }));
  }

  onClosingClick(selChannel: any) {
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['closing_txid'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['remote_alias', 'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel: MessageDataField[][] = [
      [{ key: 'closing_txid', value: preOrderedChannel.closing_txid, title: 'Closing Transaction ID', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING, explorerLink: 'tx' }],
      [{ key: 'remote_alias', value: preOrderedChannel.remote_alias, title: 'Peer Alias', width: 25, type: DataTypeEnum.STRING },
      { key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 75, type: DataTypeEnum.STRING }],
      [{ key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Closing Channel Information',
          message: reorderedChannel
        }
      }
    }));
  }

  onWaitClosingClick(selChannel: any) {
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['limbo_balance'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['remote_alias', 'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const fcChannelObj3 = JSON.parse(JSON.stringify(selChannel.commitments, ['local_txid'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2, fcChannelObj3);
    const reorderedChannel: MessageDataField[][] = [
      [{ key: 'local_txid', value: preOrderedChannel.local_txid, title: 'Transaction ID', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING, explorerLink: 'tx' }],
      [{ key: 'remote_alias', value: preOrderedChannel.remote_alias, title: 'Peer Alias', width: 25, type: DataTypeEnum.STRING },
      { key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 75, type: DataTypeEnum.STRING }],
      [{ key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'limbo_balance', value: preOrderedChannel.limbo_balance, title: 'Limbo Balance', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 25, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Wait Closing Channel Information',
          message: reorderedChannel
        }
      }
    }));
  }

  loadOpenChannelsTable(channels) {
    this.pendingOpenChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingOpenChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingOpenChannels.sort = this.sort;
    this.pendingOpenChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.logger.info(this.pendingOpenChannels);
  }

  loadForceClosingChannelsTable(channels) {
    this.pendingForceClosingChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingForceClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingForceClosingChannels.sort = this.sort;
    this.pendingForceClosingChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.logger.info(this.pendingForceClosingChannels);
  }

  loadClosingChannelsTable(channels) {
    this.pendingClosingChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingClosingChannels.sort = this.sort;
    this.pendingClosingChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.logger.info(this.pendingClosingChannels);
  }

  loadWaitClosingChannelsTable(channels) {
    this.pendingWaitClosingChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingWaitClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingWaitClosingChannels.sort = this.sort;
    this.pendingWaitClosingChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.logger.info(this.pendingWaitClosingChannels);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
