import { Component, OnInit, Inject, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { InvoiceInformation } from '../../../shared/models/alertData';
import { GetInfo, Invoice, ListInvoices } from '../../../shared/models/lndModels';
import { ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { RTLState } from '../../../store/rtl.state';
import { invoices, lndNodeInformation } from '../../store/lnd.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-invoice-information',
  templateUrl: './invoice-information.component.html',
  styleUrls: ['./invoice-information.component.scss']
})
export class InvoiceInformationComponent implements OnInit, OnDestroy {

  private scrollContainer: ElementRef;
  @ViewChild('scrollContainer') set container(containerContent: ElementRef) {
    if (containerContent) {
      this.scrollContainer = containerContent;
    }
  }
  public faReceipt = faReceipt;
  public showAdvanced = false;
  public newlyAdded = false;
  public invoice: Invoice;
  public qrWidth = 240;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public flgOpened = false;
  public flgInvoicePaid = false;
  public flgVersionCompatible = true;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<InvoiceInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: InvoiceInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar, private store: Store<RTLState>) { }

  ngOnInit() {
    this.invoice = JSON.parse(JSON.stringify(this.data.invoice));
    this.newlyAdded = this.data.newlyAdded;
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.qrWidth = 220;
    }
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeInfo: GetInfo) => {
        this.flgVersionCompatible = this.commonService.isVersionCompatible(nodeInfo.version, '0.11.0');
      });
    const invoiceToCompare = JSON.parse(JSON.stringify(this.invoice));
    this.store.select(invoices).pipe(takeUntil(this.unSubs[1])).
      subscribe((invoicesSelector: { listInvoices: ListInvoices, apiCallStatus: ApiCallStatusPayload }) => {
        const invoiceStatus = this.invoice.state;
        const invoices = invoicesSelector.listInvoices.invoices || [];
        const foundInvoice = invoices.find((invoice) => invoice.r_hash === invoiceToCompare.r_hash);
        this.invoice = foundInvoice;
        if (invoiceStatus !== this.invoice.state && this.invoice.state === 'SETTLED') {
          this.flgInvoicePaid = true;
          setTimeout(() => { this.flgInvoicePaid = false; }, 4000);
        }
        this.logger.info(invoicesSelector);
      });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
    this.flgOpened = false;
  }

  onScrollDown() {
    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollTop + 60;
  }

  onExpansionClosed() {
    this.flgOpened = false;
    this.scrollContainer.nativeElement.scrollTop = 0;
  }

  onCopyPayment(payload: string) {
    this.snackBar.open('Payment request copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  getDecimalFormat(htlc: any): string {
    return htlc.amt_msat < 1000 ? '1.0-4' : '1.0-0';
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
