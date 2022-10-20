import { Component, OnInit, OnDestroy } from '@angular/core';
import { combineLatest, Subject } from 'rxjs';
import { filter, takeUntil, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faPenRuler, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { APICallStatusEnum, CLNActions, CLN_DEFAULT_PAGE_SETTINGS, CLN_TABLES_DEF, LNDActions, LND_DEFAULT_PAGE_SETTINGS, LND_TABLES_DEF, PAGE_SIZE_OPTIONS, ScreenSizeEnum, SORT_ORDERS } from '../../../services/consts-enums-functions';
import { LoggerService } from '../../../services/logger.service';
import { CommonService } from '../../../services/common.service';
import { RTLState } from '../../../../store/rtl.state';
import { TableSetting, PageSettings } from '../../../models/pageSettings';
import { clnNodeSettings, clnPageSettings } from '../../../../cln/store/cln.selector';
import { savePageSettings } from '../../../../cln/store/cln.actions';
import { ApiCallStatusPayload } from '../../../models/apiCallsPayload';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { SelNodeChild, ConfigSettingsNode } from '../../../models/RTLconfig';
import { lndNodeSettings, lndPageSettings } from '../../../../lnd/store/lnd.selector';

@Component({
  selector: 'rtl-page-settings',
  templateUrl: './page-settings.component.html',
  styleUrls: ['./page-settings.component.scss']
})
export class PageSettingsComponent implements OnInit, OnDestroy {

  public faPenRuler = faPenRuler;
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: ConfigSettingsNode;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public pageSettings: PageSettings[] = [];
  public initialPageSettings: PageSettings[] = [];
  public tableFieldsDef = {};
  public sortOrders = SORT_ORDERS;
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  public errorMessage: any = null;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private actions: Actions) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((selNode) => {
      this.selNode = selNode;
      this.logger.info(this.selNode);
      switch (this.selNode.lnImplementation) {
        case 'CLN':
          this.initialPageSettings = Object.assign([], CLN_DEFAULT_PAGE_SETTINGS);
          this.tableFieldsDef = CLN_TABLES_DEF;
          this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[1]),
            withLatestFrom(this.store.select(clnNodeSettings))).
            subscribe(([settings, nodeSettings]: [{ pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }, (SelNodeChild | null)]) => {
              const updatedPageSettings = JSON.parse(JSON.stringify(settings.pageSettings));
              this.errorMessage = null;
              this.apiCallStatus = settings.apiCallStatus;
              if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
                this.errorMessage = this.apiCallStatus.message || null;
                this.pageSettings = updatedPageSettings;
                this.initialPageSettings = updatedPageSettings;
              } else {
                if (!nodeSettings?.enableOffers) {
                  const transactionsPage = updatedPageSettings.find((pg) => pg.pageId === 'transactions');
                  transactionsPage?.tables.splice(transactionsPage?.tables.findIndex((tb) => tb.tableId === 'offers'), 1);
                  transactionsPage?.tables.splice(transactionsPage?.tables.findIndex((tb) => tb.tableId === 'offer_bookmarks'), 1);
                }
                if (!nodeSettings?.enablePeerswap) {
                  updatedPageSettings.splice(updatedPageSettings.findIndex((pg) => pg.pageId === 'peerswap'), 1);
                }
                this.pageSettings = updatedPageSettings;
                this.initialPageSettings = updatedPageSettings;
              }
              this.logger.info(updatedPageSettings);
            });
          this.actions.pipe(takeUntil(this.unSubs[2]), filter((action) => action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN || action.type === CLNActions.SAVE_PAGE_SETTINGS_CLN)).
            subscribe((action: any) => {
              if (action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SavePageSettings') {
                this.errorMessage = JSON.parse(action.payload.message);
              }
            });
          break;

        default:
          this.initialPageSettings = Object.assign([], LND_DEFAULT_PAGE_SETTINGS);
          this.tableFieldsDef = LND_TABLES_DEF;
          this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[1]),
            withLatestFrom(this.store.select(lndNodeSettings))).
            subscribe(([settings, nodeSettings]: [{ pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }, (SelNodeChild | null)]) => {
              const updatedPageSettings: PageSettings[] = JSON.parse(JSON.stringify(settings.pageSettings));
              this.errorMessage = null;
              this.apiCallStatus = settings.apiCallStatus;
              if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
                this.errorMessage = this.apiCallStatus.message || null;
                this.pageSettings = updatedPageSettings;
                this.initialPageSettings = updatedPageSettings;
              } else {
                if (!nodeSettings?.swapServerUrl || nodeSettings.swapServerUrl.trim() === '') {
                  updatedPageSettings.splice(updatedPageSettings.findIndex((pg) => pg.pageId === 'loop'), 1);
                }
                if (!nodeSettings?.boltzServerUrl || nodeSettings.boltzServerUrl.trim() === '') {
                  updatedPageSettings.splice(updatedPageSettings.findIndex((pg) => pg.pageId === 'boltz'), 1);
                }
                this.pageSettings = updatedPageSettings;
                this.initialPageSettings = updatedPageSettings;
              }
              this.logger.info(updatedPageSettings);
            });
          this.actions.pipe(takeUntil(this.unSubs[2]), filter((action) => action.type === LNDActions.UPDATE_API_CALL_STATUS_LND || action.type === LNDActions.SAVE_PAGE_SETTINGS_LND)).
            subscribe((action: any) => {
              if (action.type === LNDActions.UPDATE_API_CALL_STATUS_LND && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SavePageSettings') {
                this.errorMessage = JSON.parse(action.payload.message);
              }
            });
          break;
      }
    });
  }

  oncolumnSelectionChange(table: TableSetting) {
    if (table.columnSelection && !table.columnSelection.includes(table.sortBy)) {
      table.sortBy = table.columnSelection[0];
    }
  }

  onUpdatePageSettings(): boolean | void {
    if (this.pageSettings.reduce((pacc, page) => pacc || (page.tables.reduce((acc, table) => !(table.recordsPerPage && table.sortBy && table.sortOrder && table.columnSelection && table.columnSelection.length >= 2), false)), false)) {
      return true;
    }
    this.errorMessage = '';
    this.store.dispatch(savePageSettings({ payload: this.pageSettings }));
  }

  onTableReset(currPageId: string, currTable: TableSetting) {
    const pageIdx = this.pageSettings.findIndex((page) => page.pageId === currPageId);
    const tableIdx = this.pageSettings[pageIdx].tables.findIndex((table) => table.tableId === currTable.tableId);
    const tableToReplace = CLN_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === currPageId)?.tables.find((table) => table.tableId === currTable.tableId) || this.pageSettings.find((page) => page.pageId === currPageId)?.tables.find((table) => table.tableId === currTable.tableId);
    this.pageSettings[pageIdx].tables.splice(tableIdx, 1, tableToReplace!);
  }

  onResetPageSettings(prev: string) {
    if (prev === 'current') {
      this.errorMessage = null;
      this.pageSettings = JSON.parse(JSON.stringify(this.initialPageSettings));
    } else {
      this.errorMessage = null;
      this.pageSettings = JSON.parse(JSON.stringify(CLN_DEFAULT_PAGE_SETTINGS));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
