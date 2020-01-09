import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../../shared/services/logger.service';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-channels-tables',
  templateUrl: './channels-tables.component.html',
  styleUrls: ['./channels-tables.component.scss']
})
export class CLChannelsTablesComponent implements OnInit, OnDestroy {
  public openChannels = 0;
  public pendingChannels = 0;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      if (rtlStore.allChannels && rtlStore.allChannels.length) {
        this.openChannels = 0;
        this.pendingChannels = 0;
        rtlStore.allChannels.forEach(channel => {
          if(channel.state === 'CHANNELD_NORMAL' && channel.connected) {
            this.openChannels++;
          } else {
            this.pendingChannels++;
          }
        });
      } else {
        this.openChannels = 0;
        this.pendingChannels = 0;
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
