import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { GetInfo, Payment, PayRequest } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';
import { getPaymentsPaginator } from '../../../shared/services/paginator.service';

import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { LNDEffects } from '../../store/lnd.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-lightning-payments',
  templateUrl: './lightning-payments.component.html',
  styleUrls: ['./lightning-payments.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaymentsPaginator() },
  ]  
})
export class LightningPaymentsComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('sendPaymentForm', { static: true }) form;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  faHistory = faHistory;
  public newlyAddedPayment = '';
  public flgAnimate = true;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public information: GetInfo = {};
  public payments: any;
  public paymentJSONArr: Payment[] = [];
  public displayedColumns = [];
  public paymentDecoded: PayRequest = {};
  public paymentRequest = '';
  public flgSticky = false;
  public pageSizeOptions = [5, 10, 25, 100];

  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private lndEffects: LNDEffects) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['creation_date', 'fee', 'value', 'actions'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['creation_date', 'payment_hash', 'fee', 'value', 'path', 'actions'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['creation_date', 'payment_hash', 'fee', 'value', 'path', 'actions'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['creation_date', 'payment_hash', 'fee', 'value', 'path', 'actions'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['creation_date', 'payment_hash', 'fee', 'value', 'path', 'actions'];
        break;
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPayments') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.paymentJSONArr = (null !== rtlStore.payments && rtlStore.payments.length > 0) ? rtlStore.payments : [];
      this.payments = (undefined === rtlStore.payments || null == rtlStore.payments) ?  new MatTableDataSource([]) : new MatTableDataSource<Payment>([...this.paymentJSONArr]);
      this.payments.data = this.paymentJSONArr;
      this.payments.sort = this.sort;
      this.payments.data.forEach(payment => {
        payment.creation_date_str = (payment.creation_date_str === '') ? '' : formatDate(payment.creation_date_str, 'dd/MMM/yyyy HH:mm', 'en-US');
      });
      this.payments.paginator = this.paginator;
      setTimeout(() => { this.flgAnimate = false; }, 3000);
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== this.paymentJSONArr) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onSendPayment() {
    if (undefined !== this.paymentDecoded.timestamp_str) {
      this.sendPayment();
    } else {
      this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
      this.store.dispatch(new RTLActions.DecodePayment(this.paymentRequest));
      this.lndEffects.setDecodedPayment
      .pipe(take(1))
      .subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if (undefined !== this.paymentDecoded.timestamp_str) {
          this.paymentDecoded.timestamp_str = (this.paymentDecoded.timestamp_str === '') ? '' :
          formatDate(this.paymentDecoded.timestamp_str, 'dd/MMM/yyyy HH:mm', 'en-US');
          if (undefined === this.paymentDecoded.num_satoshis) {
            this.paymentDecoded.num_satoshis = '0';
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
    if (undefined === this.paymentDecoded.num_satoshis || this.paymentDecoded.num_satoshis === '' ||  this.paymentDecoded.num_satoshis === '0') {
        const titleMsg = 'This is an empty invoice. Enter the amount (Sats) to pay.';
        this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data: {
          type: 'CONFIRM', titleMessage: titleMsg, message: JSON.stringify(this.paymentDecoded), noBtnText: 'Cancel', yesBtnText: 'Send', flgShowInput: true, getInputs: [
            {placeholder: 'Amount (Sats)', inputType: 'number', inputValue: ''}
          ]
        }}));
        this.rtlEffects.closeConfirm
        .pipe(take(1))
        .subscribe(confirmRes => {
          if (confirmRes) {
            this.paymentDecoded.num_satoshis = confirmRes[0].inputValue;
            this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
            this.store.dispatch(new RTLActions.SendPayment([this.paymentRequest, this.paymentDecoded, true]));
            this.resetData();
          }
        });
    } else {
      this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data: {
        type: 'CONFIRM', titleMessage: 'Send Payment', noBtnText: 'Cancel', yesBtnText: 'Send', message: JSON.stringify(this.paymentDecoded)
      }}));
      this.rtlEffects.closeConfirm
      .pipe(take(1))
      .subscribe(confirmRes => {
        if (confirmRes) {
          this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
          this.store.dispatch(new RTLActions.SendPayment([this.paymentRequest, this.paymentDecoded, false]));
          this.resetData();
        }
      });
    }
  }

  onVerifyPayment() {
    this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
    this.store.dispatch(new RTLActions.DecodePayment(this.paymentRequest));
    this.lndEffects.setDecodedPayment.subscribe(decodedPayment => {
      this.paymentDecoded = decodedPayment;
      if (undefined !== this.paymentDecoded.timestamp_str) {
        this.paymentDecoded.timestamp_str = (this.paymentDecoded.timestamp_str === '') ? '' :
        formatDate(this.paymentDecoded.timestamp_str, 'dd/MMM/yyyy HH:mm', 'en-US');
      } else {
        this.resetData();
      }
    });
  }

  resetData() {
    this.form.reset();
    this.paymentDecoded = {};
  }

  onPaymentClick(selRow: Payment, event: any) {
    const flgExpansionClicked = event.target.className.includes('mat-expansion-panel-header') || event.target.className.includes('mat-expansion-indicator');
    if (flgExpansionClicked) {
      return;
    }
    const selPayment = this.payments.data.filter(payment => {
      return payment.payment_hash === selRow.payment_hash;
    })[0];
    const reorderedPayment = JSON.parse(JSON.stringify(selPayment, [
      'creation_date_str', 'payment_hash', 'fee', 'value_msat', 'value_sat', 'value', 'payment_preimage', 'path'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedPayment)
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
