import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faTools } from '@fortawesome/free-solid-svg-icons';

import { LightningNode } from '../../models/RTLconfig';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy{
  public faTools = faTools;
  public showLnConfig = false;
  public showBitcoind = false;
  public selNode: LightningNode;
  public lnImplementationStr = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.showLnConfig = false;
      this.showBitcoind = false;
      this.selNode = rtlStore.selNode;
      this.lnImplementationStr = this.selNode.lnImplementation.toUpperCase() === 'CLT' ? 'C-Lightning Config' : 'LND Config';
      if (undefined !== this.selNode.authentication && undefined !== this.selNode.authentication.configPath && this.selNode.authentication.configPath !== '') {
        this.showLnConfig = true;
      }
      if (undefined !== this.selNode.authentication && undefined !== this.selNode.authentication.bitcoindConfigPath && this.selNode.authentication.bitcoindConfigPath !== '') {
        this.showBitcoind = true;
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
