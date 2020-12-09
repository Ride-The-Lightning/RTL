import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { GetInfo, PayRequest, PaymentSent, PaymentSentPart } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';

import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { ECLLightningSendPaymentsComponent } from '../send-payment-modal/send-payment.component';
import { ECLPaymentInformationComponent } from '../payment-information-modal/payment-information.component';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { ECLEffects } from '../../store/ecl.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as ECLActions from '../../store/ecl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-lightning-payments',
  templateUrl: './lightning-payments.component.html',
  styleUrls: ['./lightning-payments.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Payments') }
  ]  
})
export class ECLLightningPaymentsComponent implements OnInit, OnDestroy {
  @Input() calledFrom = 'transactions'; // transactions/home
  @ViewChild('sendPaymentForm', { static: true }) form;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public faHistory = faHistory;
  public newlyAddedPayment = '';
  public flgAnimate = true;
  public selNode: SelNodeChild = {};
  public flgLoading: Array<Boolean | 'error'> = [true];
  public information: GetInfo = {};
  public payments: any;
  public paymentJSONArr: PaymentSent[] = [];
  public paymentDecoded: PayRequest = {};
  public displayedColumns = [];
  public partColumns = [];
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private eclEffects: ECLEffects, private decimalPipe: DecimalPipe, private dataService: DataService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['firstPartTimestamp', 'actions'];
      this.partColumns = ['groupTotal', 'groupAction'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['firstPartTimestamp', 'recipientAmount', 'actions'];
      this.partColumns = ['groupTotal', 'groupAmount', 'groupAction'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
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
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPayments') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.selNode = rtlStore.nodeSettings;
      if (rtlStore.payments.sent) {
        rtlStore.payments.sent.map(sentPayment => {
          let peerFound = rtlStore.peers.find(peer => peer.nodeId === sentPayment.recipientNodeId);
          sentPayment.recipientNodeAlias = peerFound ? peerFound.alias : sentPayment.recipientNodeId;
          if (sentPayment.parts) {
            sentPayment.parts.map(part => {
              let channelFound = rtlStore.activeChannels.find(channel => channel.channelId === part.toChannelId);
              part.toChannelAlias = channelFound ? channelFound.alias : part.toChannelId;
            });
          }
        });
      }
      this.paymentJSONArr = (rtlStore.payments && rtlStore.payments.sent && rtlStore.payments.sent.length > 0) ? rtlStore.payments.sent : [];
      this.payments = new MatTableDataSource<PaymentSent>([...this.paymentJSONArr]);
      // if(this.paymentJSONArr[0] && this.paymentJSONArr[0].parts) { // FOR MPP TESTING
      //   this.paymentJSONArr[0].parts.push({
      //     id: 'ID', amount: 100, feesPaid: 0, toChannelId: 'toChannel', toChannelAlias: 'Alias', timestampStr: 'str'
      //   });
      // }
      this.payments.data = this.paymentJSONArr;
      this.payments.sort = this.sort;
      this.payments.sortingDataAccessor = (data, sortHeaderId) => (data[sortHeaderId]  && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : +data[sortHeaderId];
      this.payments.paginator = this.paginator;
      setTimeout(() => { this.flgAnimate = false; }, 3000);
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (this.paymentJSONArr) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onSendPayment() {
    if(!this.paymentRequest) { return true; } 
    if (this.paymentDecoded.timestamp) {
      this.sendPayment();
    } else {
      this.dataService.decodePayment(this.paymentRequest, false)
      .pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
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
    this.flgAnimate = true;
    this.newlyAddedPayment = this.paymentDecoded.paymentHash;
    if (!this.paymentDecoded.amount || this.paymentDecoded.amount === 0) {
        const reorderedPaymentDecoded = [
          [{key: 'paymentHash', value: this.paymentDecoded.paymentHash, title: 'Payment Hash', width: 100}],
          [{key: 'nodeId', value: this.paymentDecoded.nodeId, title: 'Payee', width: 100}],
          [{key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100}],
          [{key: 'timestampStr', value: this.paymentDecoded.timestampStr, title: 'Creation Date', width: 40},
            {key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 30, type: DataTypeEnum.NUMBER},
            {key: 'minFinalCltvExpiry', value: this.paymentDecoded.minFinalCltvExpiry, title: 'CLTV Expiry', width: 30}]
        ];
        const titleMsg = 'It is a zero amount invoice. Enter the amount (Sats) to pay.';
        this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Enter Amount and Confirm Send Payment',
          message: reorderedPaymentDecoded,
          noBtnText: 'Cancel',
          yesBtnText: 'Send Payment',
          flgShowInput: true,
          titleMessage: titleMsg,
          getInputs: [
            {placeholder: 'Amount (Sats)', inputType: DataTypeEnum.NUMBER.toLowerCase(), inputValue: '', width: 30}
          ]
        }}));
        this.rtlEffects.closeConfirm
        .pipe(take(1))
        .subscribe(confirmRes => {
          if (confirmRes) {
            this.paymentDecoded.amount = confirmRes[0].inputValue;
            this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
            this.store.dispatch(new ECLActions.SendPayment({invoice: this.paymentRequest, amountMsat: confirmRes[0].inputValue*1000, fromDialog: false}));
            this.resetData();
          }
        });
    } else {
      const reorderedPaymentDecoded = [
        [{key: 'paymentHash', value: this.paymentDecoded.paymentHash, title: 'Payment Hash', width: 100}],
        [{key: 'nodeId', value: this.paymentDecoded.nodeId, title: 'Payee', width: 100}],
        [{key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100}],
        [{key: 'timestampStr', value: this.paymentDecoded.timestampStr, title: 'Creation Date', width: 50},
          {key: 'amount', value: this.paymentDecoded.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
        [{key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 50, type: DataTypeEnum.NUMBER},
          {key: 'minFinalCltvExpiry', value: this.paymentDecoded.minFinalCltvExpiry, title: 'CLTV Expiry', width: 50}]
      ];
      this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
        type: AlertTypeEnum.CONFIRM,
        alertTitle: 'Confirm Send Payment',
        noBtnText: 'Cancel',
        yesBtnText: 'Send Payment',
        message: reorderedPaymentDecoded
      }}));
      this.rtlEffects.closeConfirm
      .pipe(take(1))
      .subscribe(confirmRes => {
        if (confirmRes) {
          this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
          this.store.dispatch(new ECLActions.SendPayment({invoice: this.paymentRequest, fromDialog: false}));
          this.resetData();
        }
      });
    }
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event;
    this.paymentDecodedHint = '';
    if(this.paymentRequest && this.paymentRequest.length > 100) {
      this.dataService.decodePayment(this.paymentRequest, false)
      .pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
        this.paymentDecoded = decodedPayment;
        if(this.paymentDecoded.amount) {
          this.commonService.convertCurrency(+this.paymentDecoded.amount, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
          .pipe(takeUntil(this.unSubs[1]))
          .subscribe(data => {
            if(this.selNode.fiatConversion) {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
            }
          });
        } else {
          this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
        }
      });
    }
  }

  openSendPaymentModal() {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      component: ECLLightningSendPaymentsComponent
    }}));
  }

  resetData() {
    this.paymentDecoded = {};
    this.paymentRequest = '';
    this.form.resetForm();
  }

  is_group(index: number, payment: PaymentSent) {
    return payment.parts && payment.parts.length > 1;
  }  

  onPaymentClick(selPayment: PaymentSent) {
    if (selPayment.paymentHash && selPayment.paymentHash.trim() !== '') {
      this.dataService.decodePayment(selPayment.paymentHash, false)
      .pipe(take(1))
      .subscribe(sentPaymentInfo => {
        this.showPaymentView(selPayment, sentPaymentInfo);
      }, (error) => {
        this.showPaymentView(selPayment, []);
      });
    } else {
      this.showPaymentView(selPayment, []);
    }
  }

  showPaymentView(selPayment: PaymentSent, sentPaymentInfo?: any[]) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      sentPaymentInfo: sentPaymentInfo, 
      payment: selPayment,
      component: ECLPaymentInformationComponent
    }}));
  }

  onPartClick(selPart: PaymentSentPart, selPayment: PaymentSent) {
    if (selPayment.paymentHash && selPayment.paymentHash.trim() !== '') {
      this.dataService.decodePayment(selPayment.paymentHash, false)
      .pipe(take(1))
      .subscribe(sentPaymentInfo => {
        this.showPartView(selPart, selPayment, sentPaymentInfo);
      }, (error) => {
        this.showPartView(selPart, selPayment, []);
      });
    } else {
      this.showPartView(selPart, selPayment, []);
    }
  }
  
  showPartView(selPart: PaymentSentPart, selPayment: PaymentSent, sentPaymentInfo?: any[]) {
    const reorderedPart = [
      [{key: 'paymentHash', value: selPayment.paymentHash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'paymentPreimage', value: selPayment.paymentPreimage, title: 'Payment Preimage', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'toChannelId', value: selPart.toChannelId, title: 'Channel', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'id', value: selPart.id, title: 'Part ID', width: 50, type: DataTypeEnum.STRING},
        {key: 'timestampStr', value: selPart.timestampStr, title: 'Time', width: 50, type: DataTypeEnum.DATE_TIME}],
      [{key: 'amount', value: selPart.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'feesPaid', value: selPart.feesPaid, title: 'Fee (Sats)', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    if (sentPaymentInfo.length > 0 && sentPaymentInfo[0].paymentRequest && sentPaymentInfo[0].paymentRequest.description && sentPaymentInfo[0].paymentRequest.description !== '') {
      reorderedPart.splice(3, 0, [{key: 'description', value: sentPaymentInfo[0].paymentRequest.description, title: 'Description', width: 100, type: DataTypeEnum.STRING}]);
    }
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Payment Part Information',
      message: reorderedPart
    }}));
  }

  applyFilter(selFilter: string) {
    this.payments.filter = selFilter;
  }

  onDownloadCSV() {
    if(this.payments.data && this.payments.data.length > 0) {
      let paymentsDataCopy: PaymentSent[] = JSON.parse(JSON.stringify(this.payments.data));
      let paymentRequests = paymentsDataCopy.reduce((paymentReqs, payment) => { 
        if (payment.paymentHash && payment.paymentHash.trim() !== '') {
          paymentReqs = (paymentReqs === '') ? payment.paymentHash : paymentReqs + ',' + payment.paymentHash;
        }
        return paymentReqs;
      }, '');
      forkJoin(this.dataService.decodePayments(paymentRequests)
      .pipe(takeUntil(this.unSubs[2]))
      .subscribe((decodedPayments: any[][]) => {
        decodedPayments.forEach((decodedPayment, idx) => {
          if (decodedPayment.length > 0 && decodedPayment[0].paymentRequest && decodedPayment[0].paymentRequest.description && decodedPayment[0].paymentRequest.description !== '') {
            paymentsDataCopy[idx].description = decodedPayment[0].paymentRequest.description;
          }
        });
        let flattenedPayments = paymentsDataCopy.reduce((acc, curr) => acc.concat(curr), []);
        this.commonService.downloadFile(flattenedPayments, 'Payments');
      }));
    }

  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
