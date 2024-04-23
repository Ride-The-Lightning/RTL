import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServicesEnum, UI_MESSAGES } from '../../../../services/consts-enums-functions';
import { Node } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { updateNodeSettings } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { setChildNodeSettingsLND } from '../../../../../lnd/store/lnd.actions';
import { setChildNodeSettingsCLN } from '../../../../../cln/store/cln.actions';
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
  public selNode: Node | any;
  public previousSelNode: Node | any;
  public enableLoop = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(rootSelectedNode).
      pipe(takeUntil(this.unSubs[0])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enableLoop = !!(selNode.Settings.swapServerUrl && selNode.Settings.swapServerUrl.trim() !== '');
        this.previousSelNode = JSON.parse(JSON.stringify(this.selNode));
        this.logger.info(selNode);
      });
  }

  onEnableServiceChanged(event) {
    this.enableLoop = event.checked;
    if (!this.enableLoop) {
      this.selNode.authentication.swapMacaroonPath = '';
      this.selNode.Settings.swapServerUrl = '';
    }
  }

  onUpdateService(): boolean | void {
    if (this.selNode.Settings.swapServerUrl && this.selNode.Settings.swapServerUrl.trim() !== '' && !this.form.controls.srvrUrl.value.includes('https://')) {
      this.form.controls.srvrUrl.setErrors({ invalid: true });
    }
    if (this.enableLoop && (!this.selNode.Settings.swapServerUrl || this.selNode.Settings.swapServerUrl.trim() === '' || !this.selNode.authentication.swapMacaroonPath || this.selNode.authentication.swapMacaroonPath.trim() === '')) {
      return true;
    }
    this.logger.info(this.selNode);
    // this.store.dispatch(updateNodeSettings({ payload: { uiMessage: UI_MESSAGES.UPDATE_LOOP_SETTINGS, service: ServicesEnum.LOOP, settings: { enable: this.enableLoop, serverUrl: this.selNode.Settings.swapServerUrl, macaroonPath: this.selNode.authentication.swapMacaroonPath } } }));
    // this.store.dispatch(setChildNodeSettingsLND({
    //   payload: {
    //     userPersona: this.selNode.Settings.userPersona, channelBackupPath: this.selNode.Settings.channelBackupPath, selCurrencyUnit: this.selNode.Settings.currencyUnit, currencyUnits: this.selNode.Settings.currencyUnits, fiatConversion: this.selNode.Settings.fiatConversion,
    //     unannouncedChannels: this.selNode.unannouncedChannels, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.Settings.swapServerUrl, boltzServerUrl: this.selNode.Settings.boltzServerUrl, enableOffers: this.selNode.Settings.enableOffers
    //   }
    // }));
    // this.store.dispatch(setChildNodeSettingsCLN({
    //   payload: {
    //     userPersona: this.selNode.Settings.userPersona, channelBackupPath: this.selNode.Settings.channelBackupPath, selCurrencyUnit: this.selNode.Settings.currencyUnit, currencyUnits: this.selNode.Settings.currencyUnits, fiatConversion: this.selNode.Settings.fiatConversion,
    //     unannouncedChannels: this.selNode.unannouncedChannels, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.Settings.swapServerUrl, boltzServerUrl: this.selNode.Settings.boltzServerUrl, enableOffers: this.selNode.Settings.enableOffers
    //   }
    // }));
    // this.store.dispatch(setChildNodeSettingsECL({
    //   payload: {
    //     userPersona: this.selNode.Settings.userPersona, channelBackupPath: this.selNode.Settings.channelBackupPath, selCurrencyUnit: this.selNode.Settings.currencyUnit, currencyUnits: this.selNode.Settings.currencyUnits, fiatConversion: this.selNode.Settings.fiatConversion,
    //     unannouncedChannels: this.selNode.unannouncedChannels, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.Settings.swapServerUrl, boltzServerUrl: this.selNode.Settings.boltzServerUrl, enableOffers: this.selNode.Settings.enableOffers
    //   }
    // }));
  }

  onReset() {
    this.selNode = JSON.parse(JSON.stringify(this.previousSelNode));
    this.enableLoop = !!(this.selNode.Settings.swapServerUrl && this.selNode.Settings.swapServerUrl.trim() !== '');
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
