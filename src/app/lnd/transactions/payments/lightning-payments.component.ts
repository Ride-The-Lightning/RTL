import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { GetInfo, Payment, PayRequest, PaymentHTLC, Peer, Hop, ListPayments, ListInvoices } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, APICallStatusEnum, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';

import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { LightningSendPaymentsComponent } from '../send-payment-modal/send-payment.component';

import { LNDEffects } from '../../store/lnd.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert, openConfirmation } from '../../../store/rtl.actions';
import { fetchPayments, sendPayment } from '../../store/lnd.actions';
import { lndNodeInformation, lndNodeSettings, payments, peers } from '../../store/lnd.selector';

@Component({
  selector: 'rtl-lightning-payments',
  templateUrl: './lightning-payments.component.html',
  styleUrls: ['./lightning-payments.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Payments') }
  ]
})
export class LightningPaymentsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() calledFrom = 'transactions'; // Transactions/home
  @ViewChild('sendPaymentForm', { static: false }) form; // Static should be false due to ngIf on form element
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faHistory = faHistory;
  public newlyAddedPayment = '';
  public selNode: SelNodeChild = {};
  public information: GetInfo = {};
  public peers: Peer[] = [];
  public payments: any;
  public totalPayments = 100;
  public paymentJSONArr: Payment[] = [];
  public displayedColumns: any[] = [];
  public htlcColumns = [];
  public paymentDecoded: PayRequest = {};
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public flgSticky = false;
  private firstOffset = -1;
  private lastOffset = -1;
  public selFilter = '';
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private dataService: DataService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private lndEffects: LNDEffects, private decimalPipe: DecimalPipe, private datePipe: DatePipe) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'fee', 'actions'];
      this.htlcColumns = ['groupTotal', 'groupFee', 'groupAction'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'fee', 'value', 'hops', 'actions'];
      this.htlcColumns = ['groupTotal', 'groupFee', 'groupValue', 'groupHops', 'groupAction'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'fee', 'value', 'hops', 'actions'];
      this.htlcColumns = ['groupTotal', 'groupFee', 'groupValue', 'groupHops', 'groupAction'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['creation_date', 'payment_hash', 'fee', 'value', 'hops', 'actions'];
      this.htlcColumns = ['groupTotal', 'groupHash', 'groupFee', 'groupValue', 'groupHops', 'groupAction'];
    }
  }

  ngOnInit() {
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild) => { this.selNode = nodeSettings; });
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => { this.information = nodeInfo; });
    this.store.select(peers).pipe(takeUntil(this.unSubs[2])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.peers = peersSelector.peers;
      });
    this.store.select(payments).pipe(takeUntil(this.unSubs[3])).
      subscribe((paymentsSelector: { listPayments: ListPayments, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = paymentsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.paymentJSONArr = paymentsSelector.listPayments.payments || [];
        this.totalPayments = this.paymentJSONArr.length;
        this.firstOffset = +paymentsSelector.listPayments.first_index_offset;
        this.lastOffset = +paymentsSelector.listPayments.last_index_offset;
        if (this.paymentJSONArr && this.paymentJSONArr.length > 0 && this.sort && this.paginator) {
          // this.loadPaymentsTable(this.paymentJSONArr);
          this.loadPaymentsTable(this.paymentJSONArr.slice(0, this.pageSize));
        }
        this.logger.info(paymentsSelector);
      });
  }

  ngAfterViewInit() {
    if (this.paymentJSONArr && this.paymentJSONArr.length > 0) {
      // this.loadPaymentsTable(this.paymentJSONArr);
      this.loadPaymentsTable(this.paymentJSONArr.slice(0, this.pageSize));
    }
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
            if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
              this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
            } else {
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
    this.newlyAddedPayment = this.paymentDecoded.payment_hash;
    if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
      this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
    }
    if (!this.paymentDecoded.num_satoshis || this.paymentDecoded.num_satoshis === '' || this.paymentDecoded.num_satoshis === '0') {
      const reorderedPaymentDecoded = [
        [{ key: 'payment_hash', value: this.paymentDecoded.payment_hash, title: 'Payment Hash', width: 100 }],
        [{ key: 'destination', value: this.paymentDecoded.destination, title: 'Destination', width: 100 }],
        [{ key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100 }],
        [{ key: 'timestamp', value: this.paymentDecoded.timestamp, title: 'Creation Date', width: 40, type: DataTypeEnum.DATE_TIME },
        { key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 30, type: DataTypeEnum.NUMBER },
        { key: 'cltv_expiry', value: this.paymentDecoded.cltv_expiry, title: 'CLTV Expiry', width: 30 }]
      ];
      const titleMsg = 'It is a zero amount invoice. Enter the amount (Sats) to pay.';
      this.store.dispatch(openConfirmation({
        payload: {
          data: {
            type: AlertTypeEnum.CONFIRM,
            alertTitle: 'Enter Amount and Confirm Send Payment',
            titleMessage: titleMsg,
            message: reorderedPaymentDecoded,
            noBtnText: 'Cancel',
            yesBtnText: 'Send Payment',
            flgShowInput: true,
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
            this.paymentDecoded.num_satoshis = confirmRes[0].inputValue;
            this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, paymentReq: this.paymentRequest, paymentAmount: confirmRes[0].inputValue, fromDialog: false } }));
            this.resetData();
          }
        });
    } else {
      const reorderedPaymentDecoded = [
        [{ key: 'payment_hash', value: this.paymentDecoded.payment_hash, title: 'Payment Hash', width: 100 }],
        [{ key: 'destination', value: this.paymentDecoded.destination, title: 'Destination', width: 100 }],
        [{ key: 'description', value: this.paymentDecoded.description, title: 'Description', width: 100 }],
        [{ key: 'timestamp', value: this.paymentDecoded.timestamp, title: 'Creation Date', width: 50, type: DataTypeEnum.DATE_TIME },
        { key: 'num_satoshis', value: this.paymentDecoded.num_satoshis, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
        [{ key: 'expiry', value: this.paymentDecoded.expiry, title: 'Expiry', width: 50, type: DataTypeEnum.NUMBER },
        { key: 'cltv_expiry', value: this.paymentDecoded.cltv_expiry, title: 'CLTV Expiry', width: 50 }]
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
            this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, paymentReq: this.paymentRequest, fromDialog: false } }));
            this.resetData();
          }
        });
    }
  }

  openSendPaymentModal() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          component: LightningSendPaymentsComponent
        }
      }
    }));
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event;
    this.paymentDecodedHint = '';
    if (this.paymentRequest && this.paymentRequest.length > 100) {
      this.dataService.decodePayment(this.paymentRequest, false).
        pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
          this.paymentDecoded = decodedPayment;
          if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
            this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
          }
          if (this.paymentDecoded.num_satoshis) {
            if (this.selNode.fiatConversion) {
              this.commonService.convertCurrency(+this.paymentDecoded.num_satoshis, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
                pipe(takeUntil(this.unSubs[5])).
                subscribe({
                  next: (data) => {
                    this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis ? this.paymentDecoded.num_satoshis : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
                  }, error: (error) => {
                    this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis ? this.paymentDecoded.num_satoshis : 0) + ' Sats | Memo: ' + this.paymentDecoded.description + '. Unable to convert currency.';
                  }
                });
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis ? this.paymentDecoded.num_satoshis : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
            }
          } else {
            this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
          }
        });
    }
  }

  onPageChange(event: any) {
    let reverse = true;
    let index_offset = this.lastOffset;
    this.pageSize = event.pageSize;
    if (event.pageIndex === 0) {
      reverse = true;
      index_offset = 0;
    } else if (event.pageIndex < event.previousPageIndex) {
      reverse = false;
      index_offset = this.lastOffset;
    } else if (event.pageIndex > event.previousPageIndex && (event.length > ((event.pageIndex + 1) * event.pageSize))) {
      reverse = true;
      index_offset = this.firstOffset;
    } else if (event.length <= ((event.pageIndex + 1) * event.pageSize)) {
      reverse = false;
      index_offset = 0;
    }
    const starting_index = event.pageIndex * this.pageSize;
    this.loadPaymentsTable(this.paymentJSONArr.slice(starting_index, (starting_index + this.pageSize)));
    // this.store.dispatch(fetchPayments({ payload: { max_payments: page_size, index_offset: index_offset, reversed: reverse } }));
  }

  is_group(index: number, payment: Payment) {
    return payment.htlcs && payment.htlcs.length > 1;
  }

  resetData() {
    this.paymentDecoded = {};
    this.paymentRequest = '';
    this.form.resetForm();
  }

  getHopDetails(hops: Hop[]) {
    const self = this;
    return hops.reduce((accumulator, currentHop) => {
      const peerFound = self.peers.find((peer) => peer.pub_key === currentHop.pub_key);
      if (peerFound && peerFound.alias) {
        accumulator.push('<pre>Channel: ' + peerFound.alias.padEnd(20) + '&Tab;&Tab;&Tab;Amount (Sats): ' + self.decimalPipe.transform(currentHop.amt_to_forward) + '</pre>');
      } else {
        self.dataService.getAliasesFromPubkeys(currentHop.pub_key, false).
          pipe(takeUntil(self.unSubs[6])).
          subscribe((res: any) => {
            accumulator.push('<pre>Channel: ' + (res.node && res.node.alias ? res.node.alias.padEnd(20) : (currentHop.pub_key.substring(0, 17) + '...')) + '&Tab;&Tab;&Tab;Amount (Sats): ' + self.decimalPipe.transform(currentHop.amt_to_forward) + '</pre>');
          });
      }
      return accumulator;
    }, []);
  }

  onHTLCClick(selHtlc: PaymentHTLC, selPayment: Payment) {
    if (selPayment.payment_request && selPayment.payment_request.trim() !== '') {
      this.dataService.decodePayment(selPayment.payment_request, false).
        pipe(take(1)).subscribe({
          next: (decodedPayment: PayRequest) => {
            setTimeout(() => {
              this.showHTLCView(selHtlc, selPayment, decodedPayment);
            }, 0);
          }, error: (error) => {
            this.showHTLCView(selHtlc, selPayment, null);
          }
        });
    } else {
      this.showHTLCView(selHtlc, selPayment, null);
    }
  }

  showHTLCView(selHtlc: PaymentHTLC, selPayment: Payment, decodedPayment?: PayRequest) {
    const reorderedHTLC = [
      [{ key: 'payment_hash', value: selPayment.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'preimage', value: selHtlc.preimage, title: 'Preimage', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'payment_request', value: selPayment.payment_request, title: 'Payment Request', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'status', value: selHtlc.status, title: 'Status', width: 33, type: DataTypeEnum.STRING },
      { key: 'attempt_time_ns', value: +selHtlc.attempt_time_ns / 1000000000, title: 'Attempt Time', width: 33, type: DataTypeEnum.DATE_TIME },
      { key: 'resolve_time_ns', value: +selHtlc.resolve_time_ns / 1000000000, title: 'Resolve Time', width: 34, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'total_amt', value: selHtlc.route.total_amt, title: 'Amount (Sats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'total_fees', value: selHtlc.route.total_fees, title: 'Fee (Sats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'total_time_lock', value: selHtlc.route.total_time_lock, title: 'Total Time Lock', width: 34, type: DataTypeEnum.NUMBER }],
      [{ key: 'hops', value: this.getHopDetails(selHtlc.route.hops), title: 'Hops', width: 100, type: DataTypeEnum.ARRAY }]
    ];
    if (decodedPayment && decodedPayment.description && decodedPayment.description !== '') {
      reorderedHTLC.splice(3, 0, [{ key: 'description', value: decodedPayment.description, title: 'Description', width: 100, type: DataTypeEnum.STRING }]);
    }
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'HTLC Information',
          message: reorderedHTLC,
          scrollable: selHtlc.route && selHtlc.route.hops && selHtlc.route.hops.length > 1
        }
      }
    }));
  }

  onPaymentClick(selPayment: Payment) {
    if (selPayment.htlcs && selPayment.htlcs[0] && selPayment.htlcs[0].route && selPayment.htlcs[0].route.hops && selPayment.htlcs[0].route.hops.length > 0) {
      const nodePubkeys = selPayment.htlcs[0].route.hops.reduce((pubkeys, hop) => (pubkeys === '' ? hop.pub_key : pubkeys + ',' + hop.pub_key), '');
      this.dataService.getAliasesFromPubkeys(nodePubkeys, true).pipe(takeUntil(this.unSubs[7])).
        subscribe((nodes: any) => {
          this.showPaymentView(selPayment, nodes.reduce((pathAliases, node) => (pathAliases === '' ? node : pathAliases + '\n' + node), ''));
        });
    } else {
      this.showPaymentView(selPayment, '');
    }
  }

  showPaymentView(selPayment: Payment, pathAliases: string) {
    const reorderedPayment = [
      [{ key: 'payment_hash', value: selPayment.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'payment_preimage', value: selPayment.payment_preimage, title: 'Payment Preimage', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'payment_request', value: selPayment.payment_request, title: 'Payment Request', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'status', value: selPayment.status, title: 'Status', width: 50, type: DataTypeEnum.STRING },
      { key: 'creation_date', value: selPayment.creation_date, title: 'Creation Date', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'value_msat', value: selPayment.value_msat, title: 'Value (mSats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'fee_msat', value: selPayment.fee_msat, title: 'Fee (mSats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'path', value: pathAliases, title: 'Path', width: 100, type: DataTypeEnum.STRING }]
    ];
    if (selPayment.payment_request && selPayment.payment_request.trim() !== '') {
      this.dataService.decodePayment(selPayment.payment_request, false).
        pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
          if (decodedPayment && decodedPayment.description && decodedPayment.description !== '') {
            reorderedPayment.splice(3, 0, [{ key: 'description', value: decodedPayment.description, title: 'Description', width: 100, type: DataTypeEnum.STRING }]);
          }
          setTimeout(() => {
            this.openPaymentAlert(reorderedPayment, (selPayment.htlcs && selPayment.htlcs[0] && selPayment.htlcs[0].route && selPayment.htlcs[0].route.hops && selPayment.htlcs[0].route.hops.length > 1));
          }, 0);
        });
    } else {
      this.openPaymentAlert(reorderedPayment, false);
    }
  }

  openPaymentAlert(data: any, shouldScroll: boolean) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Payment Information',
          message: data,
          scrollable: shouldScroll
        }
      }
    }));
  }

  applyFilter() {
    this.payments.filter = this.selFilter.trim().toLowerCase();
  }

  loadPaymentsTable(payms) {
    this.payments = payms ? new MatTableDataSource<Payment>([...payms]) : new MatTableDataSource([]);
    this.payments.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'hops':
          return (data.htlcs.length && data.htlcs[0] && data.htlcs[0].route && data.htlcs[0].route.hops && data.htlcs[0].route.hops.length) ? data.htlcs[0].route.hops.length : 0;

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.payments.sort = this.sort;
    this.payments.filterPredicate = (payment: Payment, fltr: string) => {
      const newPayment = ((payment.creation_date) ? this.datePipe.transform(new Date(payment.creation_date * 1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') + JSON.stringify(payment).toLowerCase();
      return newPayment.includes(fltr);
    };
    this.applyFilter();
  }

  onDownloadCSV() {
    if (this.payments.data && this.payments.data.length > 0) {
      const paymentsDataCopy = JSON.parse(JSON.stringify(this.payments.data));
      const paymentRequests = paymentsDataCopy.reduce((paymentReqs, payment) => {
        if (payment.payment_request && payment.payment_request.trim() !== '') {
          paymentReqs = (paymentReqs === '') ? payment.payment_request : paymentReqs + ',' + payment.payment_request;
        }
        return paymentReqs;
      }, '');
      this.dataService.decodePayments(paymentRequests).
        pipe(takeUntil(this.unSubs[8])).
        subscribe((decodedPayments: PayRequest[]) => {
          let increament = 0;
          decodedPayments.forEach((decodedPayment, idx) => {
            if (decodedPayment) {
              while (paymentsDataCopy[idx + increament].payment_hash !== decodedPayment.payment_hash) {
                increament = increament + 1;
              }
              paymentsDataCopy[idx + increament].description = decodedPayment.description;
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
