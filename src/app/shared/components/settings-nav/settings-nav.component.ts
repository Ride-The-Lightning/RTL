import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Node, RTLConfiguration } from '../../models/RTLconfig';
import { GetInfo } from '../../models/lndModels';
import { LoggerService } from '../../services/logger.service';

import * as fromLNDReducer from '../../../lnd/store/lnd.reducers';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-settings-nav',
  templateUrl: './settings-nav.component.html',
  styleUrls: ['./settings-nav.component.scss']
})
export class SettingsNavComponent implements OnInit, OnDestroy {
  public selNode: Node;
  public information: GetInfo = {};
  public menus = ['Vertical', 'Horizontal'];
  public menuTypes = ['Regular', 'Compact', 'Mini'];
  public selectedMenu: string;
  public selectedMenuType: string;
  public currencyUnit = 'BTC';
  public showSettingOption = true;
  public appConfig: RTLConfiguration;

  unsubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];
  @Output() done: EventEmitter<void> = new EventEmitter();

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>, private lndStore: Store<fromLNDReducer.LNDState>) {}

  ngOnInit() {
    this.lndStore.select('lnd')
    .pipe(takeUntil(this.unsubs[2]))
    .subscribe(lndStore => {
      this.information = lndStore ? lndStore.information : {};
      this.currencyUnit = (undefined !== this.information && undefined !== this.information.currency_unit) ? this.information.currency_unit : 'BTC';
      this.logger.info(lndStore);
    });
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      this.selectedMenu = this.selNode.settings.menu;
      this.selectedMenuType = this.selNode.settings.menuType;
      if (window.innerWidth <= 768) {
        this.selNode.settings.menu = 'Vertical';
        this.selNode.settings.flgSidenavOpened = false;
        this.selNode.settings.flgSidenavPinned = false;
        this.showSettingOption = false;
      }
      this.logger.info(rtlStore);
    });
  }

  public chooseMenu() {
    this.selNode.settings.menu = this.selectedMenu;
  }

  public chooseMenuType() {
    this.selNode.settings.menuType = this.selectedMenuType;
  }

  toggleSettings(toggleField: string) {
    this.selNode.settings[toggleField] = !this.selNode.settings[toggleField];
  }

  changeTheme(newTheme: string) {
    this.selNode.settings.theme = newTheme;
  }

  onClose() {
    this.logger.info(this.selNode.settings);
    this.store.dispatch(new RTLActions.SaveSettings(this.selNode.settings));
    this.done.emit();
  }

  onSelectionChange(selNodeValue: Node) {
    this.selNode = selNodeValue;
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Selected Node...'));
    this.store.dispatch(new RTLActions.SetSelelectedNode(selNodeValue));
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
