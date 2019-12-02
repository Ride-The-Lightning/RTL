import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { faTools } from '@fortawesome/free-solid-svg-icons';

import { CURRENCY_UNITS, AlertTypeEnum } from '../../services/consts-enums-functions';
import { LightningNode, Settings, RTLConfiguration, GetInfoRoot } from '../../models/RTLconfig';
import { LoggerService } from '../../services/logger.service';
import { CommonService } from '../../services/common.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-app-settings',
  templateUrl: './app-settings.component.html',
  styleUrls: ['./app-settings.component.scss']
})
export class AppSettingsComponent implements OnInit, OnDestroy {
  public faTools = faTools;
  public selNode: LightningNode;
  public information: GetInfoRoot = {};
  public currencyUnits = [{id: 'USD', name: 'United States Dollar'}, {id: 'GBP', name: 'Pound'}, {id: 'INR', name: 'Indian Rupee'}];
  public menus = [{id: 'vertical', name: 'Vertical'}, {id: 'horizontal', name: 'Horizontal'}];
  public menuTypes = [{id: 'regular', name: 'Regular'}, {id: 'compact', name: 'Compact'}, {id: 'mini', name: 'Mini'}];
  public themeModes = [{id: 'day', name: 'Day'}, {id: 'night', name: 'Night'}];
  public themeColors = ['purple', 'teal', 'indigo', 'pink'];
  public fontSizes = [{id: 1, name: 'Small', class: 'small-font'}, {id: 2, name: 'Regular', class: 'regular-font'}, {id: 3, name: 'Large', class: 'large-font'}];
  public selectedMenu = {id: 'vertical', name: 'Vertical'};
  public selectedMenuType = {id: 'regular', name: 'Regular'};
  public selectedFontSize = {id: 2, name: 'Regular', class: 'regular-font'};
  public selectedThemeMode = {id: 'day', name: 'Day'};
  public selectedThemeColor = 'blue';
  public currencyUnit = 'BTC';
  public smallerCurrencyUnit = 'Sats';
  public showSettingOption = true;
  public appConfig: RTLConfiguration;
  public previousSettings: Settings;
  public previousDefaultNode = 0;

  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];
  @Output('done') done: EventEmitter<void> = new EventEmitter();

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      this.selectedMenu = this.menus.find(menu => menu.id === this.selNode.settings.menu);
      this.selectedMenuType = this.menuTypes.find(menuType => this.selNode.settings.menuType === menuType.id);
      this.selectedThemeMode = this.themeModes.find(themeMode => this.selNode.settings.themeMode === themeMode.id);
      this.selectedThemeColor = this.selNode.settings.themeColor;
      this.selectedFontSize = this.fontSizes.find(fontSize => fontSize.class === this.selNode.settings.fontSize);
      if (window.innerWidth <= 768) {
        this.selNode.settings.menu = 'vertical';
        this.selNode.settings.flgSidenavOpened = false;
        this.selNode.settings.flgSidenavPinned = false;
        this.showSettingOption = false;
      }
      this.information = rtlStore.nodeData;
      this.smallerCurrencyUnit = (undefined !== this.information && undefined !== this.information.smaller_currency_unit) ? this.information.smaller_currency_unit : 'Sats';
      this.currencyUnit = (undefined !== this.information && undefined !== this.information.currency_unit) ? this.information.currency_unit : 'BTC';
      this.previousSettings = JSON.parse(JSON.stringify(this.selNode.settings));
      this.previousDefaultNode = this.appConfig.defaultNodeIndex;
      this.logger.info(rtlStore);
    });
  }

  onCurrencyChange(event: any) {
    this.selNode.settings.currencyUnits = [...CURRENCY_UNITS, event.value];
    this.store.dispatch(new RTLActions.SetChildNodeSettings({channelBackupPath: this.selNode.settings.channelBackupPath, satsToBTC: this.selNode.settings.satsToBTC, currencyUnit: event.value, currencyUnits: this.selNode.settings.currencyUnits}));
    this.store.dispatch(new RTLActions.SetChildNodeSettingsCL({channelBackupPath: this.selNode.settings.channelBackupPath, satsToBTC: this.selNode.settings.satsToBTC, currencyUnit: event.value, currencyUnits: this.selNode.settings.currencyUnits}));
  }

  chooseMenuType() {
    this.selNode.settings.menuType = this.selectedMenuType.id;
    this.commonService.changeContainerWidth('menuType');
  }

  chooseFontSize() {
    this.selNode.settings.fontSize = (this.fontSizes.filter(fontSize => fontSize.id === this.selectedFontSize.id)[0]).class;
  }

  toggleSettings(toggleField: string, event?: any) {
    if (toggleField === 'satsToBTC') {
      this.store.dispatch(new RTLActions.SetChildNodeSettings({channelBackupPath: this.selNode.settings.channelBackupPath, satsToBTC: this.selNode.settings.satsToBTC, currencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits}));
      this.store.dispatch(new RTLActions.SetChildNodeSettingsCL({channelBackupPath: this.selNode.settings.channelBackupPath, satsToBTC: this.selNode.settings.satsToBTC, currencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits}));
    }
    if(toggleField === 'menu') {
      this.selNode.settings.flgSidenavOpened = (!event.checked) ? false : true;
      setTimeout(() => {
        this.selNode.settings.menu = (!event.checked) ? 'horizontal' : 'vertical';
      }, 10);
    } else {
      this.selNode.settings[toggleField] = !this.selNode.settings[toggleField];
      if(toggleField === 'flgSidenavOpened' || toggleField === 'flgSidenavPinned') {
        this.commonService.changeContainerWidth(toggleField);
      }
    }
  }

  changeThemeColor(newThemeColor: string) {
    this.selectedThemeColor = newThemeColor;
    this.selNode.settings.themeColor = newThemeColor;
  }

  chooseThemeMode() {
    this.selNode.settings.themeMode = this.selectedThemeMode.id;
  }

  onUpdateSettings() {
    let updatedSettings = (JSON.stringify(this.previousSettings) !== JSON.stringify(this.selNode.settings)) ? this.selNode.settings : null;
    let defaultNodeIndex = (this.previousDefaultNode !== this.appConfig.defaultNodeIndex) ? this.appConfig.defaultNodeIndex : null;
    this.logger.info(this.selNode.settings);
    if (!updatedSettings && !defaultNodeIndex) {
      this.store.dispatch(new RTLActions.OpenAlert({ width: '55%', data: {
        type: AlertTypeEnum.WARNING,
        alertTitle: 'Configuration Not Updated',
        titleMessage: 'Nothing has been updated to save!'
      }}));
    } else {
      this.store.dispatch(new RTLActions.OpenSpinner('Updating Settings...'));
      this.store.dispatch(new RTLActions.SaveSettings({settings: updatedSettings, defaultNodeIndex: defaultNodeIndex}));
      this.done.emit();
    }
  }

  onResetSettings() {
    this.selNode.settings = this.previousSettings;
    this.selectedMenu = this.menus.find(menu => menu.id === this.previousSettings.menu);
    this.selectedMenuType = this.menuTypes.find(menuType => menuType.id === this.previousSettings.menuType);
    this.selectedFontSize = this.fontSizes.find(fontSize => fontSize.class === this.previousSettings.fontSize);
    this.selectedThemeMode = this.themeModes.find(themeMode => themeMode.id === this.previousSettings.themeMode);
    this.selectedThemeColor = this.previousSettings.themeColor;
    this.store.dispatch(new RTLActions.SetSelelectedNode({ lnNode: this.selNode, isInitialSetup: true }));    
  }  

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
