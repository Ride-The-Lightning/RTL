import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, PaymentTypes, AlertTypeEnum, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, UI_MESSAGES, CLN_PAGE_DEFS } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { OfferBookmark } from '../../../../shared/models/clnModels';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLEffects } from '../../../../store/rtl.effects';
import { RTLState } from '../../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../../store/rtl.actions';
import { clnPageSettings, offerBookmarks } from '../../../store/cln.selector';
import { CLNOfferInformationComponent } from '../offer-information-modal/offer-information.component';
import { CLNLightningSendPaymentsComponent } from '../../send-payment-modal/send-payment.component';
import { deleteOfferBookmark, sendPayment } from '../../../store/cln.actions';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../../shared/pipes/app.pipe';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'rtl-cln-offer-bookmarks-table',
  templateUrl: './offer-bookmarks-table.component.html',
  styleUrls: ['./offer-bookmarks-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Offer Bookmarks') }
  ]
})
export class CLNOfferBookmarksTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  faHistory = faHistory;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'transactions';
  public tableSetting: TableSetting = { tableId: 'offer_bookmarks', recordsPerPage: PAGE_SIZE, sortBy: 'lastUpdatedAt', sortOrder: SortOrderEnum.DESCENDING };
  public displayedColumns: any[] = [];
  public offersBookmarks: any = new MatTableDataSource([]);
  public offersBookmarksJSONArr: OfferBookmark[] = [];
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public selFilter = '';
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService, private rtlEffects: RTLEffects, private datePipe: DatePipe, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || CLN_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(offerBookmarks).pipe(takeUntil(this.unSubs[1])).
      subscribe((offerBMsSeletor: { offersBookmarks: OfferBookmark[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = offerBMsSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.offersBookmarksJSONArr = offerBMsSeletor.offersBookmarks || [];
        if (this.offersBookmarksJSONArr && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadOffersTable(this.offersBookmarksJSONArr);
        }
        this.logger.info(offerBMsSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.offersBookmarksJSONArr && this.sort && this.paginator && this.displayedColumns.length > 0) {
      this.loadOffersTable(this.offersBookmarksJSONArr);
    }
  }

  onOfferBookmarkClick(selOffer: OfferBookmark) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          offer: { bolt12: selOffer.bolt12 },
          newlyAdded: false,
          component: CLNOfferInformationComponent
        }
      }
    }));
  }

  onDeleteBookmark(selOffer: OfferBookmark) {
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Delete Bookmark',
          titleMessage: 'Deleting Bookmark: ' + (selOffer.title || selOffer.description),
          noBtnText: 'Cancel',
          yesBtnText: 'Delete'
        }
      }
    }));
    this.rtlEffects.closeConfirm.pipe(takeUntil(this.unSubs[2])).subscribe((confirmRes) => {
      if (confirmRes) {
        this.store.dispatch(deleteOfferBookmark({ payload: { bolt12: selOffer.bolt12! } }));
      }
    });
  }

  onRePayOffer(selOffer: OfferBookmark) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          paymentType: PaymentTypes.OFFER,
          bolt12: selOffer.bolt12,
          offerTitle: selOffer.title,
          component: CLNLightningSendPaymentsComponent
        }
      }
    }));
  }

  applyFilter() {
    this.offersBookmarks.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.offersBookmarks.filterPredicate = (rowData: OfferBookmark, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = JSON.stringify(rowData).toLowerCase();
          break;

        case 'lastUpdatedAt':
          rowToFilter = this.datePipe.transform(new Date(rowData.lastUpdatedAt || 0), 'dd/MMM/y HH:mm')?.toLowerCase() || '';
          break;

        case 'amountMSat':
          rowToFilter = ((!rowData.amountMSat || rowData.amountMSat === 0) ? 'Open' : (rowData.amountMSat / 1000).toString()) || '';
          break;

        default:
          rowToFilter = !rowData[this.selFilterBy] ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return rowToFilter.includes(fltr);
    };
  }

  loadOffersTable(OffrBMs: OfferBookmark[]) {
    this.offersBookmarks = (OffrBMs) ? new MatTableDataSource<OfferBookmark>([...OffrBMs]) : new MatTableDataSource([]);
    this.offersBookmarks.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.offersBookmarks.sort = this.sort;
    this.offersBookmarks.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.offersBookmarks.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
  }

  onDownloadCSV() {
    if (this.offersBookmarks.data && this.offersBookmarks.data.length > 0) {
      this.commonService.downloadFile(this.offersBookmarks.data, 'OfferBookmarks');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
