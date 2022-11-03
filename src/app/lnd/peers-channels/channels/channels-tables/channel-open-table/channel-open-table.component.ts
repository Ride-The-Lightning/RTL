import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { ChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { SelNodeChild } from '../../../../../shared/models/RTLconfig';
import { BlockchainBalance, Channel, ChannelsSummary, GetInfo, LightningBalance, Peer } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, UserPersonaEnum, LoopTypeEnum, APICallStatusEnum, UI_MESSAGES, SortOrderEnum, LND_DEFAULT_PAGE_SETTINGS, LND_PAGE_DEFS } from '../../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { LoopService } from '../../../../../shared/services/loop.service';
import { CommonService } from '../../../../../shared/services/common.service';
import { ChannelRebalanceComponent } from '../../channel-rebalance-modal/channel-rebalance.component';
import { CloseChannelComponent } from '../../close-channel-modal/close-channel.component';
import { LoopModalComponent } from '../../../../../shared/components/ln-services/loop/loop-modal/loop-modal.component';

import { LNDEffects } from '../../../../store/lnd.effects';
import { RTLEffects } from '../../../../../store/rtl.effects';
import { RTLState } from '../../../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../../../store/rtl.actions';
import { channelLookup, fetchChannels, updateChannel } from '../../../../store/lnd.actions';
import { blockchainBalance, channels, lndNodeInformation, lndNodeSettings, lndPageSettings, peers } from '../../../../store/lnd.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../../../shared/pipes/app.pipe';

@Component({
  selector: 'rtl-channel-open-table',
  templateUrl: './channel-open-table.component.html',
  styleUrls: ['./channel-open-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class ChannelOpenTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs = LND_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'peers_channels';
  public tableSetting: TableSetting = { tableId: 'open', recordsPerPage: PAGE_SIZE, sortBy: 'balancedness', sortOrder: SortOrderEnum.DESCENDING };
  public timeUnit = 'mins:secs';
  public userPersonaEnum = UserPersonaEnum;
  public selNode: SelNodeChild | null = {};
  public totalBalance = 0;
  public displayedColumns: any[] = [];
  public channelsData: Channel[] = [];
  public channels: any = new MatTableDataSource([]);
  public myChanPolicy: any = {};
  public information: GetInfo = {};
  public numPeers = -1;
  public selFilter = '';
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public versionsArr: string[] = [];
  public faEye = faEye;
  public faEyeSlash = faEyeSlash;
  private targetConf = 6;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(
    private logger: LoggerService,
    private store: Store<RTLState>,
    private lndEffects: LNDEffects,
    private commonService: CommonService,
    private rtlEffects: RTLEffects,
    private decimalPipe: DecimalPipe,
    private loopService: LoopService,
    private router: Router,
    private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
    this.selFilter = this.router.getCurrentNavigation()?.extras?.state?.filter ? this.router.getCurrentNavigation()?.extras?.state?.filter : '';
  }

  ngOnInit() {
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeSettings) => {
        this.selNode = nodeSettings;
      });
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[1])).
      subscribe((nodeInfo: GetInfo) => {
        this.information = nodeInfo;
        if (this.information && this.information.version) {
          this.versionsArr = this.information.version.split('.');
        }
      });
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[2])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.unshift('private');
        this.displayedColumns.unshift('active');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[3])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.numPeers = (peersSelector.peers && peersSelector.peers.length) ? peersSelector.peers.length : 0;
      });
    this.store.select(blockchainBalance).pipe(takeUntil(this.unSubs[4])).
      subscribe((bcBalanceSelector: { blockchainBalance: BlockchainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.totalBalance = bcBalanceSelector.blockchainBalance?.total_balance ? +bcBalanceSelector.blockchainBalance?.total_balance : 0;
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[5])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.channelsData = this.calculateUptime(channelsSelector.channels);
        if (this.channelsData.length > 0) {
          this.loadChannelsTable(this.channelsData);
        }
        this.logger.info(channelsSelector);
      });
  }

  ngAfterViewInit() {
    if (this.channelsData.length > 0) {
      this.loadChannelsTable(this.channelsData);
    }
  }

  onViewRemotePolicy(selChannel: Channel) {
    this.store.dispatch(channelLookup({ payload: { uiMessage: UI_MESSAGES.GET_REMOTE_POLICY, channelID: selChannel.chan_id?.toString() + '/' + this.information.identity_pubkey } }));
    this.lndEffects.setLookup.pipe(take(1)).subscribe((resLookup): boolean | void => {
      if (!resLookup.fee_base_msat && !resLookup.fee_rate_milli_msat && !resLookup.time_lock_delta) {
        return false;
      }
      const reorderedChannelPolicy = [
        [{ key: 'fee_base_msat', value: resLookup.fee_base_msat, title: 'Base Fees (mSats)', width: 25, type: DataTypeEnum.NUMBER },
        { key: 'fee_rate_milli_msat', value: resLookup.fee_rate_milli_msat, title: 'Fee Rate (milli mSats)', width: 25, type: DataTypeEnum.NUMBER },
        { key: 'fee_rate_milli_msat', value: resLookup.fee_rate_milli_msat / 10000, title: 'Fee Rate (%)', width: 25, type: DataTypeEnum.NUMBER, digitsInfo: '1.0-8' },
        { key: 'time_lock_delta', value: resLookup.time_lock_delta, title: 'Time Lock Delta', width: 25, type: DataTypeEnum.NUMBER }]
      ];
      const titleMsg = 'Remote policy for Channel: ' + ((!selChannel.remote_alias && !selChannel.chan_id) ? selChannel.channel_point : (selChannel.remote_alias && selChannel.chan_id) ? selChannel.remote_alias + ' (' + selChannel.chan_id + ')' : selChannel.remote_alias ? selChannel.remote_alias : selChannel.chan_id);
      setTimeout(() => {
        this.store.dispatch(openAlert({
          payload: {
            data: {
              type: AlertTypeEnum.INFORMATION,
              alertTitle: 'Remote Channel Policy',
              titleMessage: titleMsg,
              message: reorderedChannelPolicy
            }
          }
        }));
      }, 0);
    });
  }

  onCircularRebalance(selChannel: any) {
    const channelsToRebalanceMessage = {
      channels: this.channelsData,
      selChannel: selChannel
    };
    this.store.dispatch(openAlert({
      payload: {
        data: {
          message: channelsToRebalanceMessage,
          component: ChannelRebalanceComponent
        }
      }
    }));
  }

  onChannelUpdate(channelToUpdate: any) {
    if (channelToUpdate === 'all') {
      const confirmationMsg = [];
      this.store.dispatch(openConfirmation({
        payload: {
          data: {
            type: AlertTypeEnum.CONFIRM,
            alertTitle: 'Update Fee Policy',
            noBtnText: 'Cancel',
            yesBtnText: 'Update All Channels',
            message: confirmationMsg,
            titleMessage: 'Update fee policy for all channels',
            flgShowInput: true,
            getInputs: [
              { placeholder: 'Base Fee (mSat)', inputType: DataTypeEnum.NUMBER, inputValue: 1000, width: 32 },
              { placeholder: 'Fee Rate (mili mSat)', inputType: DataTypeEnum.NUMBER, inputValue: 1, min: 1, width: 32, hintFunction: this.percentHintFunction },
              { placeholder: 'Time Lock Delta', inputType: DataTypeEnum.NUMBER, inputValue: 40, width: 32 }
            ]
          }
        }
      }));
      this.rtlEffects.closeConfirm.
        pipe(takeUntil(this.unSubs[6])).
        subscribe((confirmRes) => {
          if (confirmRes) {
            const base_fee = confirmRes[0].inputValue;
            const fee_rate = confirmRes[1].inputValue;
            const time_lock_delta = confirmRes[2].inputValue;
            this.store.dispatch(updateChannel({ payload: { baseFeeMsat: base_fee, feeRate: fee_rate, timeLockDelta: time_lock_delta, chanPoint: 'all' } }));
          }
        });
    } else {
      this.myChanPolicy = { fee_base_msat: 0, fee_rate_milli_msat: 0, time_lock_delta: 0, min_htlc_msat: 0, max_htlc_msat: 0 };
      this.store.dispatch(channelLookup({ payload: { uiMessage: UI_MESSAGES.GET_CHAN_POLICY, channelID: channelToUpdate.chan_id.toString() } }));
      this.lndEffects.setLookup.pipe(take(1)).subscribe((resLookup) => {
        if (resLookup.node1_pub === this.information.identity_pubkey) {
          this.myChanPolicy = resLookup.node1_policy;
        } else if (resLookup.node2_pub === this.information.identity_pubkey) {
          this.myChanPolicy = resLookup.node2_policy;
        } else {
          this.myChanPolicy = { fee_base_msat: 0, fee_rate_milli_msat: 0, time_lock_delta: 0 };
        }
        this.logger.info(this.myChanPolicy);
        const titleMsg = 'Update fee policy for Channel: ' + ((!channelToUpdate.remote_alias && !channelToUpdate.chan_id) ?
          channelToUpdate.channel_point : (channelToUpdate.remote_alias && channelToUpdate.chan_id) ? channelToUpdate.remote_alias +
          ' (' + channelToUpdate.chan_id + ')' : channelToUpdate.remote_alias ? channelToUpdate.remote_alias : channelToUpdate.chan_id);
        const confirmationMsg = [];
        setTimeout(() => {
          this.store.dispatch(openConfirmation({
            payload: {
              data: {
                type: AlertTypeEnum.CONFIRM,
                alertTitle: 'Update Fee Policy',
                titleMessage: titleMsg,
                noBtnText: 'Cancel',
                yesBtnText: 'Update Channel',
                message: confirmationMsg,
                flgShowInput: true,
                hasAdvanced: true,
                getInputs: [
                  { placeholder: 'Base Fee (mSat)', inputType: DataTypeEnum.NUMBER, inputValue: (this.myChanPolicy.fee_base_msat === '') ? 0 : this.myChanPolicy.fee_base_msat, width: 32 },
                  { placeholder: 'Fee Rate (mili mSat)', inputType: DataTypeEnum.NUMBER, inputValue: this.myChanPolicy.fee_rate_milli_msat, min: 1, width: 32, hintFunction: this.percentHintFunction },
                  { placeholder: 'Time Lock Delta', inputType: DataTypeEnum.NUMBER, inputValue: this.myChanPolicy.time_lock_delta, width: 32 },
                  { placeholder: 'Minimum HTLC (mSat)', inputType: DataTypeEnum.NUMBER, inputValue: (this.myChanPolicy.min_htlc === '') ? 0 : this.myChanPolicy.min_htlc, width: 49, advancedField: true },
                  { placeholder: 'Maximum HTLC (mSat)', inputType: DataTypeEnum.NUMBER, inputValue: (this.myChanPolicy.max_htlc_msat === '') ? 0 : this.myChanPolicy.max_htlc_msat, width: 49, advancedField: true }
                ]
              }
            }
          }));
        }, 0);
      });
      this.rtlEffects.closeConfirm.
        pipe(takeUntil(this.unSubs[7])).
        subscribe((confirmRes: boolean | any[]) => {
          if (confirmRes) {
            const updateChanPayload = {
              baseFeeMsat: confirmRes[0].inputValue,
              feeRate: confirmRes[1].inputValue,
              timeLockDelta: confirmRes[2].inputValue,
              chanPoint: channelToUpdate.channel_point
            };
            if ((<any[]>confirmRes).length > 3 && confirmRes[3] && confirmRes[4]) {
              updateChanPayload['minHtlcMsat'] = confirmRes[3].inputValue;
              updateChanPayload['maxHtlcMsat'] = confirmRes[4].inputValue;
            }
            this.store.dispatch(updateChannel({ payload: updateChanPayload }));
          }
        });
    }
    this.applyFilter();
  }

  onChannelClose(channelToClose: Channel) {
    if (channelToClose.active) {
      this.store.dispatch(fetchChannels()); // To get latest pending htlc status
    }
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: channelToClose,
          component: CloseChannelComponent
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
          component: ChannelInformationComponent
        }
      }
    }));
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.channels.filterPredicate = (rowData: Channel, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = ((rowData.active) ? 'active' : 'inactive') + (rowData.chan_id ? rowData.chan_id.toLowerCase() : '') +
          (rowData.remote_pubkey ? rowData.remote_pubkey.toLowerCase() : '') + (rowData.remote_alias ? rowData.remote_alias.toLowerCase() : '') +
          (rowData.capacity ? rowData.capacity : '') + (rowData.local_balance ? rowData.local_balance : '') +
          (rowData.remote_balance ? rowData.remote_balance : '') + (rowData.total_satoshis_sent ? rowData.total_satoshis_sent : '') +
          (rowData.total_satoshis_received ? rowData.total_satoshis_received : '') + (rowData.commit_fee ? rowData.commit_fee : '') +
          (rowData.private ? 'private' : 'public');
          break;

        case 'active':
          rowToFilter = rowData?.active ? 'active' : 'inactive';
          break;

        case 'private':
          rowToFilter = rowData?.private ? 'private' : 'public';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return this.selFilterBy === 'active' ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadChannelsTable(mychannels: Channel[]) {
    this.channels = new MatTableDataSource<Channel>([...mychannels]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.channels.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.channels.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.channels);
  }

  calculateUptime(channels: Channel[]) {
    const minutesDivider = 60;
    const hoursDivider = minutesDivider * 60;
    const daysDivider = hoursDivider * 24;
    const yearsDivider = daysDivider * 365;
    let maxDivider = minutesDivider;
    let minDivider = 1;
    let max_uptime = 0;
    channels.forEach((channel) => {
      if (channel.uptime && +channel.uptime > max_uptime) {
        max_uptime = +channel.uptime;
      }
    });
    switch (true) {
      case max_uptime < hoursDivider:
        this.timeUnit = 'Mins:Secs';
        maxDivider = minutesDivider;
        minDivider = 1;
        break;

      case max_uptime >= hoursDivider && max_uptime < daysDivider:
        this.timeUnit = 'Hrs:Mins';
        maxDivider = hoursDivider;
        minDivider = minutesDivider;
        break;

      case max_uptime >= daysDivider && max_uptime < yearsDivider:
        this.timeUnit = 'Days:Hrs';
        maxDivider = daysDivider;
        minDivider = hoursDivider;
        break;

      case max_uptime > yearsDivider:
        this.timeUnit = 'Yrs:Days';
        maxDivider = yearsDivider;
        minDivider = daysDivider;
        break;

      default:
        this.timeUnit = 'Mins:Secs';
        maxDivider = minutesDivider;
        minDivider = 1;
        break;
    }
    channels.forEach((channel) => {
      channel.uptime_str = channel.uptime ? (this.decimalPipe.transform(Math.floor(+channel.uptime / maxDivider), '2.0-0') + ':' + this.decimalPipe.transform(Math.round((+channel.uptime % maxDivider) / minDivider), '2.0-0')) : '---';
      channel.lifetime_str = channel.lifetime ? (this.decimalPipe.transform(Math.floor(+channel.lifetime / maxDivider), '2.0-0') + ':' + this.decimalPipe.transform(Math.round((+channel.lifetime % maxDivider) / minDivider), '2.0-0')) : '---';
    });
    return channels;
  }

  onLoopOut(selChannel: Channel) {
    this.loopService.getLoopOutTermsAndQuotes(this.targetConf).
      pipe(takeUntil(this.unSubs[8])).
      subscribe((response) => {
        this.store.dispatch(openAlert({
          payload: {
            minHeight: '56rem', data: {
              channel: selChannel,
              minQuote: response[0],
              maxQuote: response[1],
              direction: LoopTypeEnum.LOOP_OUT,
              component: LoopModalComponent
            }
          }
        }));
      });
  }

  onDownloadCSV() {
    if (this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.channels.data, 'Open-channels');
    }
  }

  percentHintFunction(fee_rate_milli_msat) {
    return (fee_rate_milli_msat / 10000).toString() + '%';
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
