import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

import { LoopService } from '../../shared/services/loop.service';
import { LoggerService } from '../../shared/services/logger.service';
import { LNDEffects } from '../store/lnd.effects';

import { RTLEffects } from '../../store/rtl.effects';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-loop',
  templateUrl: './loop.component.html',
  styleUrls: ['./loop.component.scss']
})
export class LoopComponent implements OnInit, OnDestroy {
  faCircleNotch = faCircleNotch;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private loopService: LoopService, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private lndEffects: LNDEffects, private actions$: Actions) { }

  ngOnInit() {}

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
