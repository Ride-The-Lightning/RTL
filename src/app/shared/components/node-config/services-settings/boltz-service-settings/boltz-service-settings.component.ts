import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServicesEnum } from '../../../../services/consts-enums-functions';
import { ConfigSettingsNode, RTLConfiguration } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';

import * as ECLActions from '../../../../../eclair/store/ecl.actions';
import * as CLActions from '../../../../../clightning/store/cl.actions';
import * as LNDActions from '../../../../../lnd/store/lnd.actions';
import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-boltz-service-settings',
  templateUrl: './boltz-service-settings.component.html',
  styleUrls: ['./boltz-service-settings.component.scss']
})
export class BoltzServiceSettingsComponent implements OnInit, OnDestroy {
  public appConfig: RTLConfiguration;
  public selNode: ConfigSettingsNode;
  public previousSelNode: ConfigSettingsNode;
  public enableBoltz = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      this.enableBoltz = rtlStore.selNode.settings.boltzServerUrl && rtlStore.selNode.settings.boltzServerUrl.trim() !== '';
      this.previousSelNode = JSON.parse(JSON.stringify(this.selNode));
      this.logger.info(rtlStore);
    });
  }

  onEnableServiceChanged(event) {
    this.enableBoltz = event.checked;
    if (!this.enableBoltz) {
      this.selNode.authentication.boltzMacaroonPath = '';
      this.selNode.settings.boltzServerUrl = '';
    }
  }

  onUpdateService():boolean|void {
    if(this.enableBoltz && (!this.selNode.settings.boltzServerUrl || this.selNode.settings.boltzServerUrl.trim() === '' || !this.selNode.authentication.boltzMacaroonPath || this.selNode.authentication.boltzMacaroonPath.trim() === '')) { return true; }
    this.logger.info(this.selNode);
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Boltz Service Settings...'));
    this.store.dispatch(new RTLActions.UpdateServiceSettings({service: ServicesEnum.BOLTZ, settings: { enable: this.enableBoltz, serverUrl: this.selNode.settings.boltzServerUrl, macaroonPath: this.selNode.authentication.boltzMacaroonPath }}));
    this.store.dispatch(new LNDActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
    this.store.dispatch(new CLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
    this.store.dispatch(new ECLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
  }

  onReset() {
    this.selNode = JSON.parse(JSON.stringify(this.previousSelNode));
    this.enableBoltz = this.selNode.settings.boltzServerUrl && this.selNode.settings.boltzServerUrl.trim() !== '';
  }  

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
