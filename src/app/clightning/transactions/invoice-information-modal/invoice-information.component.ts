import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { CLInvoiceInformation } from '../../../shared/models/alertData';
import { Invoice } from '../../../shared/models/clModels';
import { ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';

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
  public invoice: Invoice;
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
    this.snackBar.open('Invoice copied.');
    this.logger.info('Copied Text: ' + payload);
  }
}
