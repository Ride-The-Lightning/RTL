import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { LoggerService } from '../../../services/logger.service';
import { ErrorData } from '../../../models/alertData';

@Component({
  selector: 'rtl-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss']
})
export class ErrorMessageComponent implements OnInit {
  public errorMessage = '';

  constructor(public dialogRef: MatDialogRef<ErrorMessageComponent>, @Inject(MAT_DIALOG_DATA) public data: ErrorData, private logger: LoggerService) { }

  ngOnInit() {
    this.errorMessage = (typeof(this.data.message.message) === 'object') ? JSON.stringify(this.data.message.message) : this.data.message.message;
    if (!this.data.message && !this.data.titleMessage && !this.data.message) {
      this.data.titleMessage = 'Please Check Server Connection';
    }
    this.logger.info(this.data.message);
  }

  onClose() {
    this.dialogRef.close(false);
  }
}
