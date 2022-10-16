import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faPenRuler, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { APICallStatusEnum, CLNActions, CLN_DEFAULT_PAGE_SETTINGS, CLN_TABLES_DEF, PAGE_SIZE_OPTIONS, ScreenSizeEnum, SORT_ORDERS } from '../../../services/consts-enums-functions';
import { LoggerService } from '../../../services/logger.service';
import { CommonService } from '../../../services/common.service';
import { RTLState } from '../../../../store/rtl.state';
import { TableSetting, PageSettingsCLN } from '../../../models/pageSettings';
import { clnPageSettings } from '../../../../cln/store/cln.selector';
import { savePageSettings } from '../../../../cln/store/cln.actions';
import { ApiCallStatusPayload } from '../../../models/apiCallsPayload';

@Component({
  selector: 'rtl-page-settings',
  templateUrl: './page-settings.component.html',
  styleUrls: ['./page-settings.component.scss']
})
export class PageSettingsComponent implements OnInit, OnDestroy {

  public faPenRuler = faPenRuler;
  public faExclamationTriangle = faExclamationTriangle;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public pageSettings: PageSettingsCLN[] = [];
  public initialPageSettings: PageSettingsCLN[] = CLN_DEFAULT_PAGE_SETTINGS;
  public tableFieldsDef = CLN_TABLES_DEF;
  public sortOrders = SORT_ORDERS;
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  public errorMessage: any = null;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private actions: Actions) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettingsCLN[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = null;
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || null;
        }
        this.pageSettings = settings.pageSettings;
        this.initialPageSettings = JSON.parse(JSON.stringify(settings.pageSettings));
        this.logger.info(settings);
      });
    this.actions.pipe(takeUntil(this.unSubs[1]), filter((action) => action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN || action.type === CLNActions.SAVE_PAGE_SETTINGS_CLN)).
      subscribe((action: any) => {
        if (action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SavePageSettings') {
          this.errorMessage = JSON.parse(action.payload.message);
        }
      });
  }

  onShowColumnsChange(table: TableSetting) {
    if (table.showColumns && !table.showColumns.includes(table.sortBy)) {
      table.sortBy = table.showColumns[0];
    }
  }

  onUpdatePageSettings(): boolean | void {
    if (this.pageSettings.reduce((pacc, page) => pacc || (page.tables.reduce((acc, table) => !(table.recordsPerPage && table.sortBy && table.sortOrder && table.showColumns && table.showColumns.length >= 2), false)), false)) {
      return true;
    }
    this.errorMessage = '';
    this.store.dispatch(savePageSettings({ payload: this.pageSettings }));
  }

  onResetPageSettings() {
    this.errorMessage = null;
    this.pageSettings = this.initialPageSettings;
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
