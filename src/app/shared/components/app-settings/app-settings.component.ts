import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { faTools } from '@fortawesome/free-solid-svg-icons';

import { LightningNode, RTLConfiguration, GetInfoRoot } from '../../models/RTLconfig';
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
  public menus = ['Vertical', 'Horizontal'];
  public menuTypes = ['Regular', 'Compact', 'Mini'];
  public themeModes = ['Day', 'Night'];
  public fontSizes = [{id: 1, name: 'Small', class: 'small-font'}, {id: 2, name: 'Regular', class: 'regular-font'}, {id: 3, name: 'Large', class: 'large-font'}];
  public selectedMenu: string;
  public selectedMenuType: string;
  public selectedFontSize: any;
  public selectedThemeMode = 'Day';
  public currencyUnit = 'BTC';
  public smallerCurrencyUnit = 'SATS';
  public showSettingOption = true;
  public appConfig: RTLConfiguration;

  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];
  @Output('done') done: EventEmitter<void> = new EventEmitter();

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      this.selectedMenu = this.selNode.settings.menu;
      this.selectedMenuType = this.selNode.settings.menuType;
      this.selectedFontSize = this.fontSizes.filter(fontSize => fontSize.class === this.selNode.settings.fontSize)[0];
      if (window.innerWidth <= 768) {
        this.selNode.settings.menu = 'Vertical';
        this.selNode.settings.flgSidenavOpened = false;
        this.selNode.settings.flgSidenavPinned = false;
        this.showSettingOption = false;
      }
      this.information = rtlStore.nodeData;
      this.smallerCurrencyUnit = (undefined !== this.information && undefined !== this.information.smaller_currency_unit) ? this.information.smaller_currency_unit : 'SATS';
      this.currencyUnit = (undefined !== this.information && undefined !== this.information.currency_unit) ? this.information.currency_unit : 'BTC';
      this.logger.info(rtlStore);
    });
  }

  public chooseMenuType() {
    this.selNode.settings.menuType = this.selectedMenuType;
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
        this.selNode.settings.menu = (!event.checked) ? 'Horizontal' : 'Vertical';
      }, 10);
    } else {
      this.selNode.settings[toggleField] = !this.selNode.settings[toggleField];
    }
  }

  changeTheme(newTheme: string) {
    this.selNode.settings.theme = newTheme;
  }

  choosethemeMode() {

  }

  onUpdateSettings() {
    this.logger.info(this.selNode.settings);
    this.store.dispatch(new RTLActions.SaveSettings(this.selNode.settings));
    this.done.emit();
  }

  onSelectionChange(selNodeValue: LightningNode) {
    this.selNode = selNodeValue;
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Selected Node...'));
    this.store.dispatch(new RTLActions.SetSelelectedNode({ lnNode: selNodeValue, isInitialSetup: false }));
  }

  onResetSettings() {

  }  

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
