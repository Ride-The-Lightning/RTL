import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServicesEnum } from '../../../../services/consts-enums-functions';
import { ConfigSettingsNode, RTLConfiguration } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import * as ECLActions from '../../../../../eclair/store/ecl.actions';
import * as CLActions from '../../../../../clightning/store/cl.actions';
import * as LNDActions from '../../../../../lnd/store/lnd.actions';
import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-loop-service-settings',
  templateUrl: './loop-service-settings.component.html',
  styleUrls: ['./loop-service-settings.component.scss']
})
export class LoopServiceSettingsComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true }) form: any;
  public faInfoCircle = faInfoCircle;
  public appConfig: RTLConfiguration;
  public selNode: ConfigSettingsNode;
  public previousSelNode: ConfigSettingsNode;
  public enableLoop = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      this.enableLoop = rtlStore.selNode.settings.swapServerUrl && rtlStore.selNode.settings.swapServerUrl.trim() !== '';
      this.previousSelNode = JSON.parse(JSON.stringify(this.selNode));
      this.logger.info(rtlStore);
    });
  }

  onEnableServiceChanged(event) {
    this.enableLoop = event.checked;
    if (!this.enableLoop) {
      this.selNode.authentication.swapMacaroonPath = '';
      this.selNode.settings.swapServerUrl = '';
    }
  }

  onUpdateService():boolean|void {
    if(this.selNode.settings.swapServerUrl && this.selNode.settings.swapServerUrl.trim() !== '' && !this.form.controls.srvrUrl.value.includes('https://')) {
      this.form.controls.srvrUrl.setErrors({invalid: true});
    }
    if(this.enableLoop && (!this.selNode.settings.swapServerUrl || this.selNode.settings.swapServerUrl.trim() === '' || !this.selNode.authentication.swapMacaroonPath || this.selNode.authentication.swapMacaroonPath.trim() === '')) { return true; }
    this.logger.info(this.selNode);
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Loop Service Settings...'));
    this.store.dispatch(new RTLActions.UpdateServiceSettings({service: ServicesEnum.LOOP, settings: { enable: this.enableLoop, serverUrl: this.selNode.settings.swapServerUrl, macaroonPath: this.selNode.authentication.swapMacaroonPath }}));
    this.store.dispatch(new LNDActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
    this.store.dispatch(new CLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
    this.store.dispatch(new ECLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
  }

  onReset() {
    this.selNode = JSON.parse(JSON.stringify(this.previousSelNode));
    this.enableLoop = this.selNode.settings.swapServerUrl && this.selNode.settings.swapServerUrl.trim() !== '';
  }  

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
