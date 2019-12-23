import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { RTLEffects } from '../../../../store/rtl.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import { faCog } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-server-config',
  templateUrl: './server-config.component.html',
  styleUrls: ['./server-config.component.scss']
})
export class ServerConfigComponent implements OnInit {
  @Input() selectedNodeType = '';
  public configData = '';
  public fileFormat = 'INI';
  public faCog = faCog;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects) {}

  ngOnInit() {
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Config File...'));
    this.store.dispatch(new RTLActions.FetchConfig(this.selectedNodeType));
    this.rtlEffects.showLnConfig
    .pipe(takeUntil(this.unSubs[1]))
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

}
