import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../shared/services/logger.service';
import { AlertData } from '../../../shared/models/alertData';
import { Invoice } from '../../../shared/models/lndModels';

@Component({
  selector: 'rtl-invoice-information',
  templateUrl: './invoice-information.component.html',
  styleUrls: ['./invoice-information.component.scss']
})
export class InvoiceInformationComponent implements OnInit {
  public faReceipt = faReceipt;
  public showAdvanced = false;
  public invoice: Invoice;

  constructor(public dialogRef: MatDialogRef<InvoiceInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: AlertData, private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.invoice = JSON.parse(this.data.message);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }  

  onCopyPayment(payload: string) {
    this.snackBar.open('Payment request copied');
    this.logger.info('Copied Text: ' + payload);
  }
}
