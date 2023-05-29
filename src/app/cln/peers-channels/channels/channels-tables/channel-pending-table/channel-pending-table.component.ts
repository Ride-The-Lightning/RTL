import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { GetInfo, Channel, Balance } from '../../../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, FEE_RATE_TYPES, AlertTypeEnum, APICallStatusEnum, CLNChannelPendingState, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, CLN_PAGE_DEFS } from '../../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';
import { CLNChannelInformationComponent } from '../../channel-information-modal/channel-information.component';

import { RTLEffects } from '../../../../../store/rtl.effects';
import { CLNBumpFeeComponent } from '../../bump-fee-modal/bump-fee.component';
import { openAlert, openConfirmation } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { closeChannel } from '../../../../store/cln.actions';
import { channels, clnPageSettings, nodeInfoAndBalanceAndNumPeers } from '../../../../store/cln.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../../../shared/pipes/app.pipe';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

@Component({
  selector: 'rtl-cln-channel-pending-table',
  templateUrl: './channel-pending-table.component.html',
  styleUrls: ['./channel-pending-table.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class CLNChannelPendingTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faEye = faEye;
  public faEyeSlash = faEyeSlash;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'peers_channels';
  public tableSetting: TableSetting = { tableId: 'pending_inactive_channels', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.DESCENDING };
  public totalBalance = 0;
  public displayedColumns: any[] = [];
  public channelsData: Channel[] = [];
  public channels: any = new MatTableDataSource([]);
  public myChanPolicy: any = {};
  public information: GetInfo = {};
  public numPeers = -1;
  public feeRateTypes = FEE_RATE_TYPES;
  public selFilter = '';
  public CLNChannelPendingState = CLNChannelPendingState;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(nodeInfoAndBalanceAndNumPeers).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoBalNumpeersSelector: { information: GetInfo, balance: Balance, numPeers: number }) => {
        this.information = infoBalNumpeersSelector.information;
        this.numPeers = infoBalNumpeersSelector.numPeers;
        this.totalBalance = infoBalNumpeersSelector.balance.totalBalance || 0;
        this.logger.info(infoBalNumpeersSelector);
      });
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[1])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || CLN_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.unshift('private');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[2])).
      subscribe((channelsSeletor: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.channelsData = [...channelsSeletor.pendingChannels, ...channelsSeletor.inactiveChannels];
        this.channelsData = this.channelsData.sort((a, b) => ((this.CLNChannelPendingState[a.state || ''] >= this.CLNChannelPendingState[b.state || '']) ? 1 : -1));
        if (this.channelsData && this.channelsData.length > 0) {
          this.loadChannelsTable(this.channelsData);
        }
        this.logger.info(channelsSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.channelsData && this.channelsData.length > 0) {
      this.loadChannelsTable(this.channelsData);
    }
  }

  onBumpFee(selChannel: Channel) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: selChannel,
          component: CLNBumpFeeComponent
        }
      }
    }));
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: selChannel,
          showCopy: true,
          component: CLNChannelInformationComponent
        }
      }
    }));
  }

  onChannelClose(channelToClose: Channel) {
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Force Close Channel',
          titleMessage: 'Force closing channel: ' + ((!channelToClose.alias && !channelToClose.short_channel_id) ? channelToClose.channel_id :
            (channelToClose.alias && channelToClose.short_channel_id) ? channelToClose.alias + ' (' + channelToClose.short_channel_id + ')' :
              channelToClose.alias ? channelToClose.alias : channelToClose.short_channel_id),
          noBtnText: 'Cancel',
          yesBtnText: 'Force Close'
        }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[3])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(closeChannel({ payload: { id: channelToClose.id!, channelId: channelToClose.channel_id!, force: true } }));
        }
      });
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform((returnColumn.column || ''), '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.channels.filterPredicate = (rowData: Channel, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = ((rowData.peer_connected) ? 'connected' : 'disconnected') + (rowData.channel_id ? rowData.channel_id.toLowerCase() : '') +
          (rowData.short_channel_id ? rowData.short_channel_id.toLowerCase() : '') + (rowData.id ? rowData.id.toLowerCase() : '') + (rowData.alias ? rowData.alias.toLowerCase() : '') +
          (rowData.private ? 'private' : 'public') + ((rowData.state && this.CLNChannelPendingState[rowData.state]) ? this.CLNChannelPendingState[rowData.state].toLowerCase() : '') +
          (rowData.funding_txid ? rowData.funding_txid.toLowerCase() : '') + (rowData.to_us_msat ? rowData.to_us_msat : '') + (rowData.to_them_msat ? rowData.to_them_msat / 1000 : '') +
          (rowData.total_msat ? rowData.total_msat / 1000 : '') + (rowData.their_reserve_msat ? rowData.their_reserve_msat / 1000 : '') +
          (rowData.our_reserve_msat ? rowData.our_reserve_msat / 1000 : '') + (rowData.spendable_msat ? rowData.spendable_msat / 1000 : '');
          break;

        case 'private':
          rowToFilter = rowData?.private ? 'private' : 'public';
          break;

        case 'connected':
          rowToFilter = rowData?.peer_connected ? 'connected' : 'disconnected';
          break;

        case 'msatoshi_total':
          rowToFilter = ((rowData['total_msat'] || 0) / 1000)?.toString() || '';
          break;

        case 'spendable_msatoshi':
          rowToFilter = ((rowData['spendable_msat'] || 0) / 1000)?.toString() || '';
          break;

        case 'msatoshi_to_us':
          rowToFilter = ((rowData['to_us_msat'] || 0) / 1000)?.toString() || '';
          break;

        case 'msatoshi_to_them':
          rowToFilter = ((rowData['to_them_msat'] || 0) / 1000)?.toString() || '';
          break;

        case 'our_channel_reserve_satoshis':
          rowToFilter = ((rowData['our_reserve_msat'] || 0) / 1000)?.toString() || '';
          break;

        case 'their_channel_reserve_satoshis':
          rowToFilter = ((rowData['their_reserve_msat'] || 0) / 1000)?.toString() || '';
          break;

        case 'state':
          rowToFilter = rowData?.state ? this.CLNChannelPendingState[rowData?.state] : '';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return (this.selFilterBy === 'connected' || this.selFilterBy === 'state') ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadChannelsTable(mychannels) {
    this.channels = new MatTableDataSource<Channel>([...mychannels]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'msatoshi_total':
          return data['total_msat'];

        case 'spendable_msatoshi':
          return data['spendable_msat'];

        case 'msatoshi_to_us':
          return data['to_us_msat'];

        case 'msatoshi_to_them':
          return data['to_them_msat'];

        case 'our_channel_reserve_satoshis':
          return data['our_reserve_msat'];

        case 'their_channel_reserve_satoshis':
          return data['their_reserve_msat'];

        case 'state':
          return this.CLNChannelPendingState[data.state];

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.channels.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.channels);
  }

  onDownloadCSV() {
    if (this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.channels.data, 'Pending-inactive-channels');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
