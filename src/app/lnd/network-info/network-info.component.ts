import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faProjectDiagram, faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfo, NetworkInfo, Fees, ChannelsStatus, PendingChannels, PendingChannelsSummary, Channel, ChannelsSummary, LightningBalance } from '../../shared/models/lndModels';
import { Node } from '../../shared/models/RTLconfig';
import { CommonService } from '../../shared/services/common.service';
import { APICallStatusEnum, ScreenSizeEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { ApiCallsListLND, ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';

import { RTLState } from '../../store/rtl.state';
import { channels, fees, networkInfo, nodeInfoAndNodeSettingsAndAPIStatus, pendingChannels } from '../store/lnd.selector';

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
  public selNode: Node | null;
  public information: GetInfo = {};
  public fees: Fees;
  public channelsStatus: ChannelsStatus = {};
  public networkInfo: NetworkInfo = {};
  public networkCards: any[] = [];
  public nodeCards: any[] = [];
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public userPersonaEnum = UserPersonaEnum;
  public errorMessages = ['', '', '', '', ''];
  public apiCallStatusNodeInfo: ApiCallStatusPayload | null = null;
  public apiCallStatusNetwork: ApiCallStatusPayload | null = null;
  public apiCallStatusFees: ApiCallStatusPayload | null = null;
  public apiCallStatusChannels: ApiCallStatusPayload | null = null;
  public apiCallStatusPendingChannels: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

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
    this.store.select(nodeInfoAndNodeSettingsAndAPIStatus).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoSettingsStatusSelector: { information: GetInfo, nodeSettings: Node | null, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[0] = '';
        this.apiCallStatusNodeInfo = infoSettingsStatusSelector.apiCallStatus;
        if (this.apiCallStatusNodeInfo.status === APICallStatusEnum.ERROR) {
          this.errorMessages[0] = (typeof (this.apiCallStatusNodeInfo.message) === 'object') ? JSON.stringify(this.apiCallStatusNodeInfo.message) : this.apiCallStatusNodeInfo.message ? this.apiCallStatusNodeInfo.message : '';
        }
        this.selNode = infoSettingsStatusSelector.nodeSettings;
        this.information = infoSettingsStatusSelector.information;
      });
    this.store.select(networkInfo).pipe(takeUntil(this.unSubs[1])).
      subscribe((networkInfoSelector: { networkInfo: NetworkInfo, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[1] = '';
        this.apiCallStatusNetwork = networkInfoSelector.apiCallStatus;
        if (this.apiCallStatusNetwork.status === APICallStatusEnum.ERROR) {
          this.errorMessages[1] = (typeof (this.apiCallStatusNetwork.message) === 'object') ? JSON.stringify(this.apiCallStatusNetwork.message) : this.apiCallStatusNetwork.message ? this.apiCallStatusNetwork.message : '';
        }
        this.networkInfo = networkInfoSelector.networkInfo;
      });
    this.store.select(fees).pipe(takeUntil(this.unSubs[2])).
      subscribe((feesSelector: { fees: Fees, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[2] = '';
        this.apiCallStatusFees = feesSelector.apiCallStatus;
        if (this.apiCallStatusFees.status === APICallStatusEnum.ERROR) {
          this.errorMessages[2] = (typeof (this.apiCallStatusFees.message) === 'object') ? JSON.stringify(this.apiCallStatusFees.message) : this.apiCallStatusFees.message ? this.apiCallStatusFees.message : '';
        }
        this.fees = feesSelector.fees;
      });
    this.store.select(pendingChannels).pipe(takeUntil(this.unSubs[3])).
      subscribe((pendingChannelsSelector: { pendingChannels: PendingChannels, pendingChannelsSummary: PendingChannelsSummary, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[4] = '';
        this.apiCallStatusPendingChannels = pendingChannelsSelector.apiCallStatus;
        if (this.apiCallStatusPendingChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[4] = (typeof (this.apiCallStatusPendingChannels.message) === 'object') ? JSON.stringify(this.apiCallStatusPendingChannels.message) : this.apiCallStatusPendingChannels.message ? this.apiCallStatusPendingChannels.message : '';
        }
        this.channelsStatus.pending = { num_channels: pendingChannelsSelector.pendingChannelsSummary.open?.num_channels, capacity: pendingChannelsSelector.pendingChannelsSummary.open?.limbo_balance };
        this.channelsStatus.closing = {
          num_channels: (pendingChannelsSelector.pendingChannelsSummary.closing?.num_channels || 0) + (pendingChannelsSelector.pendingChannelsSummary.force_closing?.num_channels || 0) + (pendingChannelsSelector.pendingChannelsSummary.waiting_close?.num_channels || 0),
          capacity: pendingChannelsSelector.pendingChannelsSummary.total_limbo_balance
        };
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[4])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[3] = '';
        this.apiCallStatusChannels = channelsSelector.apiCallStatus;
        if (this.apiCallStatusChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[3] = (typeof (this.apiCallStatusChannels.message) === 'object') ? JSON.stringify(this.apiCallStatusChannels.message) : this.apiCallStatusChannels.message ? this.apiCallStatusChannels.message : '';
        }
        this.channelsStatus.active = channelsSelector.channelsSummary.active;
        this.channelsStatus.inactive = channelsSelector.channelsSummary.inactive;
        this.logger.info(channelsSelector);
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
