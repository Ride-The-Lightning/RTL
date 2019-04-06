import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Settings } from '../../models/RTLconfig';
import { GetInfo } from '../../models/lndModels';
import { LoggerService } from '../../services/logger.service';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-settings-nav',
  templateUrl: './settings-nav.component.html',
  styleUrls: ['./settings-nav.component.scss']
})
export class SettingsNavComponent implements OnInit, OnDestroy {
  public information: GetInfo = {};
  public settings: Settings;
  public menus = ['Vertical', 'Horizontal'];
  public menuTypes = ['Regular', 'Compact', 'Mini'];
  public selectedMenu: string;
  public selectedMenuType: string;
  public currencyUnit = 'BTC';
  public showSettingOption = true;
  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];
  @Output('done') done: EventEmitter<void> = new EventEmitter();

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>) {}

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      this.settings = rtlStore.appConfig.nodes[0].settings;
      this.selectedMenu = this.settings.menu;
      this.selectedMenuType = this.settings.menuType;
      if (window.innerWidth <= 768) {
        this.settings.menu = 'Vertical';
        this.settings.flgSidenavOpened = false;
        this.settings.flgSidenavPinned = false;
        this.showSettingOption = false;
      }
      this.information = rtlStore.information;
      this.currencyUnit = (undefined !== this.information && undefined !== this.information.currency_unit) ? this.information.currency_unit : 'BTC';
      this.logger.info(rtlStore);
    });
  }

  public chooseMenu() {
    this.settings.menu = this.selectedMenu;
  }

  public chooseMenuType() {
    this.settings.menuType = this.selectedMenuType;
  }

  toggleSettings(toggleField: string) {
    this.settings[toggleField] = !this.settings[toggleField];
  }

  changeTheme(newTheme: string) {
    this.settings.theme = newTheme;
  }

  onClose() {
    this.logger.info(this.settings);
    this.store.dispatch(new RTLActions.SaveSettings(this.settings));
    this.done.emit();
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
