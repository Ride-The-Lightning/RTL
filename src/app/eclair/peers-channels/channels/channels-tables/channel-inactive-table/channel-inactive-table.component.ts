import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { Channel, ChannelsStatus, GetInfo, LightningBalance, OnChainBalance, Peer } from '../../../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, FEE_RATE_TYPES, AlertTypeEnum, APICallStatusEnum } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { ECLChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { RTLEffects } from '../../../../../store/rtl.effects';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { openAlert, openConfirmation } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { closeChannel } from '../../../../store/ecl.actions';
import { allChannelsInfo, eclNodeInformation, onchainBalance, peers } from '../../../../store/ecl.selector';

@Component({
  selector: 'rtl-ecl-channel-inactive-table',
  templateUrl: './channel-inactive-table.component.html',
  styleUrls: ['./channel-inactive-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class ECLChannelInactiveTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faEye = faEye;
  public faEyeSlash = faEyeSlash
  public inactiveChannels: Channel[];
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
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['state', 'alias', 'toLocal', 'toRemote', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['state', 'alias', 'toLocal', 'toRemote', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['state', 'shortChannelId', 'alias', 'toLocal', 'toRemote', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['state', 'shortChannelId', 'alias', 'toLocal', 'toRemote', 'balancedness', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(allChannelsInfo).pipe(takeUntil(this.unSubs[0])).
      subscribe((selAllChannels: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalance: LightningBalance, channelsStatus: ChannelsStatus, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = selAllChannels.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.inactiveChannels = selAllChannels.inactiveChannels;
        this.loadChannelsTable();
        this.logger.info(selAllChannels);
      });
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[1])).
      subscribe((nodeInfo: GetInfo) => {
        this.information = nodeInfo;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[2])).
      subscribe((selPeers: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.numPeers = (selPeers.peers && selPeers.peers.length) ? selPeers.peers.length : 0;
      });
    this.store.select(onchainBalance).pipe(takeUntil(this.unSubs[3])).
      subscribe((selOCBal: { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.totalBalance = selOCBal.onchainBalance.total;
      });
  }

  ngAfterViewInit() {
    if (this.inactiveChannels.length > 0) {
      this.loadChannelsTable();
    }
  }

  onChannelClose(channelToClose: Channel, forceClose: boolean) {
    const alertTitle = (forceClose) ? 'Force Close Channel' : 'Close Channel';
    const titleMessage = (forceClose) ? ('Force closing channel: ' + channelToClose.channelId) : ('Closing channel: ' + channelToClose.channelId);
    const yesBtnText = (forceClose) ? 'Force Close' : 'Close Channel';
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
      pipe(takeUntil(this.unSubs[4])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(closeChannel({ payload: { channelId: channelToClose.channelId, force: forceClose } }));
        }
      });
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLocaleLowerCase();
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: selChannel,
          channelsType: 'inactive',
          component: ECLChannelInformationComponent
        }
      }
    }));
  }

  loadChannelsTable() {
    this.inactiveChannels.sort((a, b) => ((a.alias === b.alias) ? 0 : ((b.alias) ? 1 : -1)));
    this.channels = new MatTableDataSource<Channel>([...this.inactiveChannels]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.channels.filterPredicate = (channel: Channel, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.channels.paginator = this.paginator;
    this.logger.info(this.channels);
  }

  onDownloadCSV() {
    if (this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.channels.data, 'InactiveChannels');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
