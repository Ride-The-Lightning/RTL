import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

import { GetInfo, PayRequest, PaymentSent, PaymentSentPart, Payments } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, APICallStatusEnum, SortOrderEnum, ECL_DEFAULT_PAGE_SETTINGS, ECL_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';

import { ECLLightningSendPaymentsComponent } from '../send-payment-modal/send-payment.component';
import { ECLPaymentInformationComponent } from '../payment-information-modal/payment-information.component';
import { Node } from '../../../shared/models/RTLconfig';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { rootSelectedNode } from '../../../store/rtl.selector';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { sendPayment } from '../../store/ecl.actions';
import { eclNodeInformation, eclPageSettings, payments } from '../../store/ecl.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithSpacesPipe } from '../../../shared/pipes/app.pipe';
import { ConvertedCurrency } from '../../../shared/models/rtlModels';
import { MessageDataField } from '../../../shared/models/alertData';

@Component({
  selector: 'rtl-ecl-lightning-payments',
  templateUrl: './lightning-payments.component.html',
  styleUrls: ['./lightning-payments.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Payments') }
  ]
})
export class ECLLightningPaymentsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() calledFrom = 'transactions'; // Transactions/home
  @ViewChild('sendPaymentForm', { static: false }) form;
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public convertedCurrency: ConvertedCurrency = null;
  public nodePageDefs = ECL_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'transactions';
  public tableSetting: TableSetting = { tableId: 'payments', recordsPerPage: PAGE_SIZE, sortBy: 'firstPartTimestamp', sortOrder: SortOrderEnum.DESCENDING };
  public faHistory = faHistory;
  public newlyAddedPayment = '';
  public selNode: Node | null;
  public information: GetInfo = {};
  public payments: any = new MatTableDataSource<PaymentSent>([]);
  public paymentJSONArr: PaymentSent[] = [];
  public paymentDecoded: PayRequest = {};
  public displayedColumns: any[] = [];
  public partColumns: string[] = [];
  public paymentRequest = '';
  public paymentDecodedHintPre = '';
  public paymentDecodedHintPost = '';
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private decimalPipe: DecimalPipe, private dataService: DataService, private datePipe: DatePipe, private camelCaseWithSpaces: CamelCaseWithSpacesPipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeSettings: Node | null) => {
        this.selNode = nodeSettings;
      });
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[1])).
      subscribe((nodeInfo: GetInfo) => {
        this.information = nodeInfo;
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
        this.displayedColumns.push('actions');
        this.partColumns = [];
        this.displayedColumns.map((col) => this.partColumns.push('group_' + col));
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(payments).pipe(takeUntil(this.unSubs[3])).
      subscribe((paymentsSeletor: { payments: Payments, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = paymentsSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.paymentJSONArr = (paymentsSeletor.payments && paymentsSeletor.payments.sent && paymentsSeletor.payments.sent.length > 0) ? paymentsSeletor.payments.sent : [];
        if (this.paymentJSONArr && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadPaymentsTable(this.paymentJSONArr);
        }
        this.logger.info(paymentsSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.paymentJSONArr.length > 0) {
      this.loadPaymentsTable(this.paymentJSONArr);
    }
  }

  applyFilter() {
    this.payments.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithSpaces.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.payments.filterPredicate = (rowData: PaymentSent, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = ((rowData.firstPartTimestamp) ? this.datePipe.transform(new Date(rowData.firstPartTimestamp), 'dd/MMM/y HH:mm')?.toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
          break;

        case 'firstPartTimestamp':
          rowToFilter = this.datePipe.transform(new Date(rowData.firstPartTimestamp || 0), 'dd/MMM/y HH:mm')?.toLowerCase() || '';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return rowToFilter.includes(fltr);
    };
  }

  loadPaymentsTable(payms: PaymentSent[]) {
    this.payments = payms ? new MatTableDataSource<PaymentSent>([...payms]) : new MatTableDataSource<PaymentSent>([]);
    this.payments.sort = this.sort;
    this.payments.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'firstPartTimestamp':
          this.commonService.sortByKey(data.parts, 'timestamp', 'number', this.sort?.direction);
          return data.firstPartTimestamp;

        case 'id':
          this.commonService.sortByKey(data.parts, 'id', 'string', this.sort?.direction);
          return data.id;

        case 'recipientNodeAlias':
          this.commonService.sortByKey(data.parts, 'toChannelAlias', 'string', this.sort?.direction);
          return data.recipientNodeAlias;

        case 'recipientAmount':
          this.commonService.sortByKey(data.parts, 'amount', 'number', this.sort?.direction);
          return data.recipientAmount;

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.payments.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
  }

  onSendPayment(): boolean | void {
    if (!this.paymentRequest) {
      return true;
    }
    if (this.paymentDecoded.timestamp) {
      this.sendPayment();
    } else {
      this.dataService.decodePayment(this.paymentRequest, false).
        pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
          this.paymentDecoded = decodedPayment;
          if (this.paymentDecoded.timestamp) {
            if (!this.paymentDecoded.amount) {
              this.paymentDecoded.amount = 0;
            }
            this.sendPayment();
          } else {
            this.resetData();
          }
        });
    }
  }

  sendPayment() {
    this.newlyAddedPayment = this.paymentDecoded.paymentHash || '';
    if (!this.paymentDecoded.amount || this.paymentDecoded.amount === 0) {
      const reorderedPaymentDecoded: MessageDataField[][] = [
        [{ key: 'paymentHash', value: this.paymentDecoded.paymentHash, title: 'Payment Hash', width: 100 }],
        [{ key: 'nodeId', value: this.paymentDecoded.nodeId, title: 'Payee', width: 100 }],
        [{ key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100 }],
        [{ key: 'timestamp', value: this.paymentDecoded.timestamp, title: 'Creation Date', width: 40, type: DataTypeEnum.DATE_TIME },
        { key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 30, type: DataTypeEnum.NUMBER },
        { key: 'minFinalCltvExpiry', value: this.paymentDecoded.minFinalCltvExpiry, title: 'CLTV Expiry', width: 30 }]
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
            this.paymentDecoded.amount = confirmRes[0].inputValue;
            this.store.dispatch(sendPayment({ payload: { invoice: this.paymentRequest, amountMsat: confirmRes[0].inputValue * 1000, fromDialog: false } }));
            this.resetData();
          }
        });
    } else {
      const reorderedPaymentDecoded: MessageDataField[][] = [
        [{ key: 'paymentHash', value: this.paymentDecoded.paymentHash, title: 'Payment Hash', width: 100 }],
        [{ key: 'nodeId', value: this.paymentDecoded.nodeId, title: 'Payee', width: 100 }],
        [{ key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100 }],
        [{ key: 'timestamp', value: this.paymentDecoded.timestamp, title: 'Creation Date', width: 50, type: DataTypeEnum.DATE_TIME },
        { key: 'amount', value: this.paymentDecoded.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
        [{ key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 50, type: DataTypeEnum.NUMBER },
        { key: 'minFinalCltvExpiry', value: this.paymentDecoded.minFinalCltvExpiry, title: 'CLTV Expiry', width: 50 }]
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
            this.store.dispatch(sendPayment({ payload: { invoice: this.paymentRequest, fromDialog: false } }));
            this.resetData();
          }
        });
    }
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event;
    this.paymentDecodedHintPre = '';
    this.paymentDecodedHintPost = '';
    if (this.paymentRequest && this.paymentRequest.length > 100) {
      this.dataService.decodePayment(this.paymentRequest, false).
        pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
          this.paymentDecoded = decodedPayment;
          if (this.paymentDecoded.amount) {
            if (this.selNode && this.selNode.settings.fiatConversion) {
              this.commonService.convertCurrency(+this.paymentDecoded.amount, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, (this.selNode.settings.currencyUnits && this.selNode.settings.currencyUnits.length > 2 ? this.selNode.settings.currencyUnits[2] : ''), this.selNode.settings.fiatConversion).
                pipe(takeUntil(this.unSubs[4])).
                subscribe({
                  next: (data) => {
                    this.convertedCurrency = data;
                    this.paymentDecodedHintPre = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats (';
                    this.paymentDecodedHintPost = this.decimalPipe.transform((this.convertedCurrency.OTHER ? this.convertedCurrency.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
                  }, error: (error) => {
                    this.paymentDecodedHintPre = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description + '. Unable to convert currency.';
                    this.paymentDecodedHintPost = '';
                  }
                });
            } else {
              this.paymentDecodedHintPre = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
              this.paymentDecodedHintPost = '';
            }
          } else {
            this.paymentDecodedHintPre = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
            this.paymentDecodedHintPost = '';
          }
        });
    }
  }

  openSendPaymentModal() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          component: ECLLightningSendPaymentsComponent
        }
      }
    }));
  }

  resetData() {
    this.paymentDecoded = {};
    this.paymentRequest = '';
    this.form.resetForm();
  }

  is_group(index: number, payment: PaymentSent): boolean {
    return payment.parts && payment.parts.length > 1;
  }

  onPaymentClick(selPayment: PaymentSent) {
    if (selPayment.paymentHash && selPayment.paymentHash.trim() !== '') {
      this.dataService.decodePayments(selPayment.paymentHash).
        pipe(take(1)).
        subscribe({
          next: (sentPaymentInfo) => {
            setTimeout(() => {
              this.showPaymentView(selPayment, (sentPaymentInfo.length && sentPaymentInfo.length > 0) ? sentPaymentInfo[0] : []);
            }, 0);
          }, error: (error) => {
            this.showPaymentView(selPayment, []);
          }
        });
    } else {
      this.showPaymentView(selPayment, []);
    }
  }

  showPaymentView(selPayment: PaymentSent, sentPaymentInfo?: any[]) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          sentPaymentInfo: sentPaymentInfo,
          payment: selPayment,
          component: ECLPaymentInformationComponent
        }
      }
    }));
  }

  onPartClick(selPart: PaymentSentPart, selPayment: PaymentSent) {
    if (selPayment.paymentHash && selPayment.paymentHash.trim() !== '') {
      this.dataService.decodePayments(selPayment.paymentHash).
        pipe(take(1)).
        subscribe({
          next: (sentPaymentInfo) => {
            setTimeout(() => {
              this.showPartView(selPart, selPayment, (sentPaymentInfo.length && sentPaymentInfo.length > 0) ? sentPaymentInfo[0] : []);
            }, 0);
          }, error: (error) => {
            this.showPartView(selPart, selPayment, []);
          }
        });
    } else {
      this.showPartView(selPart, selPayment, []);
    }
  }

  showPartView(selPart: PaymentSentPart, selPayment: PaymentSent, sentPaymentInfo?: any[]) {
    const reorderedPart: MessageDataField[][] = [
      [{ key: 'paymentHash', value: selPayment.paymentHash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'paymentPreimage', value: selPayment.paymentPreimage, title: 'Payment Preimage', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'toChannelId', value: selPart.toChannelId, title: 'Channel', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'id', value: selPart.id, title: 'Part ID', width: 50, type: DataTypeEnum.STRING },
      { key: 'timestamp', value: selPart.timestamp, title: 'Time', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'amount', value: selPart.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'feesPaid', value: selPart.feesPaid, title: 'Fee (Sats)', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    if (sentPaymentInfo && sentPaymentInfo.length > 0 && sentPaymentInfo[0].paymentRequest && sentPaymentInfo[0].paymentRequest.description && sentPaymentInfo[0].paymentRequest.description !== '') {
      reorderedPart.splice(3, 0, [{ key: 'description', value: sentPaymentInfo[0].paymentRequest.description, title: 'Description', width: 100, type: DataTypeEnum.STRING }]);
    }
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Payment Part Information',
          message: reorderedPart
        }
      }
    }));
  }

  onDownloadCSV() {
    if (this.payments.data && this.payments.data.length > 0) {
      const paymentsDataCopy: PaymentSent[] = JSON.parse(JSON.stringify(this.payments.data));
      const paymentRequests = paymentsDataCopy?.reduce((paymentReqs, payment) => {
        if (payment.paymentHash && payment.paymentHash.trim() !== '') {
          paymentReqs = (paymentReqs === '') ? payment.paymentHash : paymentReqs + ',' + payment.paymentHash;
        }
        return paymentReqs;
      }, '');
      this.dataService.decodePayments(paymentRequests).
        pipe(takeUntil(this.unSubs[5])).
        subscribe((decodedPayments: any[][]) => {
          decodedPayments.forEach((decodedPayment, idx) => {
            if (decodedPayment.length > 0 && decodedPayment[0].paymentRequest && decodedPayment[0].paymentRequest.description && decodedPayment[0].paymentRequest.description !== '') {
              paymentsDataCopy[idx].description = decodedPayment[0].paymentRequest.description;
            }
          });
          const flattenedPayments = paymentsDataCopy?.reduce((acc, curr: any) => acc.concat(curr), []);
          this.commonService.downloadFile(flattenedPayments, 'Payments');
        });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
