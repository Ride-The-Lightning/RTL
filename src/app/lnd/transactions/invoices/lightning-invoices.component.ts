import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory, faEye, faEyeSlash, faBurst, faMoneyBill1, faArrowsTurnToDots, faArrowsTurnRight } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, UI_MESSAGES, LNDActions, SortOrderEnum, LND_DEFAULT_PAGE_SETTINGS, LND_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo, Invoice, ListInvoices } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { CreateInvoiceComponent } from '../create-invoice-modal/create-invoice.component';
import { InvoiceInformationComponent } from '../invoice-information-modal/invoice-information.component';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { fetchInvoices, invoiceLookup, saveNewInvoice } from '../../store/lnd.actions';
import { invoices, lndNodeInformation, lndNodeSettings, lndPageSettings } from '../../store/lnd.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';

@Component({
  selector: 'rtl-lightning-invoices',
  templateUrl: './lightning-invoices.component.html',
  styleUrls: ['./lightning-invoices.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Invoices') }
  ]
})
export class LightningInvoicesComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() calledFrom = 'transactions'; // Transactions/home
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faEye = faEye;
  public faEyeSlash = faEyeSlash;
  public faHistory = faHistory;
  public faArrowsTurnToDots = faArrowsTurnToDots;
  public faArrowsTurnRight = faArrowsTurnRight;
  public faBurst = faBurst;
  public faMoneyBill1 = faMoneyBill1;
  public nodePageDefs = LND_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'transactions';
  public tableSetting: TableSetting = { tableId: 'invoices', recordsPerPage: PAGE_SIZE, sortBy: 'creation_date', sortOrder: SortOrderEnum.DESCENDING };
  public selNode: SelNodeChild | null = {};
  public newlyAddedInvoiceMemo: string | null = null;
  public newlyAddedInvoiceValue: number | null = null;
  public memo = '';
  public expiry: number | null;
  public invoiceValue: number | null;
  public invoiceValueHint = '';
  public displayedColumns: any[] = [];
  public invoicePaymentReq = '';
  public invoicesData: Invoice[] = [];
  public invoices: any = new MatTableDataSource<Invoice>([]);
  public information: GetInfo = {};
  public selFilter = '';
  public private = false;
  public expiryStep = 100;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  private firstOffset = -1;
  private lastOffset = -1;
  public totalInvoices = 0;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private datePipe: DatePipe, private actions: Actions, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild | null) => { this.selNode = nodeSettings; });
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => { this.information = nodeInfo; });
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[2])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.unshift('state');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(invoices).pipe(takeUntil(this.unSubs[3])).
      subscribe((invoicesSelector: { listInvoices: ListInvoices, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = invoicesSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.totalInvoices = (invoicesSelector.listInvoices.total_invoices || 0);
        this.firstOffset = +(invoicesSelector.listInvoices.first_index_offset || -1);
        this.lastOffset = +(invoicesSelector.listInvoices.last_index_offset || -1);
        this.invoicesData = invoicesSelector.listInvoices.invoices || [];
        if (this.invoicesData.length > 0 && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadInvoicesTable(this.invoicesData);
        }
        this.logger.info(invoicesSelector);
      });
    this.actions.pipe(takeUntil(this.unSubs[4]), filter((action) => (action.type === LNDActions.SET_LOOKUP_LND || action.type === LNDActions.UPDATE_API_CALL_STATUS_LND))).
      subscribe((resLookup: any) => {
        if (resLookup.type === LNDActions.SET_LOOKUP_LND) {
          if (this.invoicesData.length > 0 && this.sort && this.paginator && resLookup.payload) {
            this.updateInvoicesData(JSON.parse(JSON.stringify(resLookup.payload)));
            this.loadInvoicesTable(this.invoicesData);
          }
        }
      });
  }

  ngAfterViewInit() {
    if (this.invoicesData.length > 0) {
      this.loadInvoicesTable(this.invoicesData);
    }
  }


  onAddInvoice(form: any) {
    const expiryInSecs = (this.expiry ? this.expiry : 3600);
    this.newlyAddedInvoiceMemo = this.memo;
    this.newlyAddedInvoiceValue = this.invoiceValue;
    this.store.dispatch(saveNewInvoice({
      payload: {
        uiMessage: UI_MESSAGES.ADD_INVOICE, memo: this.memo, value: this.invoiceValue!, private: this.private, expiry: expiryInSecs, is_amp: false, pageSize: this.pageSize, openModal: true
      }
    }));
    this.resetData();
  }

  onInvoiceClick(selInvoice: Invoice) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          invoice: selInvoice,
          newlyAdded: false,
          component: InvoiceInformationComponent
        }
      }
    }));
  }

  onRefreshInvoice(selInvoice: Invoice) {
    if (selInvoice && selInvoice.r_hash) {
      this.store.dispatch(invoiceLookup({ payload: { openSnackBar: true, paymentHash: Buffer.from(selInvoice.r_hash.trim(), 'hex').toString('base64')?.replace(/\+/g, '-')?.replace(/[/]/g, '_') } }));
    }
  }

  updateInvoicesData(newInvoice: Invoice) {
    this.invoicesData = this.invoicesData?.map((invoice) => ((invoice.r_hash === newInvoice.r_hash) ? newInvoice : invoice));
  }


  applyFilter() {
    this.invoices.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.invoices.filterPredicate = (rowData: Invoice, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = (rowData.creation_date ? this.datePipe.transform(new Date(rowData.creation_date * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() : '')! +
          (rowData.settle_date ? this.datePipe.transform(new Date(rowData.settle_date * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
          break;

        case 'creation_date':
        case 'settle_date':
          rowToFilter = this.datePipe.transform(new Date((rowData[this.selFilterBy] || 0) * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() || '';
          break;

        case 'private':
          rowToFilter = rowData?.private ? 'private' : 'public';
          break;

        case 'is_keysend':
          rowToFilter = rowData?.is_keysend ? 'keysend invoices' : 'non keysend invoices';
          break;

        case 'is_amp':
          rowToFilter = rowData?.is_amp ? 'atomic multi path payment' : 'non atomic payment';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return (this.selFilterBy === 'is_keysend' || this.selFilterBy === 'is_amp') ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadInvoicesTable(invoices) {
    this.invoices = invoices ? new MatTableDataSource<Invoice>([...invoices]) : new MatTableDataSource<Invoice>([]);
    this.invoices.sort = this.sort;
    this.invoices.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.invoices.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.invoices);
  }

  resetData() {
    this.memo = '';
    this.invoiceValue = null;
    this.private = false;
    this.expiry = null;
    this.invoiceValueHint = '';
  }

  onPageChange(event: PageEvent) {
    let reverse = true;
    let index_offset = this.lastOffset;
    this.pageSize = event.pageSize;
    if (event.pageIndex === 0) {
      reverse = true;
      index_offset = 0;
    } else if (event.previousPageIndex && event.pageIndex < event.previousPageIndex) {
      reverse = false;
      index_offset = this.lastOffset;
    } else if (event.previousPageIndex && event.pageIndex > event.previousPageIndex && (event.length > ((event.pageIndex + 1) * event.pageSize))) {
      reverse = true;
      index_offset = this.firstOffset;
    } else if (event.length <= ((event.pageIndex + 1) * event.pageSize)) {
      reverse = false;
      index_offset = 0;
    }
    this.store.dispatch(fetchInvoices({ payload: { num_max_invoices: event.pageSize, index_offset: index_offset, reversed: reverse } }));
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

  openCreateInvoiceModal() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          pageSize: this.pageSize,
          component: CreateInvoiceComponent
        }
      }
    }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
