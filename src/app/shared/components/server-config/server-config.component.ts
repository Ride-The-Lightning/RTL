import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LightningNode } from '../../models/RTLconfig';
import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-server-config',
  templateUrl: './server-config.component.html',
  styleUrls: ['./server-config.component.scss']
})
export class ServerConfigComponent implements OnInit, OnDestroy {
  public selNode: LightningNode;
  public selectedNodeType = 'rtl';
  public showLnConfig = false;
  public lnImplementationStr = '';
  public showBitcoind = false;
  public configData = '';
  public fileFormat = 'INI';
  private unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsRoot.forEach(effectsErr => {
        if (effectsErr.action === 'fetchConfig') {
          this.resetData();
        }
      });
      this.configData = '';
      this.showLnConfig = false;
      this.showBitcoind = false;
      this.selNode = rtlStore.selNode;
      this.lnImplementationStr = this.selNode.lnImplementation.toUpperCase() === 'CLT' ? 'CLT' : 'LND';
      if (undefined !== this.selNode.authentication && undefined !== this.selNode.authentication.configPath && this.selNode.authentication.configPath !== '') {
        this.showLnConfig = true;
      }
      if (undefined !== this.selNode.authentication && undefined !== this.selNode.authentication.bitcoindConfigPath && this.selNode.authentication.bitcoindConfigPath !== '') {
        this.showBitcoind = true;
      }
      if (this.selectedNodeType === 'ln' && !this.showLnConfig) {
        this.selectedNodeType = 'rtl';
      }
      if (this.selectedNodeType === 'bitcoind' && !this.showBitcoind) {
        this.selectedNodeType = 'rtl';
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
    this.rtlEffects.showLnConfig
    .pipe(takeUntil(this.unsubs[1]))
    .subscribe((config: any) => {
      const configFile = config.data;
      this.fileFormat = config.format;
      if (configFile !== '' && undefined !== configFile && this.fileFormat === 'INI') {
        this.configData = configFile.split('\n');
      } else if (configFile !== '' && undefined !== configFile && this.fileFormat === 'JSON') {
        this.configData = configFile;
      } else {
        this.configData = '';
      }
    });
  }

  resetData() {
    this.configData = '';
    this.selectedNodeType = 'rtl';
  }

  ngOnDestroy() {
    this.unsubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
