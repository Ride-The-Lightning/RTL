import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { GetInfo, Payment, PayRequest } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { LNDEffects } from '../../store/lnd.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { SelNodeChild } from '../../../shared/models/RTLconfig';

@Component({
  selector: 'rtl-lightning-payments',
  templateUrl: './lightning-payments.component.html',
  styleUrls: ['./lightning-payments.component.scss'],
  animations: [newlyAddedRowAnimation],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Payments') }
  ]  
})
export class LightningPaymentsComponent implements OnInit, OnDestroy {
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

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private lndEffects: LNDEffects, private decimalPipe: DecimalPipe) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'value', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'fee', 'value', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['creation_date', 'payment_hash', 'fee', 'value', 'path', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPayments') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.selNode = rtlStore.nodeSettings;
      this.paymentJSONArr = (null !== rtlStore.payments && rtlStore.payments.length > 0) ? rtlStore.payments : [];
      this.payments = (undefined === rtlStore.payments || null == rtlStore.payments) ?  new MatTableDataSource([]) : new MatTableDataSource<Payment>([...this.paymentJSONArr]);
      this.payments.data = this.paymentJSONArr;
      this.payments.sort = this.sort;
      this.payments.paginator = this.paginator;
      setTimeout(() => { this.flgAnimate = false; }, 3000);
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== this.paymentJSONArr) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onSendPayment() {
    console.warn('SEND PAYMENT');
    if(!this.paymentRequest) { return true; } 
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
        const reorderedPaymentDecoded = [
          [{key: 'payment_hash', value: this.paymentDecoded.payment_hash, title: 'Payment Hash', width: 100}],
          [{key: 'destination', value: this.paymentDecoded.destination, title: 'Destination', width: 100}],
          [{key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100}],
          [{key: 'timestamp_str', value: this.paymentDecoded.timestamp_str, title: 'Creation Date', width: 40},
            {key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 30, type: DataTypeEnum.NUMBER},
            {key: 'cltv_expiry', value: this.paymentDecoded.cltv_expiry, title: 'CLTV Expiry', width: 30}]
        ];
        const titleMsg = 'It is a zero amount invoice. Enter the amount (Sats) to pay.';
        this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Enter Amount and Confirm Send Payment',
          titleMessage: titleMsg,
          message: reorderedPaymentDecoded,
          noBtnText: 'Cancel',
          yesBtnText: 'Send Payment',
          flgShowInput: true,
          getInputs: [
            {placeholder: 'Amount (Sats)', inputType: DataTypeEnum.NUMBER.toLowerCase(), inputValue: '', width: 30}
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
      const reorderedPaymentDecoded = [
        [{key: 'payment_hash', value: this.paymentDecoded.payment_hash, title: 'Payment Hash', width: 100}],
        [{key: 'destination', value: this.paymentDecoded.destination, title: 'Destination', width: 100}],
        [{key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100}],
        [{key: 'timestamp_str', value: this.paymentDecoded.timestamp_str, title: 'Creation Date', width: 50},
          {key: 'num_satoshis', value: this.paymentDecoded.num_satoshis, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
        [{key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 50, type: DataTypeEnum.NUMBER},
          {key: 'cltv_expiry', value: this.paymentDecoded.cltv_expiry, title: 'CLTV Expiry', width: 50}]
      ];
      this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
        type: AlertTypeEnum.CONFIRM,
        alertTitle: 'Send Payment',
        noBtnText: 'Cancel',
        yesBtnText: 'Send',
        message: reorderedPaymentDecoded
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

  onPaymentRequestEntry() {
    this.paymentDecodedHint = '';
    if(this.paymentRequest.length > 100) {
      this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
      this.store.dispatch(new RTLActions.DecodePayment(this.paymentRequest));
      this.lndEffects.setDecodedPayment.subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if(this.paymentDecoded.num_satoshis) {
          this.commonService.convertCurrency(+this.paymentDecoded.num_satoshis, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2])
          .pipe(takeUntil(this.unSubs[1]))
          .subscribe(data => {
            this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis ? this.paymentDecoded.num_satoshis : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
          });
        } else {
          this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
        }
      });
    }
  }

  resetData() {
    this.paymentDecoded = {};
    this.paymentRequest = '';
    this.form.reset();
  }

  onPaymentClick(selRow: Payment, event: any) {
    const flgExpansionClicked = event.target.className.includes('mat-expansion-panel-header') || event.target.className.includes('mat-expansion-indicator');
    if (flgExpansionClicked) {
      return;
    }
    const selPayment = this.payments.data.filter(payment => {
      return payment.payment_hash === selRow.payment_hash;
    })[0];
    
    const reorderedPayment = [
      [{key: 'payment_hash', value: selPayment.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'payment_preimage', value: selPayment.payment_preimage, title: 'Payment Preimage', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'path', value: selPayment.path, title: 'Path', width: 100, type: DataTypeEnum.ARRAY}],
      [{key: 'creation_date_str', value: selPayment.creation_date_str, title: 'Creation Date', width: 50, type: DataTypeEnum.DATE_TIME},
        {key: 'fee', value: selPayment.fee, title: 'Fee', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'value_msat', value: selPayment.value_msat, title: 'Value (mSats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'value_sat', value: selPayment.value, title: 'Value (Sats)', width: 50, type: DataTypeEnum.NUMBER}]
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
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
