import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Node } from '../../shared/models/RTLconfig';
import { LoggerService } from '../../shared/services/logger.service';
import * as fromRTLReducer from '../../shared/store/rtl.reducers';
import * as RTLActions from '../../shared/store/rtl.actions';

@Component({
  selector: 'rtl-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit, OnDestroy {
  public selNode: Node;
  public password = '';
  public nodeAuthType = '';
  public rtlSSO = 0;
  public rtlCookiePath = '';
  public hintStr = '';
  public accessKey = '';

  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>) { }

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        this.logger.error(effectsErr);
      });
      this.selNode = rtlStore.selNode;
      this.nodeAuthType = this.selNode.authentication.nodeAuthType;
      this.logger.info(rtlStore);
      if (this.nodeAuthType.toUpperCase() === 'DEFAULT') {
        this.hintStr = 'Enter RPC password';
      } else {
        this.hintStr = ''; // Do not remove, initial passowrd 'DEFAULT' is initilizing its value
      }
    });
  }

  onSignin() {
    this.store.dispatch(new RTLActions.Signin(window.btoa(this.password)));
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
