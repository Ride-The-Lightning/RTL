import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faWindowRestore, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { UI_MESSAGES } from '../../../services/consts-enums-functions';
import { RTLConfiguration } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';

import { RTLState } from '../../../../store/rtl.state';
import { saveSettings } from '../../../../store/rtl.actions';
import { rootAppConfig } from '../../../../store/rtl.selector';

@Component({
  selector: 'rtl-app-settings',
  templateUrl: './app-settings.component.html',
  styleUrls: ['./app-settings.component.scss']
})
export class AppSettingsComponent implements OnInit, OnDestroy {

  public faInfoCircle = faInfoCircle;
  public faWindowRestore = faWindowRestore;
  public faPlus = faPlus;
  public appConfig: RTLConfiguration;
  public previousDefaultNode = 0;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(rootAppConfig).pipe(takeUntil(this.unSubs[0])).subscribe((appConfig) => {
      this.appConfig = appConfig;
      this.previousDefaultNode = this.appConfig.defaultNodeIndex;
      this.logger.info(appConfig);
    });
  }

  onAddNewNode() {
    this.logger.warn('ADD NEW NODE');
  }

  onUpdateSettings(): boolean | void {
    const defaultNodeIndex = (this.appConfig.defaultNodeIndex) ? this.appConfig.defaultNodeIndex : +this.appConfig.nodes[0].index;
    this.store.dispatch(saveSettings({ payload: { uiMessage: UI_MESSAGES.UPDATE_DEFAULT_NODE_SETTING, defaultNodeIndex: defaultNodeIndex } }));
  }

  onResetSettings() {
    this.appConfig.defaultNodeIndex = this.previousDefaultNode;
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
