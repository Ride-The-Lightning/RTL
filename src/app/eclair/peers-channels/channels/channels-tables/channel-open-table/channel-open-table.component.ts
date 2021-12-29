import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Channel, ChannelsStatus, GetInfo, LightningBalance, OnChainBalance, Peer } from '../../../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, FEE_RATE_TYPES, AlertTypeEnum, APICallStatusEnum } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { ECLChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { RTLEffects } from '../../../../../store/rtl.effects';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { openAlert, openConfirmation } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { closeChannel, updateChannel } from '../../../../store/ecl.actions';
import { allChannelsInfo, eclNodeInformation, onchainBalance, peers } from '../../../../store/ecl.selector';

@Component({
  selector: 'rtl-ecl-channel-open-table',
  templateUrl: './channel-open-table.component.html',
  styleUrls: ['./channel-open-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class ECLChannelOpenTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faEye = faEye;
  public faEyeSlash = faEyeSlash
  public activeChannels: Channel[];
  public totalBalance = 0;
  public displayedColumns: any[] = [];
  public channels: any;
  public myChanPolicy: any = {};
  public information: GetInfo = {};
  public numPeers = -1;
  public feeRateTypes = FEE_RATE_TYPES;
  public selFilter = '';
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'toLocal', 'toRemote', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['shortChannelId', 'alias', 'toLocal', 'toRemote', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['shortChannelId', 'alias', 'feeBaseMsat', 'feeProportionalMillionths', 'toLocal', 'toRemote', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['shortChannelId', 'alias', 'feeBaseMsat', 'feeProportionalMillionths', 'toLocal', 'toRemote', 'balancedness', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(allChannelsInfo).pipe(takeUntil(this.unSubs[0])).
      subscribe((allChannelsSelector: ({ activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalance: LightningBalance, channelsStatus: ChannelsStatus, apiCallStatus: ApiCallStatusPayload })) => {
        this.errorMessage = '';
        this.apiCallStatus = allChannelsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.activeChannels = allChannelsSelector.activeChannels;
        if (this.activeChannels.length > 0 && this.sort && this.paginator) {
          this.loadChannelsTable();
        }
        this.logger.info(allChannelsSelector);
      });
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[1])).
      subscribe((nodeInfo: any) => {
        this.information = nodeInfo;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[2])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.numPeers = (peersSelector.peers && peersSelector.peers.length) ? peersSelector.peers.length : 0;
      });
    this.store.select(onchainBalance).pipe(takeUntil(this.unSubs[3])).
      subscribe((ocBalSelector: { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.totalBalance = ocBalSelector.onchainBalance.total;
      });
  }

  ngAfterViewInit() {
    if (this.activeChannels.length > 0 && this.sort && this.paginator) {
      this.loadChannelsTable();
    }
  }

  onChannelUpdate(channelToUpdate: Channel) {
    if (channelToUpdate !== 'all' && channelToUpdate.state !== 'NORMAL') {
      return;
    }
    const titleMsg = channelToUpdate === 'all' ? 'Update fee policy for all channels' :
      ('Update fee policy for Channel: ' + ((!channelToUpdate.alias && !channelToUpdate.shortChannelId) ? channelToUpdate.channelId : (channelToUpdate.alias && channelToUpdate.shortChannelId) ? channelToUpdate.alias + ' (' + channelToUpdate.shortChannelId + ')' : channelToUpdate.alias ? channelToUpdate.alias : channelToUpdate.shortChannelId));
    const confirmationMsg = [];
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Update Fee Policy',
          noBtnText: 'Cancel',
          yesBtnText: 'Update',
          message: confirmationMsg,
          titleMessage: titleMsg,
          flgShowInput: true,
          getInputs: [
            { placeholder: 'Base Fee (mSats)', inputType: 'number', inputValue: channelToUpdate && typeof channelToUpdate.feeBaseMsat !== 'undefined' ? channelToUpdate.feeBaseMsat : 1000, width: 48 },
            { placeholder: 'Fee Rate (mili mSats)', inputType: 'number', inputValue: channelToUpdate && typeof channelToUpdate.feeProportionalMillionths !== 'undefined' ? channelToUpdate.feeProportionalMillionths : 100, min: 1, width: 48, hintFunction: this.percentHintFunction }
          ]
        }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[4])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          let updateRequestPayload = null;
          if (this.commonService.isVersionCompatible(this.information.version, '0.6.2')) {
            let node_ids = '';
            if (channelToUpdate === 'all') {
              this.activeChannels.forEach((channel) => {
                node_ids = node_ids + ',' + channel.nodeId;
              });
              node_ids = node_ids.substring(1);
              updateRequestPayload = { baseFeeMsat: base_fee, feeRate: fee_rate, nodeIds: node_ids };
            } else {
              updateRequestPayload = { baseFeeMsat: base_fee, feeRate: fee_rate, nodeId: channelToUpdate.nodeId };
            }
          } else {
            let channel_ids = '';
            if (channelToUpdate === 'all') {
              this.activeChannels.forEach((channel) => {
                channel_ids = channel_ids + ',' + channel.channelId;
              });
              channel_ids = channel_ids.substring(1);
              updateRequestPayload = { baseFeeMsat: base_fee, feeRate: fee_rate, channelIds: channel_ids };
            } else {
              updateRequestPayload = { baseFeeMsat: base_fee, feeRate: fee_rate, channelId: channelToUpdate.channelId };
            }
          }
          this.store.dispatch(updateChannel({ payload: updateRequestPayload }));
        }
      });
    this.applyFilter();
  }

  percentHintFunction(feeProportionalMillionths) {
    return (feeProportionalMillionths / 10000).toString() + '%';
  }

  onChannelClose(channelToClose: Channel, forceClose: boolean) {
    const alertTitle = (forceClose) ? 'Force Close Channel' : 'Close Channel';
    const yesBtnText = (forceClose) ? 'Force Close' : 'Close Channel';
    const titleMessage = (forceClose) ?
      ('Force closing channel: ' + ((!channelToClose.alias && !channelToClose.shortChannelId) ? channelToClose.channelId : (channelToClose.alias && channelToClose.shortChannelId) ? channelToClose.alias + ' (' + channelToClose.shortChannelId + ')' : channelToClose.alias ? channelToClose.alias : channelToClose.shortChannelId)) :
      ('Closing channel: ' + ((!channelToClose.alias && !channelToClose.shortChannelId) ? channelToClose.channelId : (channelToClose.alias && channelToClose.shortChannelId) ? channelToClose.alias + ' (' + channelToClose.shortChannelId + ')' : channelToClose.alias ? channelToClose.alias : channelToClose.shortChannelId));
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: alertTitle,
          titleMessage: titleMessage,
          noBtnText: 'Cancel',
          yesBtnText: yesBtnText
        }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[5])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(closeChannel({ payload: { channelId: channelToClose.channelId, force: forceClose } }));
        }
      });
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: selChannel,
          channelsType: 'open',
          component: ECLChannelInformationComponent
        }
      }
    }));
  }

  loadChannelsTable() {
    this.activeChannels.sort((a, b) => ((a.alias === b.alias) ? 0 : ((b.alias) ? 1 : -1)));
    this.channels = new MatTableDataSource<Channel>([...this.activeChannels]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.channels.filterPredicate = (channel: Channel, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.channels.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.channels);
  }

  onDownloadCSV() {
    if (this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.channels.data, 'ActiveChannels');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
