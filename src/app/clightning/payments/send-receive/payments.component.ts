import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatTableDataSource, MatSort } from '@angular/material';
import { GetInfoCL, PaymentCL, PayRequestCL } from '../../../shared/models/clModels';
import { LoggerService } from '../../../shared/services/logger.service';

import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { CLEffects } from '../../store/cl.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { AlertTypeEnum, DataTypeEnum } from '../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-cl-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
  animations: [newlyAddedRowAnimation]
})
export class CLPaymentsComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('sendPaymentForm', { static: true }) form;
  public newlyAddedPayment = '';
  public flgAnimate = true;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public information: GetInfoCL = {};
  public payments: any;
  public paymentJSONArr: PaymentCL[] = [];
  public displayedColumns = [];
  public paymentDecoded: PayRequestCL = {};
  public paymentRequest = '';
  public flgSticky = false;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private clEffects: CLEffects) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['created_at', 'status', 'msatoshi', 'msatoshi_sent'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['bolt11', 'created_at', 'status', 'msatoshi', 'msatoshi_sent', 'payment_hash'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['bolt11', 'created_at', 'destination', 'status', 'msatoshi', 'msatoshi_sent', 'payment_hash'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['id', 'bolt11', 'created_at', 'destination', 'status', 'msatoshi', 'msatoshi_sent', 'payment_hash', 'payment_preimage','amount_msat', 'amount_sent_msat'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['id', 'bolt11', 'created_at', 'destination', 'status', 'msatoshi', 'msatoshi_sent', 'payment_hash', 'payment_preimage','amount_msat', 'amount_sent_msat'];
        break;
    }
  }

  ngOnInit() {
    this.store.dispatch(new RTLActions.FetchPaymentsCL());
    this.store.select('cl')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPaymentsCL') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.paymentJSONArr = (null !== rtlStore.payments && rtlStore.payments.length > 0) ? rtlStore.payments : [];
      this.payments = (undefined === rtlStore.payments || null == rtlStore.payments) ?  new MatTableDataSource([]) : new MatTableDataSource<PaymentCL>([...this.paymentJSONArr]);
      this.payments.data = this.paymentJSONArr;
      this.payments.sort = this.sort;
      setTimeout(() => { this.flgAnimate = false; }, 3000);
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== this.paymentJSONArr) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onSendPayment() {
    if (undefined !== this.paymentDecoded.created_at_str) {
      this.sendPayment();
    } else {
      this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
      this.store.dispatch(new RTLActions.DecodePaymentCL(this.paymentRequest));
      this.clEffects.setDecodedPaymentCL
      .pipe(take(1))
      .subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if (undefined === this.paymentDecoded.msatoshi) {
          this.paymentDecoded.msatoshi = 0;
        }
        this.sendPayment();
      });
    }
  }

  sendPayment() {
    this.flgAnimate = true;
    this.newlyAddedPayment = this.paymentDecoded.payment_hash;
    const reorderedDecodedPayment = [
      [{key: 'amount_msat', value: this.paymentDecoded.amount_msat, title: 'Amount (mSat)', width: 100, type: DataTypeEnum.NUMBER}]
    ];
    if (undefined === this.paymentDecoded.msatoshi || this.paymentDecoded.msatoshi === 0) {
        const titleMsg = 'It is a zero amount invoice. Enter the amount (Sats) to pay.';
        this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Enter Amount and Confirm Send Payment',
          titleMessage: titleMsg,
          message: reorderedDecodedPayment,
          noBtnText: 'Cancel',
          yesBtnText: 'Send',
          flgShowInput: true, getInputs: [{placeholder: 'Amount (mSats)', inputType: 'number', inputValue: '', width: 30}]
        }}));
        this.rtlEffects.closeConfirm
        .pipe(take(1))
        .subscribe(confirmRes => {
          if (confirmRes) {
            this.paymentDecoded.msatoshi = confirmRes[0].inputValue;
            this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
            this.store.dispatch(new RTLActions.SendPaymentCL({invoice: this.paymentRequest, amount: confirmRes[0].inputValue}));
            this.resetData();
          }
        });
    } else {
      const reorderedDecodedPayment = [
        [{key: 'amount_msat', value: this.paymentDecoded.amount_msat, title: 'Amount (mSat)', width: 100, type: DataTypeEnum.NUMBER}]
      ];
      this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
        type: AlertTypeEnum.CONFIRM,
        alertTitle: 'Confirm Send Payment',
        titleMessage: 'Send Payment',
        noBtnText: 'Cancel',
        yesBtnText: 'Send',
        message: reorderedDecodedPayment
      }}));
      this.rtlEffects.closeConfirm
      .pipe(take(1))
      .subscribe(confirmRes => {
        if (confirmRes) {
          this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
          this.store.dispatch(new RTLActions.SendPaymentCL({invoice: this.paymentRequest}));
          this.resetData();
        }
      });
    }
  }

  // onVerifyPayment() {
  //   this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
  //   this.store.dispatch(new RTLActions.DecodePayment(this.paymentRequest));
  //   this.clEffects.setDecodedPayment.subscribe(decodedPayment => {
  //     this.paymentDecoded = decodedPayment;
  //     if (undefined !== this.paymentDecoded.timestamp_str) {
  //       this.paymentDecoded.timestamp_str = (this.paymentDecoded.timestamp_str === '') ? '' :
  //       formatDate(this.paymentDecoded.timestamp_str, 'dd/MMM/yyyy HH:mm', 'en-US');
  //     } else {
  //       this.resetData();
  //     }
  //   });
  // }

  resetData() {
    this.form.reset();
    this.paymentDecoded = {};
  }

  onPaymentClick(selRow: PaymentCL, event: any) {
    const selPayment = this.payments.data.filter(payment => {
      return payment.payment_hash === selRow.payment_hash;
    })[0];
    const reorderedPayment = [
      [{key: 'id', value: selPayment.id, title: 'Status', width: 100, type: DataTypeEnum.NUMBER}]
      // 'id', 'bolt11', 'created_at_str', 'created_at', 'destination', 'status', 'msatoshi', 'msatoshi_sent', 'payment_hash', 'payment_preimage','amount_msat', 'amount_sent_msat'
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

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
