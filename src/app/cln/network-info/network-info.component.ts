import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faBolt, faServer, faNetworkWired, faLink } from '@fortawesome/free-solid-svg-icons';

import { Node } from '../../shared/models/RTLconfig';
import { GetInfo, Fees, ChannelsStatus, FeeRates, LocalRemoteBalance, Channel, ListForwards, UTXO, Balance } from '../../shared/models/clnModels';
import { APICallStatusEnum, ScreenSizeEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';

import { RTLState } from '../../store/rtl.state';
import { channels, feeRatesPerKB, feeRatesPerKW, forwardingHistory, utxoBalances, nodeInfoAndNodeSettingsAndAPIsStatus } from '../store/cln.selector';

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
  public selNode: Node | null;
  public information: GetInfo = {};
  public fees: Fees;
  public channelsStatus: ChannelsStatus = { active: {}, pending: {}, inactive: {} };
  public feeRatesPerKB: FeeRates = {};
  public feeRatesPerKW: FeeRates = {};
  public nodeCardsOperator: any[] = [];
  public nodeCardsMerchant: any[] = [];
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public userPersonaEnum = UserPersonaEnum;
  public errorMessages = ['', '', '', '', '', ''];
  public apiCallStatusNodeInfo: ApiCallStatusPayload | null = null;
  public apiCallStatusLRBal: ApiCallStatusPayload | null = null;
  public apiCallStatusChannels: ApiCallStatusPayload | null = null;
  public apiCallStatusFHistory: ApiCallStatusPayload | null = null;
  public apiCallStatusPerKB: ApiCallStatusPayload | null = null;
  public apiCallStatusPerKW: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.nodeCardsMerchant = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 6, rows: 3 },
        { id: 'status', icon: this.faNetworkWired, title: 'Channels', cols: 6, rows: 3 },
        { id: 'fee', icon: this.faBolt, title: 'Routing Fee', cols: 6, rows: 1 },
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 4, rows: 6 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 4, rows: 6 },
        { id: 'onChainFeeEstimates', icon: this.faLink, title: 'Onchain Fee Estimates (Sats)', cols: 4, rows: 6 }
      ];
      this.nodeCardsOperator = [
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 4, rows: 6 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 4, rows: 6 },
        { id: 'onChainFeeEstimates', icon: this.faLink, title: 'Onchain Fee Estimates (Sats)', cols: 4, rows: 6 }
      ];
    } else {
      this.nodeCardsMerchant = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 2, rows: 3 },
        { id: 'status', icon: this.faNetworkWired, title: 'Channels', cols: 2, rows: 3 },
        { id: 'fee', icon: this.faBolt, title: 'Routing Fee', cols: 2, rows: 3 },
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 2, rows: 6 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 2, rows: 6 },
        { id: 'onChainFeeEstimates', icon: this.faLink, title: 'Onchain Fee Estimates (Sats)', cols: 2, rows: 6 }
      ];
      this.nodeCardsOperator = [
        { id: 'feeRatesKB', icon: this.faServer, title: 'Fee Rate Per KB', cols: 2, rows: 6 },
        { id: 'feeRatesKW', icon: this.faNetworkWired, title: 'Fee Rate Per KW', cols: 2, rows: 6 },
        { id: 'onChainFeeEstimates', icon: this.faLink, title: 'Onchain Fee Estimates (Sats)', cols: 2, rows: 6 }
      ];
    }
  }

  ngOnInit() {
    this.store.select(nodeInfoAndNodeSettingsAndAPIsStatus).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoSettingsStatusSelector: { information: GetInfo, nodeSettings: Node | null, fees: Fees, apisCallStatus: ApiCallStatusPayload[] }) => {
        this.errorMessages[0] = '';
        this.apiCallStatusNodeInfo = infoSettingsStatusSelector.apisCallStatus[0];
        if (this.apiCallStatusNodeInfo.status === APICallStatusEnum.ERROR) {
          this.errorMessages[0] = (typeof (this.apiCallStatusNodeInfo.message) === 'object') ? JSON.stringify(this.apiCallStatusNodeInfo.message) : this.apiCallStatusNodeInfo.message ? this.apiCallStatusNodeInfo.message : '';
        }
        this.selNode = infoSettingsStatusSelector.nodeSettings;
        this.information = infoSettingsStatusSelector.information;
        this.fees = infoSettingsStatusSelector.fees;
        this.logger.info(infoSettingsStatusSelector);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[1]),
      withLatestFrom(this.store.select(utxoBalances))).
      subscribe(([channelsSeletor, utxoBalancesSeletor]: [{ activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], apiCallStatus: ApiCallStatusPayload }, { utxos: UTXO[], balance: Balance, localRemoteBalance: LocalRemoteBalance, apiCallStatus: ApiCallStatusPayload }]) => {
        this.errorMessages[1] = '';
        this.errorMessages[2] = '';
        this.apiCallStatusLRBal = utxoBalancesSeletor.apiCallStatus;
        this.apiCallStatusChannels = channelsSeletor.apiCallStatus;
        if (this.apiCallStatusLRBal.status === APICallStatusEnum.ERROR) {
          this.errorMessages[1] = (typeof (this.apiCallStatusLRBal.message) === 'object') ? JSON.stringify(this.apiCallStatusLRBal.message) : this.apiCallStatusLRBal.message ? this.apiCallStatusLRBal.message : '';
        }
        if (this.apiCallStatusChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[2] = (typeof (this.apiCallStatusChannels.message) === 'object') ? JSON.stringify(this.apiCallStatusChannels.message) : this.apiCallStatusChannels.message ? this.apiCallStatusChannels.message : '';
        }
        this.channelsStatus.active.channels = channelsSeletor.activeChannels.length || 0;
        this.channelsStatus.pending.channels = channelsSeletor.pendingChannels.length || 0;
        this.channelsStatus.inactive.channels = channelsSeletor.inactiveChannels.length || 0;
        this.channelsStatus.active.capacity = utxoBalancesSeletor.localRemoteBalance.localBalance || 0;
        this.channelsStatus.pending.capacity = utxoBalancesSeletor.localRemoteBalance.pendingBalance || 0;
        this.channelsStatus.inactive.capacity = utxoBalancesSeletor.localRemoteBalance.inactiveBalance || 0;
      });
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[3])).
      subscribe((fhSeletor: { forwardingHistory: ListForwards, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[3] = '';
        this.apiCallStatusFHistory = fhSeletor.apiCallStatus;
        if (this.apiCallStatusFHistory.status === APICallStatusEnum.ERROR) {
          this.errorMessages[3] = (typeof (this.apiCallStatusFHistory.message) === 'object') ? JSON.stringify(this.apiCallStatusFHistory.message) : this.apiCallStatusFHistory.message ? this.apiCallStatusFHistory.message : '';
        }
        if (fhSeletor.forwardingHistory && fhSeletor.forwardingHistory.listForwards && fhSeletor.forwardingHistory.listForwards.length) {
          this.fees.totalTxCount = fhSeletor.forwardingHistory.listForwards.length;
        }
      });
    this.store.select(feeRatesPerKB).pipe(takeUntil(this.unSubs[4])).
      subscribe((frbSeletor: { feeRatesPerKB: FeeRates, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[4] = '';
        this.apiCallStatusPerKB = frbSeletor.apiCallStatus;
        if (this.apiCallStatusPerKB.status === APICallStatusEnum.ERROR) {
          this.errorMessages[4] = (typeof (this.apiCallStatusPerKB.message) === 'object') ? JSON.stringify(this.apiCallStatusPerKB.message) : this.apiCallStatusPerKB.message ? this.apiCallStatusPerKB.message : '';
        }
        this.feeRatesPerKB = frbSeletor.feeRatesPerKB;
      });
    this.store.select(feeRatesPerKW).pipe(takeUntil(this.unSubs[5])).
      subscribe((frwSeletor: { feeRatesPerKW: FeeRates, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[5] = '';
        this.apiCallStatusPerKW = frwSeletor.apiCallStatus;
        if (this.apiCallStatusPerKW.status === APICallStatusEnum.ERROR) {
          this.errorMessages[5] = (typeof (this.apiCallStatusPerKW.message) === 'object') ? JSON.stringify(this.apiCallStatusPerKW.message) : this.apiCallStatusPerKW.message ? this.apiCallStatusPerKW.message : '';
        }
        this.feeRatesPerKW = frwSeletor.feeRatesPerKW;
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
