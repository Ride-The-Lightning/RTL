import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faProjectDiagram, faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfo, NetworkInfo, Fees, ChannelsStatus } from '../../shared/models/lndModels';
import { SelNodeChild } from '../../shared/models/RTLconfig';

import * as fromRTLReducer from '../../store/rtl.reducers';
import { CommonService } from '../../shared/services/common.service';
import { ScreenSizeEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';

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
  public flgLoading: Array<Boolean | 'error'> = [true, true, true, true, true, true];
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
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
      this.networkCards =  [
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
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchInfo') {
          this.flgLoading[0] = 'error';
        }
        if (effectsErr.action === 'FetchNetwork') {
          this.flgLoading[1] = 'error';
        }
        if (effectsErr.action === 'FetchFees') {
          this.flgLoading[2] = 'error';
        }
        if (effectsErr.action === 'FetchChannels/all') {
          this.flgLoading[3] = 'error';
        }
        if (effectsErr.action === 'FetchChannels/pending') {
          this.flgLoading[4] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( this.information.identity_pubkey) ? false : true;
      }

      this.networkInfo = rtlStore.networkInfo;
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = ( this.networkInfo.num_nodes) ? false : true;
      }

      this.fees = rtlStore.fees;
      if (this.flgLoading[2] !== 'error') {
        this.flgLoading[2] = ( this.fees.day_fee_sum) ? false : true;
      }
      this.channelsStatus = {
        active: { channels: rtlStore.numberOfActiveChannels, capacity: rtlStore.totalCapacityActive },
        inactive: { channels: rtlStore.numberOfInactiveChannels, capacity: rtlStore.totalCapacityInactive },
        pending: { channels:  rtlStore.numberOfPendingChannels.open.num_channels, capacity: rtlStore.numberOfPendingChannels.open.limbo_balance },
        closing: { 
          channels: rtlStore.numberOfPendingChannels.closing.num_channels + rtlStore.numberOfPendingChannels.force_closing.num_channels + rtlStore.numberOfPendingChannels.waiting_close.num_channels,
          capacity: rtlStore.numberOfPendingChannels.total_limbo_balance
        }
      };
      if (rtlStore.totalLocalBalance >= 0 && rtlStore.totalRemoteBalance >= 0 && this.flgLoading[3] !== 'error') {
        this.flgLoading[3] = false;
      }
      if (rtlStore.numberOfPendingChannels && this.flgLoading[4] !== 'error') {
        this.flgLoading[4] = false;
      }
      this.logger.info(rtlStore);
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
