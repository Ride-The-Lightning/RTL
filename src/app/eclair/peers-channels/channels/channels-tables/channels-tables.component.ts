import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../../shared/services/logger.service';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-channels-tables',
  templateUrl: './channels-tables.component.html',
  styleUrls: ['./channels-tables.component.scss']
})
export class ECLChannelsTablesComponent implements OnInit, OnDestroy {
  public numOfOpenChannels = 0;
  public numOfPendingChannels = 0;
  public numOfInactiveChannels = 0;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.numOfOpenChannels = (rtlStore.channelsStatus && rtlStore.channelsStatus.active && rtlStore.channelsStatus.active.channels) ? rtlStore.channelsStatus.active.channels : 0;
      this.numOfPendingChannels = (rtlStore.channelsStatus && rtlStore.channelsStatus.pending && rtlStore.channelsStatus.pending.channels) ? rtlStore.channelsStatus.pending.channels : 0;
      this.numOfInactiveChannels = (rtlStore.channelsStatus && rtlStore.channelsStatus.inactive && rtlStore.channelsStatus.inactive.channels) ? rtlStore.channelsStatus.inactive.channels : 0;
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
