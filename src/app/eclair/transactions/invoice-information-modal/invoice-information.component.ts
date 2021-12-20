import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { GetInfo, Invoice } from '../../../shared/models/eclModels';
import { ECLInvoiceInformation } from '../../../shared/models/alertData';
import { ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { RTLState } from '../../../store/rtl.state';
import { eclNodeInformation, invoices } from '../../store/ecl.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-ecl-invoice-information',
  templateUrl: './invoice-information.component.html',
  styleUrls: ['./invoice-information.component.scss']
})
export class ECLInvoiceInformationComponent implements OnInit, OnDestroy {

  public faReceipt = faReceipt;
  public faExclamationTriangle = faExclamationTriangle;
  public showAdvanced = false;
  public newlyAdded = false;
  public invoice: Invoice;
  public qrWidth = 240;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public flgInvoicePaid = false;
  public flgVersionCompatible = true;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ECLInvoiceInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: ECLInvoiceInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar, private store: Store<RTLState>) { }

  ngOnInit() {
    this.invoice = this.data.invoice;
    this.newlyAdded = this.data.newlyAdded;
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.qrWidth = 220;
    }
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeInfo: GetInfo) => {
        this.flgVersionCompatible = this.commonService.isVersionCompatible(nodeInfo.version, '0.5.0');
      });
    this.store.select(invoices).pipe(takeUntil(this.unSubs[1])).
      subscribe((invoicesSelector: { invoices: Invoice[], apiCallStatus: ApiCallStatusPayload }) => {
        const invoiceStatus = this.invoice.status;
        const invoices = (invoicesSelector.invoices && invoicesSelector.invoices.length > 0) ? invoicesSelector.invoices : [];
        this.invoice = invoices.find((invoice) => invoice.paymentHash === this.invoice.paymentHash);
        if (invoiceStatus !== this.invoice.status && this.invoice.status === 'received') {
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
  }

  onCopyPayment(payload: string) {
    this.snackBar.open('Invoice copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
