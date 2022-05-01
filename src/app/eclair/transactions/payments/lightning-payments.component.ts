import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { GetInfo, PayRequest, PaymentSent, PaymentSentPart, Payments } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, APICallStatusEnum } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';

import { ECLLightningSendPaymentsComponent } from '../send-payment-modal/send-payment.component';
import { ECLPaymentInformationComponent } from '../payment-information-modal/payment-information.component';
import { SelNodeChild } from '../../../shared/models/RTLconfig';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { sendPayment } from '../../store/ecl.actions';
import { eclNodeInformation, eclnNodeSettings, payments } from '../../store/ecl.selector';

@Component({
  selector: 'rtl-ecl-lightning-payments',
  templateUrl: './lightning-payments.component.html',
  styleUrls: ['./lightning-payments.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Payments') }
  ]
})
export class ECLLightningPaymentsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() calledFrom = 'transactions'; // Transactions/home
  @ViewChild('sendPaymentForm', { static: false }) form;
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faHistory = faHistory;
  public newlyAddedPayment = '';
  public selNode: SelNodeChild = {};
  public information: GetInfo = {};
  public payments: any;
  public paymentJSONArr: PaymentSent[] = [];
  public paymentDecoded: PayRequest = {};
  public displayedColumns: any[] = [];
  public partColumns = [];
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private decimalPipe: DecimalPipe, private dataService: DataService, private datePipe: DatePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['firstPartTimestamp', 'actions'];
      this.partColumns = ['groupTotal', 'groupAction'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['firstPartTimestamp', 'recipientAmount', 'actions'];
      this.partColumns = ['groupTotal', 'groupAmount', 'groupAction'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['firstPartTimestamp', 'id', 'recipientAmount', 'actions'];
      this.partColumns = ['groupTotal', 'groupId', 'groupAmount', 'groupAction'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['firstPartTimestamp', 'id', 'recipientNodeAlias', 'recipientAmount', 'actions'];
      this.partColumns = ['groupTotal', 'groupId', 'groupChannelAlias', 'groupAmount', 'groupAction'];
    }
  }

  ngOnInit() {
    this.store.select(eclnNodeSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeSettings: SelNodeChild) => {
        this.selNode = nodeSettings;
      });
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[1])).
      subscribe((nodeInfo: GetInfo) => {
        this.information = nodeInfo;
      });
    this.store.select(payments).pipe(takeUntil(this.unSubs[2])).
      subscribe((paymentsSeletor: { payments: Payments, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = paymentsSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.paymentJSONArr = (paymentsSeletor.payments && paymentsSeletor.payments.sent && paymentsSeletor.payments.sent.length > 0) ? paymentsSeletor.payments.sent : [];
        // FOR MPP TESTING START
        // If (this.paymentJSONArr.length > 0) {
        //   This.paymentJSONArr[3].parts.push({
        //     Id: '34b609a5-f0f1-474e-9e5d-d7783b48702d', amount: 26000, feesPaid: 22, toChannelId: '7e78fa4a27db55df2955fb2be54162d01168744ad45a6539172a6dd6e6139c87', toChannelAlias: 'ion.radar.tech1', timestamp: 1596389827075
        //   });
        //   This.paymentJSONArr[3].parts.push({
        //     Id: '35b609a5-f0f1-474e-9e5d-d7783b48702e', amount: 27000, feesPaid: 20, toChannelId: '7e78fa4a27db55df2955fb2be54162d01168744ad45a6539172a6dd6e6139c86', toChannelAlias: 'ion.radar.tech2', timestamp: 1596389817075
        //   });
        //   This.paymentJSONArr[5].parts.push({
        //     Id: '38b609a5-f0f1-474e-9e5d-d7783b48702h', amount: 31000, feesPaid: 18, toChannelId: '7e78fa4a27db55df2955fb2be54162d01168744ad45a6539172a6dd6e6139c85', toChannelAlias: 'ion.radar.tech3', timestamp: 1596389887075
        //   });
        //   This.paymentJSONArr[5].parts.push({
        //     Id: '36b609a5-f0f1-474e-9e5d-d7783b48702f', amount: 28000, feesPaid: 13, toChannelId: '7e78fa4a27db55df2955fb2be54162d01168744ad45a6539172a6dd6e6139c84', toChannelAlias: 'ion.radar.tech4', timestamp: 1596389687075
        //   });
        //   This.paymentJSONArr[5].parts.push({
        //     Id: '37b609a5-f0f1-474e-9e5d-d7783b48702g', amount: 25000, feesPaid: 19, toChannelId: '7e78fa4a27db55df2955fb2be54162d01168744ad45a6539172a6dd6e6139c83', toChannelAlias: 'ion.radar.tech5', timestamp: 1596389707075
        //   });
        // }
        // This.paymentJSONArr = this.paymentJSONArr.splice(2, 5);
        // FOR MPP TESTING END
        this.loadPaymentsTable(this.paymentJSONArr);
        this.logger.info(paymentsSeletor);
      });
  }

  ngAfterViewInit() {
    this.loadPaymentsTable(this.paymentJSONArr);
  }

  loadPaymentsTable(payms: PaymentSent[]) {
    this.payments = payms ? new MatTableDataSource<PaymentSent>([...payms]) : new MatTableDataSource<PaymentSent>([]);
    this.payments.sort = this.sort;
    this.payments.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'firstPartTimestamp':
          this.commonService.sortByKey(data.parts, 'timestamp', 'number', this.sort.direction);
          return data.firstPartTimestamp;

        case 'id':
          this.commonService.sortByKey(data.parts, 'id', 'string', this.sort.direction);
          return data.id;

        case 'recipientNodeAlias':
          this.commonService.sortByKey(data.parts, 'toChannelAlias', 'string', this.sort.direction);
          return data.recipientNodeAlias;

        case 'recipientAmount':
          this.commonService.sortByKey(data.parts, 'amount', 'number', this.sort.direction);
          return data.recipientAmount;

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.payments.filterPredicate = (rowData: PaymentSent, fltr: string) => {
      const newRowData = ((rowData.firstPartTimestamp) ? this.datePipe.transform(new Date(rowData.firstPartTimestamp), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
      return newRowData.includes(fltr);
    };
    this.payments.paginator = this.paginator;
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
    this.newlyAddedPayment = this.paymentDecoded.paymentHash;
    if (!this.paymentDecoded.amount || this.paymentDecoded.amount === 0) {
      const reorderedPaymentDecoded = [
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
              { placeholder: 'Amount (Sats)', inputType: DataTypeEnum.NUMBER.toLowerCase(), inputValue: '', width: 30 }
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
      const reorderedPaymentDecoded = [
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
    this.paymentDecodedHint = '';
    if (this.paymentRequest && this.paymentRequest.length > 100) {
      this.dataService.decodePayment(this.paymentRequest, false).
        pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
          this.paymentDecoded = decodedPayment;
          if (this.paymentDecoded.amount) {
            if (this.selNode.fiatConversion) {
              this.commonService.convertCurrency(+this.paymentDecoded.amount, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
                pipe(takeUntil(this.unSubs[3])).
                subscribe({
                  next: (data) => {
                    this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
                  }, error: (error) => {
                    this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description + '. Unable to convert currency.';
                  }
                });
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
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
    const reorderedPart = [
      [{ key: 'paymentHash', value: selPayment.paymentHash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'paymentPreimage', value: selPayment.paymentPreimage, title: 'Payment Preimage', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'toChannelId', value: selPart.toChannelId, title: 'Channel', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'id', value: selPart.id, title: 'Part ID', width: 50, type: DataTypeEnum.STRING },
      { key: 'timestamp', value: selPart.timestamp, title: 'Time', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'amount', value: selPart.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'feesPaid', value: selPart.feesPaid, title: 'Fee (Sats)', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    if (sentPaymentInfo.length > 0 && sentPaymentInfo[0].paymentRequest && sentPaymentInfo[0].paymentRequest.description && sentPaymentInfo[0].paymentRequest.description !== '') {
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

  applyFilter() {
    this.payments.filter = this.selFilter.trim().toLowerCase();
  }

  onDownloadCSV() {
    if (this.payments.data && this.payments.data.length > 0) {
      const paymentsDataCopy: PaymentSent[] = JSON.parse(JSON.stringify(this.payments.data));
      const paymentRequests = paymentsDataCopy.reduce((paymentReqs, payment) => {
        if (payment.paymentHash && payment.paymentHash.trim() !== '') {
          paymentReqs = (paymentReqs === '') ? payment.paymentHash : paymentReqs + ',' + payment.paymentHash;
        }
        return paymentReqs;
      }, '');
      this.dataService.decodePayments(paymentRequests).
        pipe(takeUntil(this.unSubs[4])).
        subscribe((decodedPayments: any[][]) => {
          decodedPayments.forEach((decodedPayment, idx) => {
            if (decodedPayment.length > 0 && decodedPayment[0].paymentRequest && decodedPayment[0].paymentRequest.description && decodedPayment[0].paymentRequest.description !== '') {
              paymentsDataCopy[idx].description = decodedPayment[0].paymentRequest.description;
            }
          });
          const flattenedPayments = paymentsDataCopy.reduce((acc, curr) => acc.concat(curr), []);
          this.commonService.downloadFile(flattenedPayments, 'Payments');
        });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
