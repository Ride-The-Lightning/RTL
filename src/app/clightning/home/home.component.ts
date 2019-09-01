import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfoCL, FeesCL } from '../../shared/models/clModels';
import { LightningNode } from '../../shared/models/RTLconfig';

import * as fromRTLReducer from '../../store/rtl.reducers';
import * as fromCLReducer from '../store/cl.reducers';

@Component({
  selector: 'rtl-cl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class CLHomeComponent implements OnInit, OnDestroy {
  public fees: FeesCL;
  public information: GetInfoCL = {};
  public flgLoading: Array<Boolean | 'error'> = [true, true, true, true, true, true, true, true]; // 0: Info, 1: Fee, 2: Wallet, 3: Channel, 4: Network
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((clStore: fromCLReducer.CLState) => {
      clStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'FetchCLInfo') {
          this.flgLoading[0] = 'error';
        }
        if (effectsErr.action === 'FetchCLFees') {
          this.flgLoading[1] = 'error';
        }
      });
      this.information = clStore.information;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== this.information.id) ? false : true;
      }
      this.fees = clStore.fees;
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = (undefined !== this.fees.feeCollected) ? false : true;
      }
      this.logger.info(clStore);
    });

  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
