import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfo, Fees, ChannelsStatus, FeeRates } from '../../shared/models/clModels';
import { SelNodeChild } from '../../shared/models/RTLconfig';

import * as fromRTLReducer from '../../store/rtl.reducers';
import { CommonService } from '../../shared/services/common.service';
import { ScreenSizeEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';

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
  feeRatesPerKB: FeeRates = {};
  feeRatesPerKW: FeeRates = {};
  public nodeCardsOperator = [];
  public nodeCardsMerchant = [];
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public userPersonaEnum = UserPersonaEnum;
  public flgLoading: Array<Boolean | 'error'> = [true, true, true];
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
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchInfo') {
          this.flgLoading[0] = 'error';
        }
        if (effectsErr.action === 'FetchFees') {
          this.flgLoading[1] = 'error';
        }
        if (effectsErr.action === 'FetchFeeRates') {
          this.flgLoading[2] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( this.information.id) ? false : true;
      }

      this.fees = rtlStore.fees;
      this.fees.totalTxCount = 0;
      if (rtlStore.forwardingHistory && rtlStore.forwardingHistory.forwarding_events && rtlStore.forwardingHistory.forwarding_events.length) {
        this.fees.totalTxCount = rtlStore.forwardingHistory.forwarding_events.filter(event => event.status === 'settled').length
      }
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = ( this.fees.feeCollected) ? false : true;
      }
      
      this.channelsStatus = {
        active: { channels: rtlStore.information.num_active_channels, capacity: 0 },
        inactive: { channels: rtlStore.information.num_inactive_channels, capacity: 0 },
        pending: { channels:  rtlStore.information.num_pending_channels, capacity: 0 }
      };

      this.feeRatesPerKB = rtlStore.feeRatesPerKB;
      this.feeRatesPerKW = rtlStore.feeRatesPerKW;
      if (this.flgLoading[2] !== 'error') {
        this.flgLoading[2] = ( this.feeRatesPerKB &&  this.feeRatesPerKW) ? false : true;
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
