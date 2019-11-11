import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { faTools } from '@fortawesome/free-solid-svg-icons';

import { LightningNode, Settings, RTLConfiguration, GetInfoRoot } from '../../models/RTLconfig';
import { LoggerService } from '../../services/logger.service';

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
  public menus = [{id: 'vertical', name: 'Vertical'}, {id: 'horizontal', name: 'Horizontal'}];
  public menuTypes = [{id: 'regular', name: 'Regular'}, {id: 'compact', name: 'Compact'}, {id: 'mini', name: 'Mini'}];
  public themeModes = [{id: 'day', name: 'Day'}, {id: 'night', name: 'Night'}];
  public themeColors = ['purple-white', 'green', 'pink', 'blue'];
  public fontSizes = [{id: 1, name: 'Small', class: 'small-font'}, {id: 2, name: 'Regular', class: 'regular-font'}, {id: 3, name: 'Large', class: 'large-font'}];
  public selectedMenu = {id: 'vertical', name: 'Vertical'};
  public selectedMenuType = {id: 'regular', name: 'Regular'};
  public selectedFontSize = {id: 2, name: 'Regular', class: 'regular-font'};
  public selectedThemeMode = {id: 'day', name: 'Day'};
  public selectedThemeColor = 'blue';
  public currencyUnit = 'BTC';
  public smallerCurrencyUnit = 'SATS';
  public showSettingOption = true;
  public appConfig: RTLConfiguration;
  public previousSettings: Settings;

  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];
  @Output('done') done: EventEmitter<void> = new EventEmitter();

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

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
      this.smallerCurrencyUnit = (undefined !== this.information && undefined !== this.information.smaller_currency_unit) ? this.information.smaller_currency_unit : 'SATS';
      this.currencyUnit = (undefined !== this.information && undefined !== this.information.currency_unit) ? this.information.currency_unit : 'BTC';
      this.previousSettings = JSON.parse(JSON.stringify(this.selNode.settings));
      this.logger.info(rtlStore);
    });
  }

  public chooseMenuType() {
    this.selNode.settings.menuType = this.selectedMenuType.id;
  }

  public chooseFontSize() {
    this.selNode.settings.fontSize = (this.fontSizes.filter(fontSize => fontSize.id === this.selectedFontSize.id)[0]).class;
  }

  toggleSettings(toggleField: string, event?: any) {
    if (toggleField === 'satsToBTC') {
      this.store.dispatch(new RTLActions.SetChildNodeSettings({channelBackupPath: this.selNode.settings.channelBackupPath, satsToBTC: this.selNode.settings.satsToBTC}));
      this.store.dispatch(new RTLActions.SetChildNodeSettingsCL({channelBackupPath: this.selNode.settings.channelBackupPath, satsToBTC: this.selNode.settings.satsToBTC}));
    }
    if(toggleField === 'menu') {
      this.selNode.settings.flgSidenavOpened = (!event.checked) ? false : true;
      setTimeout(() => {
        this.selNode.settings.menu = (!event.checked) ? 'horizontal' : 'vertical';
      }, 10);
    } else {
      this.selNode.settings[toggleField] = !this.selNode.settings[toggleField];
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
    this.logger.info(this.selNode.settings);
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Settings...'));
    this.store.dispatch(new RTLActions.SaveSettings(this.selNode.settings));
    this.done.emit();
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
