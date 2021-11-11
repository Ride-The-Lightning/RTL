import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServicesEnum, UI_MESSAGES } from '../../../../services/consts-enums-functions';
import { ConfigSettingsNode, RTLConfiguration } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { updateServiceSettings } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { setChildNodeSettingsLND } from '../../../../../lnd/store/lnd.actions';
import { setChildNodeSettingsCL } from '../../../../../clightning/store/cl.actions';
import { setChildNodeSettingsECL } from '../../../../../eclair/store/ecl.actions';
import { rootSelectedNode } from '../../../../../store/rtl.selector';

@Component({
  selector: 'rtl-loop-service-settings',
  templateUrl: './loop-service-settings.component.html',
  styleUrls: ['./loop-service-settings.component.scss']
})
export class LoopServiceSettingsComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  public faInfoCircle = faInfoCircle;
  public selNode: ConfigSettingsNode;
  public previousSelNode: ConfigSettingsNode;
  public enableLoop = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(rootSelectedNode).
      pipe(takeUntil(this.unSubs[0])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enableLoop = selNode.settings.swapServerUrl && selNode.settings.swapServerUrl.trim() !== '';
        this.previousSelNode = JSON.parse(JSON.stringify(this.selNode));
        this.logger.info(selNode);
      });
  }

  onEnableServiceChanged(event) {
    this.enableLoop = event.checked;
    if (!this.enableLoop) {
      this.selNode.authentication.swapMacaroonPath = '';
      this.selNode.settings.swapServerUrl = '';
    }
  }

  onUpdateService(): boolean | void {
    if (this.selNode.settings.swapServerUrl && this.selNode.settings.swapServerUrl.trim() !== '' && !this.form.controls.srvrUrl.value.includes('https://')) {
      this.form.controls.srvrUrl.setErrors({ invalid: true });
    }
    if (this.enableLoop && (!this.selNode.settings.swapServerUrl || this.selNode.settings.swapServerUrl.trim() === '' || !this.selNode.authentication.swapMacaroonPath || this.selNode.authentication.swapMacaroonPath.trim() === '')) {
      return true;
    }
    this.logger.info(this.selNode);
    this.store.dispatch(updateServiceSettings({ payload: { uiMessage: UI_MESSAGES.UPDATE_LOOP_SETTINGS, service: ServicesEnum.LOOP, settings: { enable: this.enableLoop, serverUrl: this.selNode.settings.swapServerUrl, macaroonPath: this.selNode.authentication.swapMacaroonPath } } }));
    this.store.dispatch(setChildNodeSettingsLND({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl
      }
    }));
    this.store.dispatch(setChildNodeSettingsCL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl
      }
    }));
    this.store.dispatch(setChildNodeSettingsECL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl
      }
    }));
  }

  onReset() {
    this.selNode = JSON.parse(JSON.stringify(this.previousSelNode));
    this.enableLoop = this.selNode.settings.swapServerUrl && this.selNode.settings.swapServerUrl.trim() !== '';
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
