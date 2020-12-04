import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { GetInfo, Payment, PayRequest, Peer } from '../../models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../services/consts-enums-functions';
import { LoggerService } from '../../services/logger.service';
import { CommonService } from '../../services/common.service';
import { DataService } from '../../services/data.service';
import { SelNodeChild } from '../../models/RTLconfig';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-transactions-report-table',
  templateUrl: './transactions-report-table.component.html',
  styleUrls: ['./transactions-report-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Transactions') }
  ]  
})
export class TransactionsReportTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() dataList = [];
  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  public faHistory = faHistory;
  public newlyAddedPayment = '';
  public flgAnimate = true;
  public selNode: SelNodeChild = {};
  public flgLoading: Array<Boolean | 'error'> = [true];
  public information: GetInfo = {};
  public peers: Peer[] = [];
  public payments: any;
  public paymentJSONArr: Payment[] = [];
  public displayedColumns = [];
  public htlcColumns = [];
  public paymentDecoded: PayRequest = {};
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private dataService: DataService, private store: Store<fromRTLReducer.RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'actions'];
      this.htlcColumns = ['groupTotal', 'groupAction'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'value', 'actions'];
      this.htlcColumns = ['groupTotal', 'groupValue', 'groupAction'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['creation_date', 'fee', 'value', 'actions'];
      this.htlcColumns = ['groupTotal', 'groupFee', 'groupValue', 'groupAction'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['creation_date', 'payment_hash', 'fee', 'value', 'hops', 'actions'];
      this.htlcColumns = ['groupTotal', 'groupHash', 'groupFee', 'groupValue', 'groupHops', 'groupAction'];
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPayments') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.selNode = rtlStore.nodeSettings;
      this.peers = rtlStore.peers;
      this.paymentJSONArr = (rtlStore.payments && rtlStore.payments.length > 0) ? rtlStore.payments : [];
      if (this.paymentJSONArr && this.paymentJSONArr.length > 0) {
        this.loadPaymentsTable(this.paymentJSONArr);
      }
      setTimeout(() => { this.flgAnimate = false; }, 3000);
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( this.paymentJSONArr) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    if (this.paymentJSONArr && this.paymentJSONArr.length > 0) {
      this.loadPaymentsTable(this.paymentJSONArr);
    }
  }

  is_group(index: number, payment: Payment) {
    return payment.htlcs && payment.htlcs.length > 1;
  }  

  onPaymentClick(selPayment: Payment) {
    if (selPayment.htlcs && selPayment.htlcs[0] && selPayment.htlcs[0].route && selPayment.htlcs[0].route.hops && selPayment.htlcs[0].route.hops.length > 0) {
      let nodePubkeys = selPayment.htlcs[0].route.hops.reduce((pubkeys, hop) => { return pubkeys === '' ? hop.pub_key : pubkeys + ',' + hop.pub_key }, '');
      forkJoin(this.dataService.getAliasesFromPubkeys(nodePubkeys, true)
      .pipe(takeUntil(this.unSubs[3]))
      .subscribe((nodes: any) => {
        this.showPaymentView(selPayment, nodes.reduce((pathAliases, node) => { return pathAliases === '' ? node : pathAliases + '\n' + node }, ''));
      }));
    } else {
      this.showPaymentView(selPayment, '');
    }
  }

  showPaymentView(selPayment: Payment, pathAliases: string) {
    const reorderedPayment = [
      [{key: 'payment_hash', value: selPayment.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'payment_preimage', value: selPayment.payment_preimage, title: 'Payment Preimage', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'payment_request', value: selPayment.payment_request, title: 'Payment Request', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'status', value: selPayment.status, title: 'Status', width: 50, type: DataTypeEnum.STRING},
        {key: 'creation_date_str', value: selPayment.creation_date_str, title: 'Creation Date', width: 50, type: DataTypeEnum.DATE_TIME}],
      [{key: 'value_msat', value: selPayment.value_msat, title: 'Value (mSats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'fee_msat', value: selPayment.fee_msat, title: 'Fee (mSats)', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'path', value: pathAliases, title: 'Path', width: 100, type: DataTypeEnum.STRING}]
    ];
    if (selPayment.payment_request && selPayment.payment_request.trim() !== '') {
      this.dataService.decodePayment(selPayment.payment_request, false)
      .pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
        if (decodedPayment && decodedPayment.description && decodedPayment.description !== '') {
          reorderedPayment.splice(3, 0, [{key: 'description', value: decodedPayment.description, title: 'Description', width: 100, type: DataTypeEnum.STRING}]);
        }
        this.openPaymentAlert(reorderedPayment, (selPayment.htlcs && selPayment.htlcs[0] && selPayment.htlcs[0].route && selPayment.htlcs[0].route.hops && selPayment.htlcs[0].route.hops.length > 1));
      });
    } else {
      this.openPaymentAlert(reorderedPayment, false);
    }
  }

  openPaymentAlert(data: any, shouldScroll: boolean) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Payment Information',
      message: data,
      scrollable: shouldScroll
    }}));
  }

  applyFilter(selFilter: string) {
    this.payments.filter = selFilter;
  }

  loadPaymentsTable(payments) {
    this.payments = (payments) ?  new MatTableDataSource([]) : new MatTableDataSource<Payment>([...payments]);
    this.payments.data = payments;
    this.payments.sortingDataAccessor = (data, sortHeaderId) => {
      switch (sortHeaderId) {
        case 'hops': return (data.htlcs.length && data.htlcs[0] && data.htlcs[0].route && data.htlcs[0].route.hops && data.htlcs[0].route.hops.length ) ? data.htlcs[0].route.hops.length : 0;
        default: return (data[sortHeaderId]  && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : +data[sortHeaderId];
      }
    }
    this.payments.sort = this.sort;
    this.payments.paginator = this.paginator;
}

  onDownloadCSV() {
    if(this.payments.data && this.payments.data.length > 0) {
      let paymentsDataCopy = JSON.parse(JSON.stringify(this.payments.data));
      let paymentRequests = paymentsDataCopy.reduce((paymentReqs, payment) => { 
        if (payment.payment_request && payment.payment_request.trim() !== '') {
          paymentReqs = (paymentReqs === '') ? payment.payment_request : paymentReqs + ',' + payment.payment_request;
        }
        return paymentReqs;
      }, '');
      forkJoin(this.dataService.decodePayments(paymentRequests)
      .pipe(takeUntil(this.unSubs[4]))
      .subscribe((decodedPayments: PayRequest[]) => {
        let increament = 0;
        decodedPayments.forEach((decodedPayment, idx) => {
          while (paymentsDataCopy[idx + increament].payment_hash !== decodedPayment.payment_hash) {
            increament = increament + 1;
          }
          paymentsDataCopy[idx + increament].description = decodedPayment.description;
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
