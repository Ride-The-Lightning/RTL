import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Node } from '../../shared/models/RTLconfig';
import { RTLEffects } from '../../shared/store/rtl.effects';
import * as RTLActions from '../../shared/store/rtl.actions';
import * as fromRTLReducer from '../../shared/store/rtl.reducers';

@Component({
  selector: 'rtl-server-config',
  templateUrl: './server-config.component.html',
  styleUrls: ['./server-config.component.scss']
})
export class ServerConfigComponent implements OnInit, OnDestroy {
  public selNode: Node;
  public selectedNodeType = 'lnd';
  public showLND = false;
  public showBitcoind = false;
  public configData = '';
  public fileFormat = 'INI';
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
      this.selNode = rtlStore.selNode;
      if (undefined !== this.selNode.authentication && this.selNode.authentication.lndConfigPath !== '') {
        this.showLND = true;
      }
      if (undefined !== this.selNode.authentication && undefined !== this.selNode.authentication.bitcoindConfigPath && this.selNode.authentication.bitcoindConfigPath !== '') {
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
    this.selectedNodeType = 'lnd';
  }

  ngOnDestroy() {
    this.unsubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
