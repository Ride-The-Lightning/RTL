import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { RTLEffects } from '../../shared/store/rtl.effects';
import * as RTLActions from '../../shared/store/rtl.actions';
import * as fromRTLReducer from '../../shared/store/rtl.reducers';
import { Authentication } from '../../shared/models/RTLconfig';

@Component({
  selector: 'rtl-server-config',
  templateUrl: './server-config.component.html',
  styleUrls: ['./server-config.component.scss']
})
export class ServerConfigComponent implements OnInit, OnDestroy {
  public selectedNodeType = 'lnd';
  public authSettings: Authentication = {};
  public showLND = false;
  public showBitcoind = false;
  public configData = '';
  private unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.State>, private rtlEffects: RTLEffects) {}

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'fetchConfig') {
          this.resetData();
        }
      });
      this.authSettings = rtlStore.authSettings;
      if (undefined !== this.authSettings && this.authSettings.lndConfigPath !== '') {
        this.showLND = true;
      }
      if (undefined !== this.authSettings && undefined !== this.authSettings.bitcoindConfigPath && this.authSettings.bitcoindConfigPath !== '') {
        this.showBitcoind = true;
      }
    });
  }

  onSelectionChange(event) {
    this.selectedNodeType = event.value;
    this.configData = '';
  }

  onShowConfig() {
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Config File...'));
    this.store.dispatch(new RTLActions.FetchConfig(this.selectedNodeType));
    this.rtlEffects.showLNDConfig
    .pipe(takeUntil(this.unsubs[1]))
    .subscribe((configFile: any) => {
      this.configData = (configFile === '' || undefined === configFile) ? [] : configFile.split('\n');
    });
  }

  resetData() {
    this.configData = '';
    this.selectedNodeType = 'lnd';
  }

  ngOnDestroy() {
    this.unsubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
