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
  public openChannels = 0;
  public pendingChannels = 0;
  public closedChannels = 0;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.openChannels = (rtlStore.allChannels && rtlStore.allChannels.length) ? rtlStore.allChannels.length : 0;
      this.pendingChannels = (rtlStore.numberOfPendingChannels) ? rtlStore.numberOfPendingChannels : 0;
      this.closedChannels = (rtlStore.closedChannels && rtlStore.closedChannels.length) ? rtlStore.closedChannels.length : 0;
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
