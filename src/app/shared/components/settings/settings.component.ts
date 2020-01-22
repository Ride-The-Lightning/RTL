import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faTools } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode } from '../../models/RTLconfig';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'rtl-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy{
  public faTools = faTools;
  public showLnConfig = false;
  public showBitcoind = false;
  public selNode: ConfigSettingsNode;
  public lnImplementationStr = '';
  public loadTab = 'appSettings';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.paramMap
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(data => {
      this.loadTab = window.history.state.loadTab ? window.history.state.loadTab : 'appSettings';
    });    
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.showLnConfig = false;
      this.showBitcoind = false;
      this.selNode = rtlStore.selNode;
      this.lnImplementationStr = this.selNode.lnImplementation.toUpperCase() === 'CLT' ? 'C-Lightning Config' : 'LND Config';
      if (this.selNode.authentication && this.selNode.authentication.configPath && this.selNode.authentication.configPath.trim() !== '') {
        this.showLnConfig = true;
      }
      if (this.selNode.settings && this.selNode.settings.bitcoindConfigPath && this.selNode.settings.bitcoindConfigPath.trim() !== '') {
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
