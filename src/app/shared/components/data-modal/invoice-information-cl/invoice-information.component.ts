import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faReceipt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../services/logger.service';
import { CommonService } from '../../../services/common.service';
import { CLInvoiceInformation } from '../../../models/alertData';
import { InvoiceCL } from '../../../models/clModels';
import { ScreenSizeEnum } from '../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-cl-invoice-information',
  templateUrl: './invoice-information.component.html',
  styleUrls: ['./invoice-information.component.scss']
})
export class CLInvoiceInformationComponent implements OnInit {
  public faReceipt = faReceipt;
  public faExclamationTriangle = faExclamationTriangle;
  public showAdvanced = false;
  public newlyAdded = false;
  public invoice: InvoiceCL;
  public qrWidth = 240;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<CLInvoiceInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: CLInvoiceInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.invoice = this.data.invoice;
    this.newlyAdded = this.data.newlyAdded;
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.qrWidth = 220;
    }
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }  

  onCopyPayment(payload: string) {
    this.snackBar.open('Bolt11 copied.');
    this.logger.info('Copied Text: ' + payload);
  }
}
