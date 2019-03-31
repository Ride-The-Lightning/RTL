import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MultiNode } from '../../shared/models/RTLconfig';
import { LoggerService } from '../../shared/services/logger.service';
import * as fromRTLReducer from '../../shared/store/rtl.reducers';
import * as RTLActions from '../../shared/store/rtl.actions';

@Component({
  selector: 'rtl-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit, OnDestroy {
  multiNodes: MultiNode[] = [];
  selNode = '';
  password = '';
  nodeAuthType = '';
  rtlSSO = 0;
  rtlCookiePath = '';
  hintStr = '';
  accessKey = '';

  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>) { }

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        this.logger.error(effectsErr);
      });
      this.multiNodes = rtlStore.multiNodes;
      this.nodeAuthType = rtlStore.authSettings.nodeAuthType;
      this.logger.info(rtlStore);
      if (this.nodeAuthType.toUpperCase() === 'DEFAULT') {
        this.hintStr = 'Enter RPC password';
      } else {
        this.hintStr = ''; // Do not remove, initial passowrd 'DEFAULT' is initilizing its value
      }
    });
  }

  onSignin() {
    this.store.dispatch(new RTLActions.Signin({ password: window.btoa(this.password), node: this.selNode }));
  }

  resetData() {
    this.password = '';
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
