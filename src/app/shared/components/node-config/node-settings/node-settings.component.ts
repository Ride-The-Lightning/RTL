import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faMoneyBillAlt, faPaintBrush, faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { CURRENCY_UNITS, UserPersonaEnum, ScreenSizeEnum, FIAT_CURRENCY_UNITS, NODE_SETTINGS } from '../../../services/consts-enums-functions';
import { ConfigSettingsNode, Settings, RTLConfiguration, GetInfoRoot } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';
import { CommonService } from '../../../services/common.service';

import * as ECLActions from '../../../../eclair/store/ecl.actions';
import * as CLActions from '../../../../clightning/store/cl.actions';
import * as LNDActions from '../../../../lnd/store/lnd.actions';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-node-settings',
  templateUrl: './node-settings.component.html',
  styleUrls: ['./node-settings.component.scss']
})
export class NodeSettingsComponent implements OnInit, OnDestroy {
  public faExclamationTriangle = faExclamationTriangle;
  public faMoneyBillAlt = faMoneyBillAlt;
  public faPaintBrush = faPaintBrush;
  public faInfoCircle = faInfoCircle;
  public selNode: ConfigSettingsNode;
  public information: GetInfoRoot = {};
  public userPersonas = [UserPersonaEnum.OPERATOR, UserPersonaEnum.MERCHANT];
  public currencyUnits = FIAT_CURRENCY_UNITS;
  public themeModes = NODE_SETTINGS.modes;
  public themeColors = NODE_SETTINGS.themes;
  public selectedThemeMode = NODE_SETTINGS.modes[0];
  public selectedThemeColor = NODE_SETTINGS.themes[0].id;
  public currencyUnit = 'BTC';
  public smallerCurrencyUnit = 'Sats';
  public showSettingOption = true;
  public appConfig: RTLConfiguration;
  public previousSettings: Settings;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      this.selectedThemeMode = this.themeModes.find(themeMode => this.selNode.settings.themeMode === themeMode.id);
      this.selectedThemeColor = this.selNode.settings.themeColor;
      this.information = rtlStore.nodeData;
      this.smallerCurrencyUnit = ( this.information &&  this.information.smaller_currency_unit) ? this.information.smaller_currency_unit : 'Sats';
      this.currencyUnit = ( this.information &&  this.information.currency_unit) ? this.information.currency_unit : 'BTC';
      if(!this.selNode.settings.fiatConversion) {
        this.selNode.settings.currencyUnit = null;
      }
      this.previousSettings = JSON.parse(JSON.stringify(this.selNode.settings));
      this.logger.info(rtlStore);
    });
  }

  onCurrencyChange(event: any) {
    this.selNode.settings.currencyUnits = [...CURRENCY_UNITS, event.value];
    this.store.dispatch(new LNDActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: event.value, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
    this.store.dispatch(new CLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: event.value, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
    this.store.dispatch(new ECLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: event.value, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
  }

  toggleSettings(toggleField: string, event?: any) {
    this.selNode.settings[toggleField] = !this.selNode.settings[toggleField];
  }

  changeThemeColor(newThemeColor: string) {
    this.selectedThemeColor = newThemeColor;
    this.selNode.settings.themeColor = newThemeColor;
  }

  chooseThemeMode() {
    this.selNode.settings.themeMode = this.selectedThemeMode.id;
  }

  onUpdateSettings():boolean|void {
    if(this.selNode.settings.fiatConversion && !this.selNode.settings.currencyUnit) { return true; }
    this.logger.info(this.selNode.settings);
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Node Settings...'));
    this.store.dispatch(new RTLActions.SaveSettings({settings: this.selNode.settings}));
    this.store.dispatch(new LNDActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
    this.store.dispatch(new CLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
    this.store.dispatch(new ECLActions.SetChildNodeSettings({userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl}));
  }

  onResetSettings() {
    this.selNode.settings = this.previousSettings;
    this.selectedThemeMode = this.themeModes.find(themeMode => themeMode.id === this.previousSettings.themeMode);
    this.selectedThemeColor = this.previousSettings.themeColor;
    this.store.dispatch(new RTLActions.SetSelelectedNode({ lnNode: this.selNode, isInitialSetup: true }));    
  }  

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
