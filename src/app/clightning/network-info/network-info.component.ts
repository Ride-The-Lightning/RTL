import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Fees, ChannelsStatus, FeeRates } from '../../shared/models/clModels';
import { APICallStatusEnum, ScreenSizeEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { ApiCallsListCL } from '../../shared/models/apiCallsPayload';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';

import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-network-info',
  templateUrl: './network-info.component.html',
  styleUrls: ['./network-info.component.scss']
})
export class CLNetworkInfoComponent implements OnInit, OnDestroy {
  public faBolt = faBolt;
  public faServer = faServer;
  public faNetworkWired = faNetworkWired;
  public selNode: SelNodeChild = {};
  public information: GetInfo = {};
  public fees: Fees;
  public channelsStatus: ChannelsStatus = {};
  public feeRatesPerKB: FeeRates = {};
  public feeRatesPerKW: FeeRates = {};
  public nodeCardsOperator = [];
  public nodeCardsMerchant = [];
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public userPersonaEnum = UserPersonaEnum;
  public errorMessages = ['', '', '', '', '', '', ''];
  public apisCallStatus: ApiCallsListCL = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.nodeCardsMerchant = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 6, rows: 3 },
        { id: 'status', icon: this.faNetworkWired, title: 'Channels', cols: 6, rows: 3 },
        { id: 'fee', icon: this.faBolt, title: 'Routing Fee', cols: 6, rows: 1 },
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 6, rows: 4 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 6, rows: 4 }
      ];
      this.nodeCardsOperator = [
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 6, rows: 4 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 6, rows: 4 }
      ];
    } else {
      this.nodeCardsMerchant = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 2, rows: 3 },
        { id: 'status', icon: this.faNetworkWired, title: 'Channels', cols: 2, rows: 3 },
        { id: 'fee', icon: this.faBolt, title: 'Routing Fee', cols: 2, rows: 3 },
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 3, rows: 4 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 3, rows: 4 }
      ];
      this.nodeCardsOperator = [
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 3, rows: 4 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 3, rows: 4 }
      ];
    }
  }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.errorMessages = ['', '', '', '', '', '', ''];
      this.apisCallStatus = rtlStore.apisCallStatus;
      if (rtlStore.apisCallStatus.FetchInfo.status === APICallStatusEnum.ERROR) {
        this.errorMessages[0] = (typeof(this.apisCallStatus.FetchInfo.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchInfo.message) : this.apisCallStatus.FetchInfo.message;
      }
      if (rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.ERROR) {
        this.errorMessages[1] = (typeof(this.apisCallStatus.FetchFees.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchFees.message) : this.apisCallStatus.FetchFees.message;
      }
      if (rtlStore.apisCallStatus.FetchLocalRemoteBalance.status === APICallStatusEnum.ERROR) {
        this.errorMessages[2] = (typeof(this.apisCallStatus.FetchLocalRemoteBalance.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchLocalRemoteBalance.message) : this.apisCallStatus.FetchLocalRemoteBalance.message;
      }
      if (rtlStore.apisCallStatus.FetchChannels.status === APICallStatusEnum.ERROR) {
        this.errorMessages[3] = (typeof(this.apisCallStatus.FetchChannels.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchChannels.message) : this.apisCallStatus.FetchChannels.message;
      }
      if (rtlStore.apisCallStatus.GetForwardingHistory.status === APICallStatusEnum.ERROR) {
        this.errorMessages[4] = (typeof(this.apisCallStatus.GetForwardingHistory.message) === 'object') ? JSON.stringify(this.apisCallStatus.GetForwardingHistory.message) : this.apisCallStatus.GetForwardingHistory.message;
      }
      if (rtlStore.apisCallStatus.FetchFeeRatesperkb.status === APICallStatusEnum.ERROR) {
        this.errorMessages[5] = (typeof(this.apisCallStatus.FetchFeeRatesperkb.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchFeeRatesperkb.message) : this.apisCallStatus.FetchFeeRatesperkb.message;
      }
      if (rtlStore.apisCallStatus.FetchFeeRatesperkw.status === APICallStatusEnum.ERROR) {
        this.errorMessages[6] = (typeof(this.apisCallStatus.FetchFeeRatesperkw.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchFeeRatesperkw.message) : this.apisCallStatus.FetchFeeRatesperkw.message;
      }

      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.fees = rtlStore.fees;
      this.fees.totalTxCount = 0;

      if (rtlStore.forwardingHistory && rtlStore.forwardingHistory.forwarding_events && rtlStore.forwardingHistory.forwarding_events.length) {
        this.fees.totalTxCount = rtlStore.forwardingHistory.forwarding_events.filter(event => event.status === 'settled').length;
      }

      this.channelsStatus = {
        active: { channels: rtlStore.information.num_active_channels, capacity: 0 },
        inactive: { channels: rtlStore.information.num_inactive_channels, capacity: 0 },
        pending: { channels:  rtlStore.information.num_pending_channels, capacity: 0 }
      };

      this.feeRatesPerKB = rtlStore.feeRatesPerKB;
      this.feeRatesPerKW = rtlStore.feeRatesPerKW;

      this.logger.info(rtlStore);
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next(null);
      completeSub.complete();
    });
  }
}
