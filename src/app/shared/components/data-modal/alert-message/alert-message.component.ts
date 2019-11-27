import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../../services/logger.service';
import { AlertData } from '../../../models/alertData';
import { AlertTypeEnum } from '../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-alert-message',
  templateUrl: './alert-message.component.html',
  styleUrls: ['./alert-message.component.scss']
})
export class AlertMessageComponent implements OnInit {
  public msgTypeBackground = 'bg-primary p-1';
  public msgTypeForeground = 'primary';
  public messageObjsArr = [];
  public messageObjs = [];
  public messageFieldsBreakdown = [];
  public flgCopied = false;
  public faCopy = faCopy;
  public alertTypeEnum = AlertTypeEnum;
  
  constructor(public dialogRef: MatDialogRef<AlertMessageComponent>, @Inject(MAT_DIALOG_DATA) public data: AlertData, private logger: LoggerService) { }

  ngOnInit() {
    this.messageFieldsBreakdown = this.data.messageFieldsBreakdown;
    this.setStyleOnAlertType();
    this.convertJSONData();
  }

  setStyleOnAlertType() {
    if (this.data.type === AlertTypeEnum.WARNING) {
      this.msgTypeBackground = 'bg-primary p-1';
      this.msgTypeForeground = 'primary';
    }
    if (this.data.type === AlertTypeEnum.ERROR) {
      this.msgTypeBackground = 'bg-warn p-1';
      this.msgTypeForeground = 'warn';
      if (undefined === this.data.message && undefined === this.data.titleMessage && this.messageObjsArr.length <= 0 ) {
        this.data.titleMessage = 'Please Check Server Connection';
      }
    }
  }

  convertJSONData() {
    this.data.message = (undefined === this.data.message) ? '' : this.data.message.replace(/{/g, '').replace(/"/g, '').replace(/}/g, '').replace(/\n/g, '');
    // Start: For Payment Path
    const arrayStartIdx = this.data.message.search('\\[');
    const arrayEndIdx = this.data.message.search('\\]');
    if (arrayStartIdx > -1 && arrayEndIdx > -1) {
      this.data.message = this.data.message.substring(0, arrayStartIdx).concat(
      this.data.message.substring(arrayStartIdx + 1, arrayEndIdx).replace(/,/g, '\n'),
      this.data.message.substring(arrayEndIdx + 1));
    }
    // End: For Payment Path
    this.messageObjsArr = (this.data.message === '') ? [] : this.data.message.split(',');
    this.messageObjsArr.forEach((obj, idx) => {
      this.messageObjsArr[idx] = obj.split(':');
      this.messageObjsArr[idx][0] = this.messageObjsArr[idx][0].replace('_str', '');
      this.messageObjsArr[idx][0] = this.messageObjsArr[idx][0].replace(/_/g, ' '); // To replace Backend Data's '_'
      // Start: To Merge Time Value Again with ':', example Payment Creation Time
      if (this.messageObjsArr[idx].length > 2) {
        this.messageObjsArr[idx].forEach((dataValue, j) => {
          if (j === 0 || j === 1) {
            return;
          } else {
            this.messageObjsArr[idx][1] = this.messageObjsArr[idx][1] + ':' + this.messageObjsArr[idx][j];
          }
        });
      }
      // End: To Merge Time Value Again with ':', example Payment Creation Time
    });
    for (let i = 0; i < this.messageFieldsBreakdown.length; i++) {
      this.messageObjs[i] = [];
      for (let j = 0, k = i; k < (i + this.messageFieldsBreakdown[i]); j++, k++) {
        this.messageObjs[i][j] = this.messageObjsArr[k];
      }
    }
    console.warn(this.messageObjs);
  }

  showCopyOption(key): boolean {
    let flgFoundKey = false;
    const showCopyOnKeys = ['payment request', 'bolt11'];
    showCopyOnKeys.filter((arrKey) => {
      if (arrKey === key) {
        flgFoundKey = true;
        return true;
      }
    });
    return flgFoundKey;
  }

  copiedText(payload) {
    this.flgCopied = true;
    setTimeout(() => {this.flgCopied = false; }, 5000);
    this.logger.info('Copied Text: ' + payload);
  }

  isNumber(value, key): boolean {
    let flgFoundKey = false;
    const notNumberKeys = ['chan id', 'creation date', 'chan id out', 'chan id in'];
    notNumberKeys.filter((arrKey) => {
      if (arrKey === key) {
        flgFoundKey = true;
      }
    });
    if (!flgFoundKey) {
      return new RegExp(/^[0-9]+$/).test(value);
    } else {
      return false;
    }
  }

  onClose() {
    this.dialogRef.close(false);
  }
}
