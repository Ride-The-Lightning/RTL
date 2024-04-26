import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faMoneyBillAlt, faPaintBrush, faInfoCircle, faExclamationTriangle, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { CURRENCY_UNITS, UserPersonaEnum, ScreenSizeEnum, FIAT_CURRENCY_UNITS, NODE_SETTINGS, UI_MESSAGES } from '../../../services/consts-enums-functions';
import { Node, Settings } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';
import { CommonService } from '../../../services/common.service';
import { RTLState } from '../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { updateNodeSettings, setSelectedNode, updateSelectedNodeSettings } from '../../../../store/rtl.actions';
import { setChildNodeSettingsLND } from '../../../../lnd/store/lnd.actions';
import { setChildNodeSettingsCLN } from '../../../../cln/store/cln.actions';
import { setChildNodeSettingsECL } from '../../../../eclair/store/ecl.actions';

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
  public faEyeSlash = faEyeSlash;
  public selNode: Node | any;
  public userPersonas = [UserPersonaEnum.OPERATOR, UserPersonaEnum.MERCHANT];
  public currencyUnits = FIAT_CURRENCY_UNITS;
  public themeModes = NODE_SETTINGS.modes;
  public themeColors = NODE_SETTINGS.themes;
  public selectedThemeMode = NODE_SETTINGS.modes[0];
  public selectedThemeColor = NODE_SETTINGS.themes[0].id;
  public currencyUnit = 'BTC';
  public smallerCurrencyUnit = 'Sats';
  public showSettingOption = true;
  public previousSettings: Settings;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, public sanitizer: DomSanitizer) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.currencyUnits.map((currencyUnit) => {
      if (currencyUnit.iconType === 'SVG' && typeof currencyUnit.symbol === 'string') {
        currencyUnit.symbol = currencyUnit.symbol.replace('<svg class="currency-icon" ', '<svg class="currency-icon ' + currencyUnit.class + '"');
        currencyUnit.symbol = this.sanitizer.bypassSecurityTrustHtml(<string>currencyUnit.symbol);
      }
      return currencyUnit;
    });
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((selNode) => {
      this.selNode = JSON.parse(JSON.stringify(selNode));
      this.selectedThemeMode = this.themeModes.find((themeMode) => this.selNode.settings.themeMode === themeMode.id) || this.themeModes[0];
      this.selectedThemeColor = this.selNode.settings.themeColor;
      if (!this.selNode.settings.fiatConversion) {
        this.selNode.settings.currencyUnit = '';
      }
      this.previousSettings = JSON.parse(JSON.stringify(this.selNode.settings));
      this.logger.info(selNode);
    });
  }

  onCurrencyChange(event: any) {
    this.selNode.settings.currencyUnits = [...CURRENCY_UNITS, event.value];
    this.store.dispatch(updateSelectedNodeSettings({ payload: this.selNode }));
    this.store.dispatch(setChildNodeSettingsLND({ payload: this.selNode }));
    this.store.dispatch(setChildNodeSettingsCLN({ payload: this.selNode }));
    this.store.dispatch(setChildNodeSettingsECL({ payload: this.selNode }));
    // this.store.dispatch(updateNodeSettings({ payload: this.selNode }));
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

  onUpdateNodeSettings(): boolean | void {
    if (this.selNode.settings.fiatConversion && !this.selNode.settings.currencyUnit) {
      return true;
    }
    this.logger.info(this.selNode.settings);
    this.store.dispatch(updateNodeSettings({ payload: this.selNode }));
  }

  onResetSettings() {
    const prevIndex = this.selNode.index || -1;
    this.selNode.settings = this.previousSettings;
    this.selectedThemeMode = this.themeModes.find((themeMode) => themeMode.id === this.previousSettings.themeMode) || this.themeModes[0];
    this.selectedThemeColor = this.previousSettings.themeColor;
    this.store.dispatch(setSelectedNode({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, prevLnNodeIndex: +prevIndex, currentLnNode: this.selNode, isInitialSetup: true } }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
