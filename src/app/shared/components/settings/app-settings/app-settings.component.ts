import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faWindowRestore, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode, RTLConfiguration } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-app-settings',
  templateUrl: './app-settings.component.html',
  styleUrls: ['./app-settings.component.scss']
})
export class AppSettingsComponent implements OnInit, OnDestroy {
  public faInfoCircle = faInfoCircle;
  public faWindowRestore = faWindowRestore;
  public faPlus = faPlus;
  public selNode: ConfigSettingsNode;
  public appConfig: RTLConfiguration;
  public previousDefaultNode = 0;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      this.previousDefaultNode = this.appConfig.defaultNodeIndex;
      this.selNode = rtlStore.selNode;
      this.logger.info(rtlStore);
    });
  }

  onAddNewNode() {
    console.warn('ADD NEW NODE');
  }

  onUpdateSettings():boolean|void {
    let defaultNodeIndex = (this.appConfig.defaultNodeIndex) ? this.appConfig.defaultNodeIndex : +this.appConfig.nodes[0].index;
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Defaule Node Settings...'));
    this.store.dispatch(new RTLActions.SaveSettings({defaultNodeIndex: defaultNodeIndex}));
  }

  onResetSettings() {
    this.appConfig.defaultNodeIndex = this.previousDefaultNode;
  }  

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
