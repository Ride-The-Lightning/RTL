import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Payment, Invoice, ListInvoices, ListPayments } from '../../../shared/models/lndModels';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { APICallStatusEnum, MONTHS, ScreenSizeEnum, SCROLL_RANGES } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { fadeIn } from '../../../shared/animation/opacity-animation';

import { RTLState } from '../../../store/rtl.state';
import { allLightningTransactions } from '../../store/lnd.selector';


@Component({
  selector: 'rtl-transactions-report',
  templateUrl: './transactions-report.component.html',
  styleUrls: ['./transactions-report.component.scss'],
  animations: [fadeIn]
})
export class TransactionsReportComponent implements OnInit, OnDestroy {

  public scrollRanges = SCROLL_RANGES;
  public reportPeriod = SCROLL_RANGES[0];
  public secondsInADay = 24 * 60 * 60;
  public payments: Payment[] = [];
  public invoices: Invoice[] = [];
  public transactionsReportSummary = { paymentsSelectedPeriod: 0, invoicesSelectedPeriod: 0, amountPaidSelectedPeriod: 0, amountReceivedSelectedPeriod: 0 };
  public transactionFilterValue = '';
  public today = new Date(Date.now());
  public startDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1, 0, 0, 0);
  public endDate = new Date(this.today.getFullYear(), this.today.getMonth(), this.getMonthDays(this.today.getMonth(), this.today.getFullYear()), 23, 59, 59);
  public transactionsReportData: any = [{ date: '', name: '1', series: [{ extra: { total: 0.0 }, name: 'Paid', value: 0.0 }, { extra: { total: 0.0 }, name: 'Received', value: 0.0 }] }];
  public transactionsNonZeroReportData: any = [{ amount_paid: 0.0, amount_received: 0.0, date: '', num_invoices: 0, num_payments: 0 }];
  public view: [number, number] = [350, 350];
  public screenPaddingX = 100;
  public gradient = true;
  public xAxisLabel = 'Date';
  public yAxisLabel = 'Amount (Sats)';
  public showYAxisLabel = true;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.showYAxisLabel = !(this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM);
    this.store.select(allLightningTransactions).pipe(takeUntil(this.unSubs[0])).
      subscribe((allLTSelector: { allLightningTransactions: { listPaymentsAll: ListPayments, listInvoicesAll: ListInvoices }, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = allLTSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.payments = allLTSelector.allLightningTransactions.listPaymentsAll.payments || [];
        this.invoices = allLTSelector.allLightningTransactions.listInvoicesAll.invoices || [];
        if (this.payments.length > 0 || this.invoices.length > 0) {
          this.transactionsReportData = this.filterTransactionsForSelectedPeriod(this.startDate, this.endDate);
          this.transactionsNonZeroReportData = this.prepareTableData();
        }
        this.logger.info(allLTSelector);
      });
    this.commonService.containerSizeUpdated.pipe(takeUntil(this.unSubs[1])).subscribe((CONTAINER_SIZE) => {
      switch (this.screenSize) {
        case ScreenSizeEnum.MD:
          this.screenPaddingX = CONTAINER_SIZE.width / 10;
          break;

        case ScreenSizeEnum.LG:
          this.screenPaddingX = CONTAINER_SIZE.width / 16;
          break;

        default:
          this.screenPaddingX = CONTAINER_SIZE.width / 20;
          break;
      }
      this.view = [CONTAINER_SIZE.width - this.screenPaddingX, CONTAINER_SIZE.height / 2.2];
    });
  }

  @HostListener('mouseup', ['$event']) onChartMouseUp(e) {
    if (e.srcElement.tagName === 'svg' && e.srcElement.classList.length > 0 && e.srcElement.classList[0] === 'ngx-charts') {
      this.transactionFilterValue = '';
    }
  }

  onChartBarSelected(event) {
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      this.transactionFilterValue = event.series + '/' + this.startDate.getFullYear();
    } else {
      this.transactionFilterValue = event.series.toString().padStart(2, '0') + '/' + MONTHS[this.startDate.getMonth()].name + '/' + this.startDate.getFullYear();
    }
  }

  filterTransactionsForSelectedPeriod(start: Date, end: Date) {
    const startDateInSeconds = Math.round(start.getTime() / 1000);
    const endDateInSeconds = Math.round(end.getTime() / 1000);
    const transactionsReport = [];
    this.transactionsNonZeroReportData = [];
    this.transactionsReportSummary = { paymentsSelectedPeriod: 0, invoicesSelectedPeriod: 0, amountPaidSelectedPeriod: 0, amountReceivedSelectedPeriod: 0 };
    const filteredPayments = this.payments.filter((payment) => payment.status === 'SUCCEEDED' && payment.creation_date >= startDateInSeconds && payment.creation_date < endDateInSeconds);
    const filteredInvoices = this.invoices.filter((invoice) => invoice.settled && +invoice.creation_date >= startDateInSeconds && +invoice.creation_date < endDateInSeconds);
    this.transactionsReportSummary.paymentsSelectedPeriod = filteredPayments.length;
    this.transactionsReportSummary.invoicesSelectedPeriod = filteredInvoices.length;
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      for (let i = 0; i < 12; i++) {
        transactionsReport.push({ name: MONTHS[i].name, date: new Date(start.getFullYear(), i, 1, 0, 0, 0, 0), series: [{ name: 'Paid', value: 0, extra: { total: 0 } }, { name: 'Received', value: 0, extra: { total: 0 } }] });
      }
      filteredPayments.map((payment) => {
        const monthNumber = new Date((+payment.creation_date) * 1000).getMonth();
        this.transactionsReportSummary.amountPaidSelectedPeriod = this.transactionsReportSummary.amountPaidSelectedPeriod + (+payment.value_msat) + (+payment.fee_msat);
        transactionsReport[monthNumber].series[0].value = transactionsReport[monthNumber].series[0].value + ((+payment.value_msat + +payment.fee_msat) / 1000);
        transactionsReport[monthNumber].series[0].extra.total = transactionsReport[monthNumber].series[0].extra.total + 1;
        return this.transactionsReportSummary;
      });
      filteredInvoices.map((invoice) => {
        const monthNumber = new Date((+invoice.creation_date) * 1000).getMonth();
        this.transactionsReportSummary.amountReceivedSelectedPeriod = this.transactionsReportSummary.amountReceivedSelectedPeriod + (+invoice.amt_paid_msat);
        transactionsReport[monthNumber].series[1].value = transactionsReport[monthNumber].series[1].value + (+invoice.amt_paid_msat / 1000);
        transactionsReport[monthNumber].series[1].extra.total = transactionsReport[monthNumber].series[1].extra.total + 1;
        return this.transactionsReportSummary;
      });
    } else {
      for (let i = 0; i < this.getMonthDays(start.getMonth(), start.getFullYear()); i++) {
        transactionsReport.push({ name: (i + 1).toString(), date: new Date((((i) * this.secondsInADay) + startDateInSeconds) * 1000), series: [{ name: 'Paid', value: 0, extra: { total: 0 } }, { name: 'Received', value: 0, extra: { total: 0 } }] });
      }
      filteredPayments.map((payment) => {
        const dateNumber = Math.floor((+payment.creation_date - startDateInSeconds) / this.secondsInADay);
        this.transactionsReportSummary.amountPaidSelectedPeriod = this.transactionsReportSummary.amountPaidSelectedPeriod + (+payment.value_msat) + (+payment.fee_msat);
        transactionsReport[dateNumber].series[0].value = transactionsReport[dateNumber].series[0].value + ((+payment.value_msat + +payment.fee_msat) / 1000);
        transactionsReport[dateNumber].series[0].extra.total = transactionsReport[dateNumber].series[0].extra.total + 1;
        return this.transactionsReportSummary;
      });
      filteredInvoices.map((invoice) => {
        const dateNumber = Math.floor((+invoice.creation_date - startDateInSeconds) / this.secondsInADay);
        this.transactionsReportSummary.amountReceivedSelectedPeriod = this.transactionsReportSummary.amountReceivedSelectedPeriod + (+invoice.amt_paid_msat);
        transactionsReport[dateNumber].series[1].value = transactionsReport[dateNumber].series[1].value + (+invoice.amt_paid_msat / 1000);
        transactionsReport[dateNumber].series[1].extra.total = transactionsReport[dateNumber].series[1].extra.total + 1;
        return this.transactionsReportSummary;
      });
    }
    return transactionsReport;
  }

  prepareTableData() {
    return this.transactionsReportData.reduce((acc, curr) => {
      if (curr.series[0].extra.total > 0 || curr.series[1].extra.total > 0) {
        return acc.concat({ date: curr.date, amount_paid: curr.series[0].value, num_payments: curr.series[0].extra.total, amount_received: curr.series[1].value, num_invoices: curr.series[1].extra.total });
      }
      return acc;
    }, []);
  }

  onSelectionChange(selectedValues: { selDate: Date, selScrollRange: string }) {
    const selMonth = selectedValues.selDate.getMonth();
    const selYear = selectedValues.selDate.getFullYear();
    this.reportPeriod = selectedValues.selScrollRange;
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      this.startDate = new Date(selYear, 0, 1, 0, 0, 0);
      this.endDate = new Date(selYear, 11, 31, 23, 59, 59);
    } else {
      this.startDate = new Date(selYear, selMonth, 1, 0, 0, 0);
      this.endDate = new Date(selYear, selMonth, this.getMonthDays(selMonth, selYear), 23, 59, 59);
    }
    this.transactionsReportData = this.filterTransactionsForSelectedPeriod(this.startDate, this.endDate);
    this.transactionsNonZeroReportData = this.prepareTableData();
    this.transactionFilterValue = '';
  }

  getMonthDays(selMonth: number, selYear: number) {
    return (selMonth === 1 && selYear % 4 === 0) ? (MONTHS[selMonth].days + 1) : MONTHS[selMonth].days;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

