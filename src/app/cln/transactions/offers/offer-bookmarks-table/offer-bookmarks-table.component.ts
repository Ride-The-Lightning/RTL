import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, PaymentTypes, AlertTypeEnum } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { OfferBookmark } from '../../../../shared/models/clnModels';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLEffects } from '../../../../store/rtl.effects';
import { RTLState } from '../../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../../store/rtl.actions';
import { offerBookmarks } from '../../../store/cln.selector';
import { CLNOfferInformationComponent } from '../offer-information-modal/offer-information.component';
import { CLNLightningSendPaymentsComponent } from '../../send-payment-modal/send-payment.component';
import { deleteOfferBookmark } from '../../../store/cln.actions';

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
  public displayedColumns: any[] = [];
  public offersBookmarks: any;
  public offersBookmarksJSONArr: OfferBookmark[] = [];
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public selFilter = '';
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService, private rtlEffects: RTLEffects) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['lastUpdatedAt', 'title', 'amountmSat', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['lastUpdatedAt', 'title', 'amountmSat', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['lastUpdatedAt', 'title', 'amountmSat', 'description', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['lastUpdatedAt', 'title', 'amountmSat', 'description', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(offerBookmarks).pipe(takeUntil(this.unSubs[0])).
      subscribe((offerBMsSeletor: { offersBookmarks: OfferBookmark[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = offerBMsSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.offersBookmarksJSONArr = offerBMsSeletor.offersBookmarks || [];
        if (this.offersBookmarksJSONArr && this.offersBookmarksJSONArr.length > 0 && this.sort && this.paginator) {
          this.loadOffersTable(this.offersBookmarksJSONArr);
        }
        this.logger.info(offerBMsSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.offersBookmarksJSONArr && this.offersBookmarksJSONArr.length > 0 && this.sort && this.paginator) {
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
    this.rtlEffects.closeConfirm.pipe(takeUntil(this.unSubs[1])).subscribe((confirmRes) => {
      if (confirmRes) {
        this.store.dispatch(deleteOfferBookmark({ payload: { bolt12: selOffer.bolt12 } }));
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

  loadOffersTable(OffrBMs: OfferBookmark[]) {
    this.offersBookmarks = (OffrBMs) ? new MatTableDataSource<OfferBookmark>([...OffrBMs]) : new MatTableDataSource([]);
    this.offersBookmarks.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.offersBookmarks.sort = this.sort;
    this.offersBookmarks.filterPredicate = (Ofrbm: OfferBookmark, fltr: string) => JSON.stringify(Ofrbm).toLowerCase().includes(fltr);
    this.offersBookmarks.paginator = this.paginator;
    this.applyFilter();
  }

  onDownloadCSV() {
    if (this.offersBookmarks.data && this.offersBookmarks.data.length > 0) {
      this.commonService.downloadFile(this.offersBookmarks.data, 'OfferBookmarks');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
