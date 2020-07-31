import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { GetInfo, Payment, PayRequest } from '../../../shared/models/clModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { CLLightningSendPaymentsComponent } from '../send-payment-modal/send-payment.component';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { CLEffects } from '../../store/cl.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as CLActions from '../../store/cl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-lightning-payments',
  templateUrl: './lightning-payments.component.html',
  styleUrls: ['./lightning-payments.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Payments') }
  ]  
})
export class CLLightningPaymentsComponent implements OnInit, OnDestroy {
  @Input() showDetails = true;
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
  public paymentJSONArr: Payment[] = [];
  public displayedColumns = [];
  public paymentDecoded: PayRequest = {};
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private clEffects: CLEffects, private decimalPipe: DecimalPipe, private titleCasePipe: TitleCasePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['created_at_str', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['created_at_str', 'msatoshi', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['created_at_str', 'msatoshi_sent', 'msatoshi', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['created_at_str', 'payment_hash', 'msatoshi_sent', 'msatoshi', 'actions'];
    }
  }

  ngOnInit() {
    this.store.dispatch(new CLActions.FetchPayments());    
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPayments') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.selNode = rtlStore.nodeSettings;
      this.paymentJSONArr = (rtlStore.payments && rtlStore.payments.length > 0) ? rtlStore.payments : [];
      this.payments = (!rtlStore.payments) ?  new MatTableDataSource([]) : new MatTableDataSource<Payment>([...this.paymentJSONArr]);
      this.payments.data = this.paymentJSONArr;
      this.payments.sort = this.sort;
      this.payments.paginator = this.paginator;
      setTimeout(() => { this.flgAnimate = false; }, 3000);
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( this.paymentJSONArr) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onSendPayment() {
    if(!this.paymentRequest) { return true; } 
    if (this.paymentDecoded.created_at_str) {
      this.sendPayment();
    } else {
      this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
      this.store.dispatch(new CLActions.DecodePayment({routeParam: this.paymentRequest, fromDialog: false}));
      this.clEffects.setDecodedPaymentCL
      .pipe(take(1))
      .subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if (this.paymentDecoded.created_at_str) {
          if (!this.paymentDecoded.msatoshi) {
            this.paymentDecoded.msatoshi = 0;
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
    this.newlyAddedPayment = this.paymentDecoded.payment_hash;
    if (!this.paymentDecoded.msatoshi ||  this.paymentDecoded.msatoshi === 0) {
        const reorderedPaymentDecoded = [
          [{key: 'payment_hash', value: this.paymentDecoded.payment_hash, title: 'Payment Hash', width: 100}],
          [{key: 'payee', value: this.paymentDecoded.payee, title: 'Payee', width: 100}],
          [{key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100}],
          [{key: 'created_at_str', value: this.paymentDecoded.created_at_str, title: 'Creation Date', width: 40},
            {key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 30, type: DataTypeEnum.NUMBER},
            {key: 'min_finaltv_expiry', value: this.paymentDecoded.min_final_cltv_expiry, title: 'CLTV Expiry', width: 30}]
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
            this.paymentDecoded.msatoshi = confirmRes[0].inputValue;
            this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
            this.store.dispatch(new CLActions.SendPayment({invoice: this.paymentRequest, amount: confirmRes[0].inputValue*1000, fromDialog: false}));
            this.resetData();
          }
        });
    } else {
      const reorderedPaymentDecoded = [
        [{key: 'payment_hash', value: this.paymentDecoded.payment_hash, title: 'Payment Hash', width: 100}],
        [{key: 'payee', value: this.paymentDecoded.payee, title: 'Payee', width: 100}],
        [{key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100}],
        [{key: 'created_at_str', value: this.paymentDecoded.created_at_str, title: 'Creation Date', width: 50},
          {key: 'num_satoshis', value: this.paymentDecoded.msatoshi/1000, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
        [{key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 50, type: DataTypeEnum.NUMBER},
          {key: 'min_finaltv_expiry', value: this.paymentDecoded.min_final_cltv_expiry, title: 'CLTV Expiry', width: 50}]
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
          this.store.dispatch(new CLActions.SendPayment({invoice: this.paymentRequest, fromDialog: false}));
          this.resetData();
        }
      });
    }
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event;
    this.paymentDecodedHint = '';
    if(this.paymentRequest && this.paymentRequest.length > 100) {
      this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
      this.store.dispatch(new CLActions.DecodePayment({routeParam: this.paymentRequest, fromDialog: false}));
      this.clEffects.setDecodedPaymentCL.subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if(this.paymentDecoded.msatoshi) {
          this.commonService.convertCurrency(+this.paymentDecoded.msatoshi, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
          .pipe(takeUntil(this.unSubs[1]))
          .subscribe(data => {
            if(this.selNode.fiatConversion) {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi/1000 : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi/1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
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
      component: CLLightningSendPaymentsComponent
    }}));
  }

  resetData() {
    this.paymentDecoded = {};
    this.paymentRequest = '';
    this.form.resetForm();
  }

  onPaymentClick(selPayment: Payment, event: any) {
    const reorderedPayment = [
      [{key: 'bolt11', value: selPayment.bolt11, title: 'Bolt 11', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'payment_hash', value: selPayment.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'payment_preimage', value: selPayment.payment_preimage, title: 'Payment Preimage', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'id', value: selPayment.id, title: 'ID', width: 20, type: DataTypeEnum.STRING},
      {key: 'destination', value: selPayment.destination, title: 'Destination', width: 80, type: DataTypeEnum.STRING}],
      [{key: 'created_at_str', value: selPayment.created_at_str, title: 'Creation Date', width: 50, type: DataTypeEnum.DATE_TIME},
        {key: 'status', value: this.titleCasePipe.transform(selPayment.status), title: 'Status', width: 50, type: DataTypeEnum.STRING}],
      [{key: 'msatoshi', value: selPayment.msatoshi, title: 'Amount (mSats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'msatoshi_sent', value: selPayment.msatoshi_sent, title: 'Amount Sent (mSats)', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Payment Information',
      message: reorderedPayment
    }}));
  }

  applyFilter(selFilter: string) {
    this.payments.filter = selFilter;
  }

  onDownloadCSV() {
    if(this.payments.data && this.payments.data.length > 0) {
      this.commonService.downloadFile(this.payments.data, 'Payments');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
