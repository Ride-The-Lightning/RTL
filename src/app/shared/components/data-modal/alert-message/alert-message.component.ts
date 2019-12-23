import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';

import { CommonService } from '../../../services/common.service';
import { LoggerService } from '../../../services/logger.service';
import { AlertData } from '../../../models/alertData';
import { AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-alert-message',
  templateUrl: './alert-message.component.html',
  styleUrls: ['./alert-message.component.scss']
})
export class AlertMessageComponent implements OnInit {
  public showQRField = '';
  public showQRName = '';  
  public errorMessage = '';
  public messageObjs = [];
  public alertTypeEnum = AlertTypeEnum;
  public dataTypeEnum = DataTypeEnum;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<AlertMessageComponent>, @Inject(MAT_DIALOG_DATA) public data: AlertData, private logger: LoggerService, private snackBar: MatSnackBar, private commonService: CommonService) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.messageObjs = this.data.message;
    this.showQRField = this.data.showQRField ? this.data.showQRField : '';
    this.showQRName = this.data.showQRName ? this.data.showQRName : '';

    if (this.data.type === AlertTypeEnum.ERROR) {
      if (undefined === this.data.message && undefined === this.data.titleMessage && this.messageObjs.length <= 0) {
        this.data.titleMessage = 'Please Check Server Connection';
      }
    }
    this.logger.info(this.messageObjs);
  }

  onCopyField(payload: string) {
    this.snackBar.open(this.showQRName + ' copied');
    this.logger.info('Copied Text: ' + payload);
  }

  onClose() {
    this.dialogRef.close(false);
  }
}
