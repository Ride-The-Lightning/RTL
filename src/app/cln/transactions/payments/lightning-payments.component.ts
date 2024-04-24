import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DecimalPipe, TitleCasePipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { GetInfo, Payment, PayRequest } from '../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, APICallStatusEnum, UI_MESSAGES, PaymentTypes, CLN_DEFAULT_PAGE_SETTINGS, SortOrderEnum, CLN_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { DataService } from '../../../shared/services/data.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { CLNLightningSendPaymentsComponent } from '../send-payment-modal/send-payment.component';
import { Node } from '../../../shared/models/RTLconfig';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { sendPayment } from '../../store/cln.actions';
import { clnNodeInformation, clnNodeSettings, clnPageSettings, payments } from '../../store/cln.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

@Component({
  selector: 'rtl-cln-lightning-payments',
  templateUrl: './lightning-payments.component.html',
  styleUrls: ['./lightning-payments.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Payments') }
  ]
})
export class CLNLightningPaymentsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() calledFrom = 'transactions'; // transactions/home
  @ViewChild('sendPaymentForm', { static: false }) form;
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'transactions';
  public tableSetting: TableSetting = { tableId: 'payments', recordsPerPage: PAGE_SIZE, sortBy: 'created_at', sortOrder: SortOrderEnum.DESCENDING };
  public faHistory = faHistory;
  public newlyAddedPayment = '';
  public selNode: Node | null;
  public information: GetInfo = {};
  public payments: any = new MatTableDataSource([]);
  public paymentJSONArr: Payment[] = [];
  public displayedColumns: any[] = [];
  public mppColumns: string[] = [];
  public paymentDecoded: PayRequest = {};
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(
    private logger: LoggerService,
    private commonService: CommonService,
    private store: Store<RTLState>,
    private rtlEffects: RTLEffects,
    private decimalPipe: DecimalPipe,
    private titleCasePipe: TitleCasePipe,
    private datePipe: DatePipe,
    private dataService: DataService,
    private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(clnNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: Node | null) => {
      this.selNode = nodeSettings;
    });
    this.store.select(clnNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => {
      this.information = nodeInfo;
    });
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[2])).
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
        this.displayedColumns.unshift('status');
        this.displayedColumns.push('actions');
        this.mppColumns = [];
        this.displayedColumns.map((col) => this.mppColumns.push('group_' + col));
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
        this.logger.info(this.mppColumns);
      });
    this.store.select(payments).pipe(takeUntil(this.unSubs[3])).
      subscribe((paymentsSeletor: { payments: Payment[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = paymentsSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.paymentJSONArr = paymentsSeletor.payments || [];
        if (this.paymentJSONArr.length && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadPaymentsTable(this.paymentJSONArr);
        }
        this.logger.info(paymentsSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.paymentJSONArr.length && this.sort && this.paginator && this.displayedColumns.length > 0) {
      this.loadPaymentsTable(this.paymentJSONArr);
    }
  }

  is_group(index: number, payment: Payment): boolean {
    return payment.is_group || false;
  }

  onSendPayment(): boolean | void {
    if (!this.paymentRequest) {
      return true;
    }
    if (this.paymentDecoded.created_at) {
      this.sendPayment();
    } else {
      this.dataService.decodePayment(this.paymentRequest, false).
        pipe(takeUntil(this.unSubs[4])).subscribe((decodedPayment: PayRequest) => {
          this.paymentDecoded = decodedPayment;
          if (this.paymentDecoded.created_at) {
            if (!this.paymentDecoded.amount_msat) {
              this.paymentDecoded.amount_msat = 0;
            }
            this.sendPayment();
          } else {
            this.resetData();
          }
        });
    }
  }

  sendPayment() {
    this.newlyAddedPayment = this.paymentDecoded?.payment_hash || '';
    if (!this.paymentDecoded.amount_msat || this.paymentDecoded.amount_msat === 0) {
      const reorderedPaymentDecoded = [
        [{ key: 'payment_hash', value: this.paymentDecoded.payment_hash, title: 'Payment Hash', width: 100 }],
        [{ key: 'payee', value: this.paymentDecoded.payee, title: 'Payee', width: 100 }],
        [{ key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100 }],
        [{ key: 'created_at', value: this.paymentDecoded.created_at, title: 'Creation Date', width: 40, type: DataTypeEnum.DATE_TIME },
        { key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 30, type: DataTypeEnum.NUMBER },
        { key: 'min_finaltv_expiry', value: this.paymentDecoded.min_final_cltv_expiry, title: 'CLTV Expiry', width: 30 }]
      ];
      const titleMsg = 'It is a zero amount invoice. Enter the amount (Sats) to pay.';
      this.store.dispatch(openConfirmation({
        payload: {
          data: {
            type: AlertTypeEnum.CONFIRM,
            alertTitle: 'Enter Amount and Confirm Send Payment',
            message: reorderedPaymentDecoded,
            noBtnText: 'Cancel',
            yesBtnText: 'Send Payment',
            flgShowInput: true,
            titleMessage: titleMsg,
            getInputs: [
              { placeholder: 'Amount (Sats)', inputType: DataTypeEnum.NUMBER, inputValue: '', width: 30 }
            ]
          }
        }
      }));
      this.rtlEffects.closeConfirm.
        pipe(take(1)).
        subscribe((confirmRes) => {
          if (confirmRes) {
            this.paymentDecoded.amount_msat = confirmRes[0].inputValue;
            this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, paymentType: PaymentTypes.INVOICE, bolt11: this.paymentRequest, amount_msat: confirmRes[0].inputValue * 1000, fromDialog: false } }));
            this.resetData();
          }
        });
    } else {
      const reorderedPaymentDecoded = [
        [{ key: 'payment_hash', value: this.paymentDecoded.payment_hash, title: 'Payment Hash', width: 100 }],
        [{ key: 'payee', value: this.paymentDecoded.payee, title: 'Payee', width: 100 }],
        [{ key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100 }],
        [{ key: 'created_at', value: this.paymentDecoded.created_at, title: 'Creation Date', width: 50, type: DataTypeEnum.DATE_TIME },
        { key: 'num_satoshis', value: this.paymentDecoded.amount_msat / 1000, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
        [{ key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 50, type: DataTypeEnum.NUMBER },
        { key: 'min_finaltv_expiry', value: this.paymentDecoded.min_final_cltv_expiry, title: 'CLTV Expiry', width: 50 }]
      ];
      this.store.dispatch(openConfirmation({
        payload: {
          data: {
            type: AlertTypeEnum.CONFIRM,
            alertTitle: 'Confirm Send Payment',
            noBtnText: 'Cancel',
            yesBtnText: 'Send Payment',
            message: reorderedPaymentDecoded
          }
        }
      }));
      this.rtlEffects.closeConfirm.
        pipe(take(1)).
        subscribe((confirmRes) => {
          if (confirmRes) {
            this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, paymentType: PaymentTypes.INVOICE, bolt11: this.paymentRequest, fromDialog: false } }));
            this.resetData();
          }
        });
    }
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event;
    this.paymentDecodedHint = '';
    if (this.paymentRequest && this.paymentRequest.length > 100) {
      this.dataService.decodePayment(this.paymentRequest, false).
        pipe(takeUntil(this.unSubs[5])).subscribe((decodedPayment: PayRequest) => {
          this.paymentDecoded = decodedPayment;
          if (this.paymentDecoded.amount_msat) {
            if (this.selNode?.settings.fiatConversion) {
              this.commonService.convertCurrency(this.paymentDecoded.amount_msat / 1000 || 0, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, (this.selNode.settings.currencyUnits && this.selNode.settings.currencyUnits.length > 2 ? this.selNode.settings.currencyUnits[2] : ''), this.selNode.settings.fiatConversion).
                pipe(takeUntil(this.unSubs[6])).
                subscribe({
                  next: (data) => {
                    this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount_msat ?
                      (this.paymentDecoded.amount_msat / 1000) : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0),
                      CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit + ') | Memo: ' + this.paymentDecoded.description;
                  }, error: (error) => {
                    this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount_msat ? this.paymentDecoded.amount_msat / 1000 : 0) +
                    ' Sats | Memo: ' + this.paymentDecoded.description + '. Unable to convert currency.';
                  }
                });
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount_msat ? this.paymentDecoded.amount_msat / 1000 : 0) +
              ' Sats | Memo: ' + this.paymentDecoded.description;
            }
          } else {
            this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
          }
        });
    }
  }

  openSendPaymentModal() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          component: CLNLightningSendPaymentsComponent
        }
      }
    }));
  }

  resetData() {
    this.paymentDecoded = {};
    this.paymentRequest = '';
    this.form.resetForm();
  }

  onPaymentClick(selPayment: Payment) {
    const reorderedPayment = [
      [{ key: 'payment_preimage', value: selPayment.payment_preimage, title: 'Payment Preimage', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'id', value: selPayment.id, title: 'ID', width: 20, type: DataTypeEnum.STRING },
      { key: 'destination', value: selPayment.destination, title: 'Destination', width: 80, type: DataTypeEnum.STRING }],
      [{ key: 'created_at', value: selPayment.created_at, title: 'Creation Date', width: 50, type: DataTypeEnum.DATE_TIME },
      { key: 'status', value: this.titleCasePipe.transform(selPayment.status), title: 'Status', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'amount_msat', value: selPayment.amount_msat, title: 'Amount (mSats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'amount_sent_msat', value: selPayment.amount_sent_msat, title: 'Amount Sent (mSats)', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    if (selPayment.bolt11 && selPayment.bolt11 !== '') {
      reorderedPayment?.unshift([{ key: 'bolt11', value: selPayment.bolt11, title: 'Bolt 11', width: 100, type: DataTypeEnum.STRING }]);
    }
    if (selPayment.bolt12 && selPayment.bolt12 !== '') {
      reorderedPayment?.unshift([{ key: 'bolt12', value: selPayment.bolt12, title: 'Bolt 12', width: 100, type: DataTypeEnum.STRING }]);
    }
    if (selPayment.memo && selPayment.memo !== '') {
      reorderedPayment?.splice(2, 0, [{ key: 'memo', value: selPayment.memo, title: 'Memo', width: 100, type: DataTypeEnum.STRING }]);
    }
    if (selPayment.hasOwnProperty('partid')) {
      reorderedPayment?.unshift([{ key: 'payment_hash', value: selPayment.payment_hash, title: 'Payment Hash', width: 80, type: DataTypeEnum.STRING },
      { key: 'partid', value: selPayment.partid, title: 'Part ID', width: 20, type: DataTypeEnum.STRING }]);
    } else {
      reorderedPayment?.unshift([{ key: 'payment_hash', value: selPayment.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }]);
    }
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Payment Information',
          message: reorderedPayment
        }
      }
    }));
  }

  applyFilter() {
    this.payments.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.payments.filterPredicate = (rowData: Payment, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = ((rowData.created_at) ? this.datePipe.transform(new Date(rowData.created_at * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() : '') + ((rowData.bolt12) ? 'bolt12' : (rowData.bolt11) ? 'bolt11' : 'keysend') + JSON.stringify(rowData).toLowerCase();
          break;

        case 'status':
          rowToFilter = rowData?.status === 'complete' ? 'completed' : 'incomplete/failed';
          break;

        case 'created_at':
          rowToFilter = this.datePipe.transform(new Date((rowData[this.selFilterBy] || 0) * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() || '';
          break;

        case 'msatoshi_sent':
          rowToFilter = ((rowData['amount_sent_msat'] || 0) / 1000)?.toString() || '';
          break;

        case 'msatoshi':
          rowToFilter = ((rowData['amount_msat'] || 0) / 1000)?.toString() || '';
          break;

        case 'type':
          rowToFilter = rowData?.bolt12 ? 'bolt12' : rowData?.bolt11 ? 'bolt11' : 'keysend';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return (this.selFilterBy === 'status' || this.selFilterBy === 'type') ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadPaymentsTable(payments: Payment[]) {
    this.payments = (payments) ? new MatTableDataSource<Payment>([...payments]) : new MatTableDataSource([]);
    this.payments.sort = this.sort;
    this.payments.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'msatoshi_sent':
          return data['amount_sent_msat'];

        case 'msatoshi':
          return data['amount_msat'];

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.payments.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
  }

  onDownloadCSV() {
    if (this.payments.data && this.payments.data.length > 0) {
      const paymentsDataCopy = JSON.parse(JSON.stringify(this.payments.data));
      const flattenedPayments = paymentsDataCopy?.reduce((acc, curr) => {
        if (curr.mpps) {
          return acc.concat(curr.mpps);
        } else {
          delete curr.is_group;
          delete curr.is_expanded;
          delete curr.total_parts;
          return acc.concat(curr);
        }
      }, []);
      this.commonService.downloadFile(flattenedPayments, 'Payments');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
