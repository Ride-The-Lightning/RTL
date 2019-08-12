import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Node } from '../../shared/models/RTLconfig';

import { LNDEffects } from '../store/lnd.effects';
import * as LNDActions from '../store/lnd.actions';
import { RTLEffects } from '../../store/rtl.effects';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-server-config',
  templateUrl: './server-config.component.html',
  styleUrls: ['./server-config.component.scss']
})
export class ServerConfigComponent implements OnInit, OnDestroy {
  public selNode: Node;
  public selectedNodeType = 'rtl';
  public showLND = false;
  public showBitcoind = false;
  public configData = '';
  public fileFormat = 'INI';
  private unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.State>, private lndEffects: LNDEffects) {}

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'fetchConfig') {
          this.resetData();
        }
      });
      this.configData = '';
      this.showLND = false;
      this.showBitcoind = false;
      this.selNode = rtlStore.selNode;
      if (undefined !== this.selNode.authentication && undefined !== this.selNode.authentication.lndConfigPath && this.selNode.authentication.lndConfigPath !== '') {
        this.showLND = true;
      }
      if (undefined !== this.selNode.authentication && undefined !== this.selNode.authentication.bitcoindConfigPath && this.selNode.authentication.bitcoindConfigPath !== '') {
        this.showBitcoind = true;
      }
      if (this.selectedNodeType === 'lnd' && !this.showLND) {
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
    this.store.dispatch(new LNDActions.FetchConfig(this.selectedNodeType));
    this.lndEffects.showLNDConfig
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
