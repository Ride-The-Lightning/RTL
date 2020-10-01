import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../../shared/services/logger.service';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channels-tables',
  templateUrl: './channels-tables.component.html',
  styleUrls: ['./channels-tables.component.scss']
})
export class ChannelsTablesComponent implements OnInit, OnDestroy {
  public numOpenChannels = 0;
  public numPendingChannels = 0;
  public numClosedChannels = 0;
  public numActiveHTLCs = 0;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.numOpenChannels = (rtlStore.allChannels && rtlStore.allChannels.length) ? rtlStore.allChannels.length : 0;
      this.numPendingChannels = (rtlStore.numberOfPendingChannels.total_channels) ? rtlStore.numberOfPendingChannels.total_channels : 0;
      this.numClosedChannels = (rtlStore.closedChannels && rtlStore.closedChannels.length) ? rtlStore.closedChannels.length : 0;
      this.numActiveHTLCs = rtlStore.allChannels.reduce((totalHTLCs, channel) => {
        return totalHTLCs + (channel.pending_htlcs && channel.pending_htlcs.length > 0 ? channel.pending_htlcs.length : 0);
      }, 0);
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
