import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, ECLActions, SortOrderEnum, ECL_DEFAULT_PAGE_SETTINGS } from '../../../shared/services/consts-enums-functions';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo, Invoice } from '../../../shared/models/eclModels';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { ECLCreateInvoiceComponent } from '../create-invoice-modal/create-invoice.component';
import { ECLInvoiceInformationComponent } from '../invoice-information-modal/invoice-information.component';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { createInvoice, invoiceLookup } from '../../store/ecl.actions';
import { eclNodeInformation, eclNodeSettings, eclPageSettings, invoices } from '../../store/ecl.selector';
import { PageSettings, TableSetting } from '../../../shared/models/pageSettings';

@Component({
  selector: 'rtl-ecl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') }
  ]
})
export class ECLLightningInvoicesComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() calledFrom = 'transactions'; // Transactions/home
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  faHistory = faHistory;
  public PAGE_ID = 'transactions';
  public tableSetting: TableSetting = { tableId: 'invoices', recordsPerPage: PAGE_SIZE, sortBy: 'expiresAt', sortOrder: SortOrderEnum.DESCENDING };
  public selNode: SelNodeChild | null = {};
  public newlyAddedInvoiceMemo: string | null = '';
  public newlyAddedInvoiceValue: number | null = 0;
  public description: string | null = '';
  public expiry: number | null;
  public invoiceValue: number | null = null;
  public invoiceValueHint = '';
  public displayedColumns: any[] = [];
  public invoicePaymentReq = '';
  public invoices: any = new MatTableDataSource([]);
  public invoiceJSONArr: Invoice[] = [];
  public information: GetInfo = {};
  public selFilter = '';
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private datePipe: DatePipe, private actions: Actions) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(eclNodeSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeSettings: SelNodeChild | null) => {
        this.selNode = nodeSettings;
      });
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[1])).
      subscribe((nodeInfo: any) => {
        this.information = <GetInfo>nodeInfo;
      });
    this.store.select(eclPageSettings).pipe(takeUntil(this.unSubs[2])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || ECL_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.unshift('status');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.logger.info(this.displayedColumns);
      });
    this.store.select(invoices).pipe(takeUntil(this.unSubs[3])).
      subscribe((invoicesSelector: { invoices: Invoice[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = invoicesSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.invoiceJSONArr = (invoicesSelector.invoices && invoicesSelector.invoices.length > 0) ? invoicesSelector.invoices : [];
        if (this.invoiceJSONArr && this.invoiceJSONArr.length > 0 && this.sort && this.paginator) {
          this.loadInvoicesTable(this.invoiceJSONArr);
        }
        this.logger.info(invoicesSelector);
      });
    this.actions.pipe(takeUntil(this.unSubs[4]), filter((action) => (action.type === ECLActions.SET_LOOKUP_ECL || action.type === ECLActions.UPDATE_API_CALL_STATUS_ECL))).
      subscribe((resLookup: any) => {
        if (resLookup.type === ECLActions.SET_LOOKUP_ECL) {
          if (this.invoiceJSONArr.length > 0 && this.sort && this.paginator && resLookup.payload) {
            this.updateInvoicesData(JSON.parse(JSON.stringify(resLookup.payload)));
            this.loadInvoicesTable(this.invoiceJSONArr);
          }
        }
      });
  }

  ngAfterViewInit() {
    if (this.invoiceJSONArr && this.invoiceJSONArr.length > 0 && this.sort && this.paginator) {
      this.loadInvoicesTable(this.invoiceJSONArr);
    }
  }

  openCreateInvoiceModal() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          pageSize: this.pageSize,
          component: ECLCreateInvoiceComponent
        }
      }
    }));
  }

  onAddInvoice(form: any): boolean | void {
    if (!this.description) {
      return true;
    }
    const expiryInSecs = (this.expiry ? this.expiry : 3600);
    this.newlyAddedInvoiceMemo = 'ulbl' + Math.random().toString(36).slice(2) + Date.now();
    this.newlyAddedInvoiceValue = this.invoiceValue;
    let invoicePayload: any = null;
    if (this.invoiceValue) {
      invoicePayload = { description: this.description, expireIn: expiryInSecs, amountMsat: this.invoiceValue * 1000 };
    } else {
      invoicePayload = { description: this.description, expireIn: expiryInSecs };
    }
    this.store.dispatch(createInvoice({ payload: invoicePayload }));
    this.resetData();
  }

  onInvoiceClick(selInvoice: Invoice) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          invoice: selInvoice,
          newlyAdded: false,
          component: ECLInvoiceInformationComponent
        }
      }
    }));
  }

  onRefreshInvoice(selInvoice: Invoice) {
    this.store.dispatch(invoiceLookup({ payload: selInvoice.paymentHash! }));
  }

  updateInvoicesData(newInvoice: Invoice) {
    this.invoiceJSONArr = this.invoiceJSONArr?.map((invoice) => ((invoice.paymentHash === newInvoice.paymentHash) ? newInvoice : invoice));
  }

  loadInvoicesTable(invs: Invoice[]) {
    this.invoices = invs ? new MatTableDataSource<Invoice>([...invs]) : new MatTableDataSource<Invoice>([]);
    this.invoices.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.invoices.sort = this.sort;
    this.invoices.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.invoices.filterPredicate = (rowData: Invoice, fltr: string) => {
      const newRowData = ((rowData.timestamp) ? this.datePipe.transform(new Date(rowData.timestamp * 1000), 'dd/MMM/YYYY HH:mm')?.toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
      return newRowData.includes(fltr);
    };
    this.invoices.paginator = this.paginator;
    this.applyFilter();
  }

  resetData() {
    this.description = '';
    this.invoiceValue = null;
    this.expiry = null;
    this.invoiceValueHint = '';
  }

  applyFilter() {
    this.invoices.filter = this.selFilter.trim().toLowerCase();
  }

  onInvoiceValueChange() {
    if (this.selNode && this.selNode.fiatConversion && this.invoiceValue && this.invoiceValue > 99) {
      this.invoiceValueHint = '';
      this.commonService.convertCurrency(this.invoiceValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, (this.selNode.currencyUnits && this.selNode.currencyUnits.length > 2 ? this.selNode.currencyUnits[2] : ''), this.selNode.fiatConversion).
        pipe(takeUntil(this.unSubs[5])).
        subscribe({
          next: (data) => {
            this.invoiceValueHint = '= ' + data.symbol + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit;
          }, error: (err) => {
            this.invoiceValueHint = 'Conversion Error: ' + err;
          }
        });
    }
  }

  onDownloadCSV() {
    if (this.invoices.data && this.invoices.data.length > 0) {
      this.commonService.downloadFile(this.invoices.data, 'Invoices');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
