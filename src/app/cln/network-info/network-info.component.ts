import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faBolt, faServer, faNetworkWired, faLink } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Fees, ChannelsStatus, FeeRates, ForwardingEvent, LocalRemoteBalance, Channel } from '../../shared/models/clnModels';
import { APICallStatusEnum, ScreenSizeEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';

import { RTLState } from '../../store/rtl.state';
import { channels, feeRatesPerKB, feeRatesPerKW, fees, forwardingHistory, localRemoteBalance, nodeInfoAndNodeSettingsAndAPIsStatus } from '../store/cln.selector';

@Component({
  selector: 'rtl-cln-network-info',
  templateUrl: './network-info.component.html',
  styleUrls: ['./network-info.component.scss']
})
export class CLNNetworkInfoComponent implements OnInit, OnDestroy {

  public faBolt = faBolt;
  public faServer = faServer;
  public faNetworkWired = faNetworkWired;
  public faLink = faLink;
  public selNode: SelNodeChild = {};
  public information: GetInfo = {};
  public fees: Fees;
  public channelsStatus: ChannelsStatus = { active: {}, pending: {}, inactive: {} };
  public feeRatesPerKB: FeeRates = {};
  public feeRatesPerKW: FeeRates = {};
  public nodeCardsOperator = [];
  public nodeCardsMerchant = [];
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public userPersonaEnum = UserPersonaEnum;
  public errorMessages = ['', '', '', '', '', '', ''];
  public apiCallStatusNodeInfo: ApiCallStatusPayload = null;
  public apiCallStatusLRBal: ApiCallStatusPayload = null;
  public apiCallStatusChannels: ApiCallStatusPayload = null;
  public apiCallStatusFees: ApiCallStatusPayload = null;
  public apiCallStatusFHistory: ApiCallStatusPayload = null;
  public apiCallStatusPerKB: ApiCallStatusPayload = null;
  public apiCallStatusPerKW: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.nodeCardsMerchant = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 6, rows: 3 },
        { id: 'status', icon: this.faNetworkWired, title: 'Channels', cols: 6, rows: 3 },
        { id: 'fee', icon: this.faBolt, title: 'Routing Fee', cols: 6, rows: 1 },
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 4, rows: 4 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 4, rows: 4 },
        { id: 'onChainFeeEstimates', icon: this.faLink, title: 'Onchain Fee Estimates (Sats)', cols: 4, rows: 4 }
      ];
      this.nodeCardsOperator = [
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 4, rows: 4 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 4, rows: 4 },
        { id: 'onChainFeeEstimates', icon: this.faLink, title: 'Onchain Fee Estimates (Sats)', cols: 4, rows: 4 }
      ];
    } else {
      this.nodeCardsMerchant = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 2, rows: 3 },
        { id: 'status', icon: this.faNetworkWired, title: 'Channels', cols: 2, rows: 3 },
        { id: 'fee', icon: this.faBolt, title: 'Routing Fee', cols: 2, rows: 3 },
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 2, rows: 4 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 2, rows: 4 },
        { id: 'onChainFeeEstimates', icon: this.faLink, title: 'Onchain Fee Estimates (Sats)', cols: 2, rows: 4 }
      ];
      this.nodeCardsOperator = [
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 2, rows: 4 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 2, rows: 4 },
        { id: 'onChainFeeEstimates', icon: this.faLink, title: 'Onchain Fee Estimates (Sats)', cols: 2, rows: 4 }
      ];
    }
  }

  ngOnInit() {
    this.store.select(nodeInfoAndNodeSettingsAndAPIsStatus).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoSettingsStatusSelector: { information: GetInfo, nodeSettings: SelNodeChild, apisCallStatus: ApiCallStatusPayload[] }) => {
        this.errorMessages[0] = '';
        this.apiCallStatusNodeInfo = infoSettingsStatusSelector.apisCallStatus[0];
        if (this.apiCallStatusNodeInfo.status === APICallStatusEnum.ERROR) {
          this.errorMessages[0] = (typeof (this.apiCallStatusNodeInfo.message) === 'object') ? JSON.stringify(this.apiCallStatusNodeInfo.message) : this.apiCallStatusNodeInfo.message;
        }
        this.selNode = infoSettingsStatusSelector.nodeSettings;
        this.information = infoSettingsStatusSelector.information;
        this.logger.info(infoSettingsStatusSelector);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[1]),
      withLatestFrom(this.store.select(localRemoteBalance))).
      subscribe(([channelsSeletor, lrBalanceSeletor]: [{ activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], apiCallStatus: ApiCallStatusPayload }, { localRemoteBalance: LocalRemoteBalance, apiCallStatus: ApiCallStatusPayload }]) => {
        this.errorMessages[2] = '';
        this.errorMessages[3] = '';
        this.apiCallStatusLRBal = channelsSeletor.apiCallStatus;
        this.apiCallStatusChannels = lrBalanceSeletor.apiCallStatus;
        if (this.apiCallStatusLRBal.status === APICallStatusEnum.ERROR) {
          this.errorMessages[2] = (typeof (this.apiCallStatusLRBal.message) === 'object') ? JSON.stringify(this.apiCallStatusLRBal.message) : this.apiCallStatusLRBal.message;
        }
        if (this.apiCallStatusChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[3] = (typeof (this.apiCallStatusChannels.message) === 'object') ? JSON.stringify(this.apiCallStatusChannels.message) : this.apiCallStatusChannels.message;
        }
        this.channelsStatus.active.channels = channelsSeletor.activeChannels.length || 0;
        this.channelsStatus.pending.channels = channelsSeletor.pendingChannels.length || 0;
        this.channelsStatus.inactive.channels = channelsSeletor.inactiveChannels.length || 0;
        this.channelsStatus.active.capacity = lrBalanceSeletor.localRemoteBalance.localBalance || 0;
        this.channelsStatus.pending.capacity = lrBalanceSeletor.localRemoteBalance.pendingBalance || 0;
        this.channelsStatus.inactive.capacity = lrBalanceSeletor.localRemoteBalance.inactiveBalance || 0;
      });
    this.store.select(fees).pipe(takeUntil(this.unSubs[2])).
      subscribe((feesSeletor: { fees: Fees, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[1] = '';
        this.apiCallStatusFees = feesSeletor.apiCallStatus;
        if (this.apiCallStatusFees.status === APICallStatusEnum.ERROR) {
          this.errorMessages[1] = (typeof (this.apiCallStatusFees.message) === 'object') ? JSON.stringify(this.apiCallStatusFees.message) : this.apiCallStatusFees.message;
        }
        this.fees = feesSeletor.fees;
      });
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[3])).
      subscribe((fhSeletor: { forwardingHistory: ForwardingEvent[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[4] = '';
        this.apiCallStatusFHistory = fhSeletor.apiCallStatus;
        if (this.apiCallStatusFHistory.status === APICallStatusEnum.ERROR) {
          this.errorMessages[4] = (typeof (this.apiCallStatusFHistory.message) === 'object') ? JSON.stringify(this.apiCallStatusFHistory.message) : this.apiCallStatusFHistory.message;
        }
        if (fhSeletor.forwardingHistory && fhSeletor.forwardingHistory.length) {
          this.fees.totalTxCount = fhSeletor.forwardingHistory.length;
        }
      });
    this.store.select(feeRatesPerKB).pipe(takeUntil(this.unSubs[4])).
      subscribe((frbSeletor: { feeRatesPerKB: FeeRates, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[5] = '';
        this.apiCallStatusPerKB = frbSeletor.apiCallStatus;
        if (this.apiCallStatusPerKB.status === APICallStatusEnum.ERROR) {
          this.errorMessages[5] = (typeof (this.apiCallStatusPerKB.message) === 'object') ? JSON.stringify(this.apiCallStatusPerKB.message) : this.apiCallStatusPerKB.message;
        }
        this.feeRatesPerKB = frbSeletor.feeRatesPerKB;
      });
    this.store.select(feeRatesPerKW).pipe(takeUntil(this.unSubs[5])).
      subscribe((frwSeletor: { feeRatesPerKW: FeeRates, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[6] = '';
        this.apiCallStatusPerKW = frwSeletor.apiCallStatus;
        if (this.apiCallStatusPerKW.status === APICallStatusEnum.ERROR) {
          this.errorMessages[6] = (typeof (this.apiCallStatusPerKW.message) === 'object') ? JSON.stringify(this.apiCallStatusPerKW.message) : this.apiCallStatusPerKW.message;
        }
        this.feeRatesPerKW = frwSeletor.feeRatesPerKW;
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
