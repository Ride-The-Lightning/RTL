import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';

import { LoggerService } from '../../../services/logger.service';
import { AlertData, ErrorData } from '../../../models/alertData';
import { AlertTypeEnum, DataTypeEnum } from '../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-alert-message',
  templateUrl: './alert-message.component.html',
  styleUrls: ['./alert-message.component.scss']
})
export class AlertMessageComponent implements OnInit {
  public errorMessage = '';
  public messageObjs = [];
  public alertTypeEnum = AlertTypeEnum;
  public dataTypeEnum = DataTypeEnum;
  
  constructor(public dialogRef: MatDialogRef<AlertMessageComponent>, @Inject(MAT_DIALOG_DATA) public data: AlertData, private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.messageObjs = this.data.message;
    if (this.data.type === AlertTypeEnum.ERROR) {
      if (undefined === this.data.message && undefined === this.data.titleMessage && this.messageObjs.length <= 0) {
        this.data.titleMessage = 'Please Check Server Connection';
      }
    }
    this.logger.info(this.messageObjs);
  }

  onClose() {
    this.dialogRef.close(false);
  }
}
