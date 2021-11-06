import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faProjectDiagram, faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfo, NetworkInfo, Fees, ChannelsStatus } from '../../shared/models/lndModels';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { CommonService } from '../../shared/services/common.service';
import { APICallStatusEnum, ScreenSizeEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { ApiCallsListLND } from '../../shared/models/apiCallsPayload';

import { RTLState } from '../../store/rtl.state';

@Component({
  selector: 'rtl-network-info',
  templateUrl: './network-info.component.html',
  styleUrls: ['./network-info.component.scss']
})
export class NetworkInfoComponent implements OnInit, OnDestroy {

  public faProjectDiagram = faProjectDiagram;
  public faBolt = faBolt;
  public faServer = faServer;
  public faNetworkWired = faNetworkWired;
  public selNode: SelNodeChild = {};
  public information: GetInfo = {};
  public fees: Fees;
  public channelsStatus: ChannelsStatus = {};
  public networkInfo: NetworkInfo = {};
  public networkCards = [];
  public nodeCards = [];
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public userPersonaEnum = UserPersonaEnum;
  public errorMessages = ['', '', '', '', ''];
  public apisCallStatus: ApiCallsListLND = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.networkCards = [
        { id: 'general', cols: 3, rows: 1 },
        { id: 'channels', cols: 3, rows: 1 },
        { id: 'degrees', cols: 3, rows: 1 }
      ];
      this.nodeCards = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 3, rows: 1 },
        { id: 'status', icon: this.faNetworkWired, title: 'Channels', cols: 3, rows: 1 },
        { id: 'fee', icon: this.faBolt, title: 'Routing Fee', cols: 3, rows: 1 }
      ];
    } else {
      this.networkCards = [
        { id: 'general', cols: 1, rows: 1 },
        { id: 'channels', cols: 1, rows: 1 },
        { id: 'degrees', cols: 1, rows: 1 }
      ];
      this.nodeCards = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 1, rows: 1 },
        { id: 'status', icon: this.faNetworkWired, title: 'Channels', cols: 1, rows: 1 },
        { id: 'fee', icon: this.faBolt, title: 'Routing Fee', cols: 1, rows: 1 }
      ];
    }
  }

  ngOnInit() {
    this.store.select('lnd').
      pipe(takeUntil(this.unSubs[0])).
      subscribe((rtlStore) => {
        this.errorMessages = ['', '', '', '', ''];
        this.apisCallStatus = rtlStore.apisCallStatus;
        if (rtlStore.apisCallStatus.FetchInfo.status === APICallStatusEnum.ERROR) {
          this.errorMessages[0] = (typeof (this.apisCallStatus.FetchInfo.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchInfo.message) : this.apisCallStatus.FetchInfo.message;
        }
        if (rtlStore.apisCallStatus.FetchNetwork.status === APICallStatusEnum.ERROR) {
          this.errorMessages[1] = (typeof (this.apisCallStatus.FetchNetwork.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchNetwork.message) : this.apisCallStatus.FetchNetwork.message;
        }
        if (rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.ERROR) {
          this.errorMessages[2] = (typeof (this.apisCallStatus.FetchFees.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchFees.message) : this.apisCallStatus.FetchFees.message;
        }
        if (rtlStore.apisCallStatus.FetchAllChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[3] = (typeof (this.apisCallStatus.FetchAllChannels.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchAllChannels.message) : this.apisCallStatus.FetchAllChannels.message;
        }
        if (rtlStore.apisCallStatus.FetchPendingChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[4] = (typeof (this.apisCallStatus.FetchPendingChannels.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchPendingChannels.message) : this.apisCallStatus.FetchPendingChannels.message;
        }

        this.selNode = rtlStore.nodeSettings;
        this.information = rtlStore.information;
        this.networkInfo = rtlStore.networkInfo;
        this.fees = rtlStore.fees;
        this.channelsStatus = {
          active: { channels: rtlStore.numberOfActiveChannels, capacity: rtlStore.totalCapacityActive },
          inactive: { channels: rtlStore.numberOfInactiveChannels, capacity: rtlStore.totalCapacityInactive },
          pending: { channels: rtlStore.numberOfPendingChannels.open.num_channels, capacity: rtlStore.numberOfPendingChannels.open.limbo_balance },
          closing: {
            channels: rtlStore.numberOfPendingChannels.closing.num_channels + rtlStore.numberOfPendingChannels.force_closing.num_channels + rtlStore.numberOfPendingChannels.waiting_close.num_channels,
            capacity: rtlStore.numberOfPendingChannels.total_limbo_balance
          }
        };
        this.logger.info(rtlStore);
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
