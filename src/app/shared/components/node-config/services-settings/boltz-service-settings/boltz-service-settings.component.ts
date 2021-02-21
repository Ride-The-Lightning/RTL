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
  selector: 'rtl-boltz-service-settings',
  templateUrl: './boltz-service-settings.component.html',
  styleUrls: ['./boltz-service-settings.component.scss']
})
export class BoltzServiceSettingsComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true }) form: any;
  public faInfoCircle = faInfoCircle;
  public appConfig: RTLConfiguration;
  public selNode: ConfigSettingsNode;
  public previousSelNode: ConfigSettingsNode;
  public enableBoltz = false;
  public serverUrl = '';
  public macaroonPath = '';
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      this.enableBoltz = rtlStore.selNode.settings.boltzServerUrl && rtlStore.selNode.settings.boltzServerUrl.trim() !== '';
      this.serverUrl = this.selNode.settings.boltzServerUrl;
      this.macaroonPath = this.selNode.authentication.boltzMacaroonPath;
      this.previousSelNode = JSON.parse(JSON.stringify(this.selNode));
      this.logger.info(rtlStore);
    });
  }

  onEnableServiceChanged(event) {
    this.enableBoltz = event.checked;
    if (!this.enableBoltz) {
      this.macaroonPath = '';
      this.serverUrl = '';
    }
  }

  onUpdateService():boolean|void {
    if(this.serverUrl && this.serverUrl.trim() !== '' && !this.form.controls.srvrUrl.value.includes('https://')) {
      this.form.controls.srvrUrl.setErrors({invalid: true});
    }
    if(this.enableBoltz && 
      (!this.serverUrl || 
        this.serverUrl.trim() === '' || 
        !this.serverUrl.includes('https://') || 
        !this.macaroonPath || 
        this.macaroonPath.trim() === '')
    ) { return true; }
    this.logger.info(this.selNode);
    this.selNode.settings.boltzServerUrl = this.serverUrl;
    this.selNode.authentication.boltzMacaroonPath = this.macaroonPath;
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Boltz Service Settings...'));
    this.store.dispatch(new RTLActions.UpdateServiceSettings({service: ServicesEnum.BOLTZ, settings: { enable: this.enableBoltz, serverUrl: this.serverUrl, macaroonPath: this.macaroonPath }}));
    this.store.dispatch(new LNDActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.serverUrl}));
    this.store.dispatch(new CLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.serverUrl}));
    this.store.dispatch(new ECLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.serverUrl}));
  }

  onReset() {
    this.selNode = JSON.parse(JSON.stringify(this.previousSelNode));
    this.serverUrl = this.selNode.settings.boltzServerUrl;
    this.macaroonPath = this.selNode.authentication.boltzMacaroonPath;
    this.enableBoltz = this.serverUrl && this.serverUrl.trim() !== '';
  }

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
