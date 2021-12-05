import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../../../shared/models/RTLconfig';
import { GetInfo, Offer } from '../../../../shared/models/clModels';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { CLCreateOfferComponent } from '../create-offer-modal/create-offer.component';
import { CLOfferInformationComponent } from '../offer-information-modal/offer-information.component';

import { RTLState } from '../../../../store/rtl.state';
import { openAlert } from '../../../../store/rtl.actions';
import { saveNewOffer } from '../../../store/cl.actions';
import { clNodeInformation, clNodeSettings, offers } from '../../../store/cl.selector';

@Component({
  selector: 'rtl-cl-offers-table',
  templateUrl: './offers-table.component.html',
  styleUrls: ['./offers-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Offers') }
  ]
})
export class CLOffersTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  faHistory = faHistory;
  public selNode: SelNodeChild = {};
  public newlyAddedOfferMemo = '';
  public newlyAddedOfferValue = 0;
  public description = '';
  public expiry: number;
  public offerValue: number = null;
  public offerValueHint = '';
  public displayedColumns: any[] = [];
  public offerPaymentReq = '';
  public offers: any;
  public offerJSONArr: Offer[] = [];
  public information: GetInfo = {};
  public flgSticky = false;
  public private = false;
  public expiryStep = 100;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private datePipe: DatePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['offer_id', 'single_use', 'used', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['offer_id', 'single_use', 'used', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['offer_id', 'single_use', 'used', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['offer_id', 'single_use', 'used', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(clNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild) => {
      this.selNode = nodeSettings;
    });
    this.store.select(clNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => {
      this.information = nodeInfo;
    });
    this.store.select(offers).pipe(takeUntil(this.unSubs[2])).
      subscribe((offersSeletor: { offers: Offer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = offersSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.offerJSONArr = offersSeletor.offers || [];
        if (this.offerJSONArr && this.offerJSONArr.length > 0 && this.sort && this.paginator) {
          this.loadOffersTable(this.offerJSONArr);
        }
        this.logger.info(offersSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.offerJSONArr && this.offerJSONArr.length > 0 && this.sort && this.paginator) {
      this.loadOffersTable(this.offerJSONArr);
    }
  }

  openCreateOfferModal() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          pageSize: this.pageSize,
          component: CLCreateOfferComponent
        }
      }
    }));
  }

  onOfferClick(selOffer: Offer) {
    const reCreatedOffer: Offer = {
      used: selOffer.used,
      single_use: selOffer.single_use,
      active: selOffer.active,
      offer_id: selOffer.offer_id,
      bolt12: selOffer.bolt12,
      bolt12_unsigned: selOffer.bolt12_unsigned
    };
    this.store.dispatch(openAlert({
      payload: {
        data: {
          offer: reCreatedOffer,
          newlyAdded: false,
          component: CLOfferInformationComponent
        }
      }
    }));
  }

  onDisableOffer(selOffer: Offer) {
  }

  onPrintOffer(selOffer: Offer) {
  }

  applyFilter() {
    this.offers.filter = this.selFilter.trim().toLowerCase();
  }

  loadOffersTable(invs: Offer[]) {
    this.offers = (invs) ? new MatTableDataSource<Offer>([...invs]) : new MatTableDataSource([]);
    this.offers.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.offers.sort = this.sort;
    this.offers.filterPredicate = (rowData: Offer, fltr: string) => {
      const newRowData = ((rowData.active) ? 'active' : 'inactive') + ((rowData.used) ? 'used' : 'unused') + ((rowData.single_use) ? 'single' : 'multiple') + JSON.stringify(rowData).toLowerCase();
      return newRowData.includes(fltr);
    };
    this.offers.paginator = this.paginator;
    this.applyFilter();
  }

  onDownloadCSV() {
    if (this.offers.data && this.offers.data.length > 0) {
      this.commonService.downloadFile(this.offers.data, 'Offers');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
