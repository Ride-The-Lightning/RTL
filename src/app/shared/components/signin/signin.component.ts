import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as sha256 from 'sha256';
import { Store } from '@ngrx/store';

import { faUnlockAlt } from '@fortawesome/free-solid-svg-icons';

import { LightningNode } from '../../models/RTLconfig';
import { LoggerService } from '../../services/logger.service';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';

@Component({
  selector: 'rtl-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit, OnDestroy {
  public faUnlockAlt = faUnlockAlt;
  public selNode: LightningNode;
  public password = '';
  public nodeAuthType = '';
  public rtlSSO = 0;
  public rtlCookiePath = '';
  public hintStr = '';
  public accessKey = '';

  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsRoot.forEach(effectsErr => {
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
    if(!this.password) { return true; }
    this.store.dispatch(new RTLActions.Signin(sha256(this.password)));
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
