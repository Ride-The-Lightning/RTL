import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { RTLConfiguration } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

import { authenticator } from 'otplib/otplib-browser';

@Component({
  selector: 'rtl-2fa-settings',
  templateUrl: './2fa-settings.component.html',
  styleUrls: ['./2fa-settings.component.scss']
})
export class TwoFASettingsComponent implements OnInit, OnDestroy {
  public appConfig: RTLConfiguration;
  public secret2fa: string;
  public otpauth: string;
  public token2fa: string;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];
  @Output('done') done: EventEmitter<void> = new EventEmitter();

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {
  }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      if (!this.appConfig.enable2FA)
        this.generateSecret();
      this.logger.info(rtlStore);
    });
  }

  generateSecret() {
    this.secret2fa = authenticator.generateSecret();
    this.otpauth = authenticator.keyuri('', 'Ride the lightning', this.secret2fa);
  }

  onEnable() {
    const isValid = authenticator.check(this.token2fa, this.secret2fa);
    if (!isValid)
      return;
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Settings...'));
    this.store.dispatch(new RTLActions.TwoFASaveSettings({secret2fa: this.secret2fa}));
    this.done.emit();
    this.appConfig.enable2FA = true;
  }
  
  onDisable() {
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Settings...'));
    this.store.dispatch(new RTLActions.TwoFASaveSettings({secret2fa: ''}));
    this.done.emit();
    this.appConfig.enable2FA = false;
    this.generateSecret();
  }

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}
