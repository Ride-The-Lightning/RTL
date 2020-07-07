import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faTools } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode, RTLConfiguration } from '../../models/RTLconfig';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';

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
  public appConfig: RTLConfiguration;
  public lnImplementationStr = '';
  public loadTab = 'appSettings';
  public initializeNodeData = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.paramMap
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(data => {
      this.loadTab = window.history.state.loadTab ? window.history.state.loadTab : 'appSettings';
      this.initializeNodeData = window.history.state.initializeNodeData ? window.history.state.initializeNodeData : false;
    });    
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.showLnConfig = false;
      this.showBitcoind = false;
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      switch (this.selNode.lnImplementation.toUpperCase()) {
        case 'CLT':
          this.lnImplementationStr = 'C-Lightning Config';
          break;
      
        case 'ECL':
          this.lnImplementationStr = 'Eclair Config';
          break;

        default:
          this.lnImplementationStr = 'LND Config';
          break;
      }

      if (this.selNode.authentication && this.selNode.authentication.configPath && this.selNode.authentication.configPath.trim() !== '') {
        this.showLnConfig = true;
      }
      if (this.selNode.settings && this.selNode.settings.bitcoindConfigPath && this.selNode.settings.bitcoindConfigPath.trim() !== '') {
        this.showBitcoind = true;
      }
    });
  }

  ngOnDestroy() {
    if(this.initializeNodeData) {
      this.store.dispatch(new RTLActions.SetSelelectedNode({lnNode: this.selNode, isInitialSetup: true}));
    }
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
