import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

import { LoopService } from '../../shared/services/loop.service';
import { SocketService } from '../../shared/services/socket.service';
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
  loopMonitorLogs = [];
  sub: Subscription; //convert to unSubs: Array<Subject> after testing

  constructor(private socketService: SocketService, private loopService: LoopService, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private lndEffects: LNDEffects, private actions$: Actions) { }

  ngOnInit() {}

  onStartMonitor() {
    // this.sub = this.socketService.startLoopMonitor().subscribe(log => {
    //   this.loopMonitorLogs.push(log);
    //   console.warn(log);
    // });
    // this.loopService.monitorLoop().subscribe(log => {
    //   this.loopMonitorLogs.push(log);
    //   console.warn(log);
    // });

    // this.loopService.monitorLoop();

    // this.loopService.listSwaps().subscribe(data => console.warn(data));
    this.loopService.getSwap('SAUZul5aQB9xyyH5omWs5bxSsmUubL+MCA4XK2%2F%2FpV4=').subscribe(data => console.warn(data));

  }

  onStopMonitor() {
    this.socketService.stopLoopMonitor();
    this.sub.unsubscribe();
  }

  onLoopInTerms() {
    // this.store.dispatch(new RTLActions.GetLoopInTerms());
  }

  ngOnDestroy() {
    if(this.sub) {
      this.sub.unsubscribe();
    }
  }
}
