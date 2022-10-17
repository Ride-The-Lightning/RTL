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

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, UI_MESSAGES, CLNActions, CLN_DEFAULT_PAGE_SETTINGS, SortOrderEnum } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../../../shared/models/RTLconfig';
import { GetInfo, Invoice, ListInvoices } from '../../../../shared/models/clnModels';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { CLNCreateInvoiceComponent } from '../create-invoice-modal/create-invoice.component';
import { CLNInvoiceInformationComponent } from '../invoice-information-modal/invoice-information.component';

import { RTLEffects } from '../../../../store/rtl.effects';
import { RTLState } from '../../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../../store/rtl.actions';
import { deleteExpiredInvoice, invoiceLookup, saveNewInvoice } from '../../../store/cln.actions';
import { clnNodeInformation, clnNodeSettings, clnPageSettings, listInvoices } from '../../../store/cln.selector';
import { PageSettingsCLN, TableSetting } from '../../../../shared/models/pageSettings';

@Component({
  selector: 'rtl-cln-lightning-invoices-table',
  templateUrl: './lightning-invoices-table.component.html',
  styleUrls: ['./lightning-invoices-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') }
  ]
})
export class CLNLightningInvoicesTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() calledFrom = 'transactions'; // Transactions/home
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  faHistory = faHistory;
  public PAGE_ID = 'invoices';
  public tableSetting: TableSetting = { tableId: 'invoices', recordsPerPage: 10, sortBy: 'expires_at', sortOrder: SortOrderEnum.DESCENDING };
  public selNode: SelNodeChild | null = {};
  public newlyAddedInvoiceMemo = '';
  public newlyAddedInvoiceValue = 0;
  public description = '';
  public expiry: number | null;
  public invoiceValue: number | null = null;
  public invoiceValueHint = '';
  public displayedColumns: any[] = [];
  public invoicePaymentReq = '';
  public invoices: any;
  public invoiceJSONArr: Invoice[] = [];
  public information: GetInfo = {};
  public private = false;
  public expiryStep = 100;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private rtlEffects: RTLEffects, private datePipe: DatePipe, private actions: Actions) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(clnNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild | null) => {
      this.selNode = <SelNodeChild>nodeSettings;
    });
    this.store.select(clnNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => {
      this.information = nodeInfo;
    });
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[2])).
      subscribe((settings: { pageSettings: PageSettingsCLN[], apiCallStatus: ApiCallStatusPayload }) => {
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
        this.displayedColumns.unshift('status');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.logger.info(this.displayedColumns);
      });
    this.store.select(listInvoices).pipe(takeUntil(this.unSubs[3])).
      subscribe((invoicesSeletor: { listInvoices: ListInvoices, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = invoicesSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.invoiceJSONArr = invoicesSeletor.listInvoices.invoices || [];
        if (this.invoiceJSONArr && this.invoiceJSONArr.length > 0 && this.sort && this.paginator) {
          this.loadInvoicesTable(this.invoiceJSONArr);
        }
        this.logger.info(invoicesSeletor);
      });
    this.actions.pipe(takeUntil(this.unSubs[4]), filter((action) => (action.type === CLNActions.SET_LOOKUP_CLN || action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN))).
      subscribe((resLookup: any) => {
        if (resLookup.type === CLNActions.SET_LOOKUP_CLN) {
          if (this.invoiceJSONArr && this.invoiceJSONArr.length > 0 && this.sort && this.paginator && resLookup.payload) {
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
          component: CLNCreateInvoiceComponent
        }
      }
    }));
  }

  onAddInvoice(form: any) {
    if (!this.invoiceValue) {
      this.invoiceValue = 0;
    }
    const expiryInSecs = (this.expiry ? this.expiry : 3600);
    this.newlyAddedInvoiceMemo = 'ulbl' + Math.random().toString(36).slice(2) + Date.now();
    this.newlyAddedInvoiceValue = this.invoiceValue;
    this.store.dispatch(saveNewInvoice({
      payload: {
        label: this.newlyAddedInvoiceMemo, amount: this.invoiceValue * 1000, description: this.description, expiry: expiryInSecs, private: this.private
      }
    }));
    this.resetData();
  }

  onDeleteExpiredInvoices() {
    this.store.dispatch(openConfirmation({
      payload: {
        data: { type: 'CONFIRM', titleMessage: 'Delete Expired Invoices', noBtnText: 'Cancel', yesBtnText: 'Delete Invoices' }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[5])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(deleteExpiredInvoice({ payload: null }));
        }
      });
  }

  onInvoiceClick(selInvoice: Invoice) {
    const reCreatedInvoice: Invoice = {
      msatoshi: selInvoice.msatoshi,
      label: selInvoice.label,
      expires_at: selInvoice.expires_at,
      paid_at: selInvoice.paid_at,
      bolt11: selInvoice.bolt11,
      payment_hash: selInvoice.payment_hash,
      description: selInvoice.description,
      status: selInvoice.status,
      msatoshi_received: selInvoice.msatoshi_received
    };
    this.store.dispatch(openAlert({
      payload: {
        data: {
          invoice: reCreatedInvoice,
          newlyAdded: false,
          component: CLNInvoiceInformationComponent
        }
      }
    }));
  }

  resetData() {
    this.description = '';
    this.invoiceValue = null;
    this.private = false;
    this.expiry = null;
    this.invoiceValueHint = '';
  }

  applyFilter() {
    this.invoices.filter = this.selFilter.trim().toLowerCase();
  }

  onInvoiceValueChange() {
    if (this.selNode && this.selNode.fiatConversion && this.invoiceValue! > 99) {
      this.invoiceValueHint = '';
      this.commonService.convertCurrency(this.invoiceValue!, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, (this.selNode?.currencyUnits && this.selNode.currencyUnits.length > 2 ? this.selNode.currencyUnits[2] : ''), this.selNode.fiatConversion).
        pipe(takeUntil(this.unSubs[6])).
        subscribe({
          next: (data) => {
            this.invoiceValueHint = '= ' + data.symbol + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit;
          }, error: (err) => {
            this.invoiceValueHint = 'Conversion Error: ' + err;
          }
        });
    }
  }

  onRefreshInvoice(selInvoice: Invoice) {
    this.store.dispatch(invoiceLookup({ payload: selInvoice.label! }));
  }

  updateInvoicesData(newInvoice: Invoice) {
    this.invoiceJSONArr = this.invoiceJSONArr?.map((invoice) => ((invoice.label === newInvoice.label) ? newInvoice : invoice));
  }

  loadInvoicesTable(invs: Invoice[]) {
    this.invoices = (invs) ? new MatTableDataSource<Invoice>([...invs]) : new MatTableDataSource([]);
    this.invoices.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.invoices.sort = this.sort;
    this.invoices.sort.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.invoices.filterPredicate = (rowData: Invoice, fltr: string) => {
      const newRowData = this.datePipe.transform(new Date((rowData.paid_at || 0) * 1000), 'dd/MMM/YYYY HH:mm')?.toLowerCase()! + (this.datePipe.transform(new Date((rowData.expires_at || 0) * 1000), 'dd/MMM/YYYY HH:mm')?.toLowerCase()) + ((rowData.bolt12) ? 'bolt12' : (rowData.bolt11) ? 'bolt11' : 'keysend') + JSON.stringify(rowData).toLowerCase();
      return newRowData.includes(fltr);
    };
    this.invoices.paginator = this.paginator;
    this.applyFilter();
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
