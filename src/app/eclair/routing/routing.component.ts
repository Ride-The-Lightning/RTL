import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faMapSigns } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';

import * as fromRTLReducer from '../../store/rtl.reducers';


@Component({
  selector: 'rtl-eclr-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class ECLRRoutingComponent implements OnInit, OnDestroy {
  public faMapSigns = faMapSigns;
  public events = [];
  public flgLoading: Array<Boolean | 'error'> = [true];
  public errorMessage = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('eclr')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.errorMessage = '';
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchAudit') {
          this.flgLoading[0] = 'error';
          this.errorMessage = (typeof(effectsErr.message) === 'object') ? JSON.stringify(effectsErr.message) : effectsErr.message;
        }
      });
      this.events = rtlStore.payments && rtlStore.payments.relayed ? rtlStore.payments.relayed : [];
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (rtlStore.payments) ? false : true;
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
