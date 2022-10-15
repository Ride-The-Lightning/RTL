import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faPenRuler } from '@fortawesome/free-solid-svg-icons';

import { CLN_DEFAULT_PAGE_SETTINGS, CLN_TABLE_FIELDS_DEF, PAGE_SIZE_OPTIONS, ScreenSizeEnum, SORT_ORDERS } from '../../../services/consts-enums-functions';
import { LoggerService } from '../../../services/logger.service';
import { CommonService } from '../../../services/common.service';
import { RTLState } from '../../../../store/rtl.state';
import { TableSetting, PageSettingsCLN } from '../../../models/pageSettings';
import { clnPageSettings } from '../../../../cln/store/cln.selector';
import { savePageSettings } from '../../../../cln/store/cln.actions';

@Component({
  selector: 'rtl-page-settings',
  templateUrl: './page-settings.component.html',
  styleUrls: ['./page-settings.component.scss']
})
export class PageSettingsComponent implements OnInit, OnDestroy {

  public faPenRuler = faPenRuler;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public pageSettings: PageSettingsCLN[] = [];
  public initialPageSettings: PageSettingsCLN[] = CLN_DEFAULT_PAGE_SETTINGS;
  public tableFieldsDef = CLN_TABLE_FIELDS_DEF;
  public sortOrders = SORT_ORDERS;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[0])).subscribe((settings) => {
      this.pageSettings = settings.pageSettings;
      this.initialPageSettings = JSON.parse(JSON.stringify(settings.pageSettings));
      this.logger.info(settings);
    });
  }

  onShowColumnsChange(table: TableSetting) {
    if (table.showColumns && !table.showColumns.includes(table.sortBy)) {
      table.sortBy = table.showColumns[0];
    }
  }

  onUpdatePageSettings(): boolean | void {
    if (this.pageSettings.reduce((pacc, page) => pacc || (page.tables.reduce((acc, table) => !(table.recordsPerPage && table.sortBy && table.sortOrder && table.showColumns && table.showColumns.length >= 3), false)), false)) {
      return true;
    }
    this.store.dispatch(savePageSettings({ payload: this.pageSettings }));
  }

  onResetPageSettings() {
    this.pageSettings = this.initialPageSettings;
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
