import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { InvoiceInformation } from '../../../shared/models/alertData';
import { Invoice } from '../../../shared/models/lndModels';
import { ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-invoice-information',
  templateUrl: './invoice-information.component.html',
  styleUrls: ['./invoice-information.component.scss']
})
export class InvoiceInformationComponent implements OnInit {
  public faReceipt = faReceipt;
  public showAdvanced = false;
  public newlyAdded = false;
  public invoice: Invoice;
  public qrWidth = 240;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<InvoiceInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: InvoiceInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar) { }

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
    this.snackBar.open('Payment request copied.');
    this.logger.info('Copied Text: ' + payload);
  }
}
