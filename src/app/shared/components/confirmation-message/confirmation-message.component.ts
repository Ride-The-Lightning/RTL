import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../shared/services/logger.service';
import { AlertData, InputData } from '../../../shared/models/alertData';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromApp from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-confirmation-message',
  templateUrl: './confirmation-message.component.html',
  styleUrls: ['./confirmation-message.component.scss']
})
export class ConfirmationMessageComponent implements OnInit {
  public msgTypeBackground = 'bg-primary p-1';
  public msgTypeForeground = 'primary';
  public noBtnText = 'No';
  public yesBtnText = 'Yes';
  public messageObj = [];
  public flgCopied = false;
  public flgShowInput = false;
  public getInputs: Array<InputData> = [{placeholder: '', inputType: 'text', inputValue: ''}];

  constructor(public dialogRef: MatDialogRef<ConfirmationMessageComponent>, @Inject(MAT_DIALOG_DATA) public data: AlertData, private logger: LoggerService,
   private store: Store<fromApp.AppState>) { }

  ngOnInit() {
    this.flgShowInput = this.data.flgShowInput;
    this.getInputs = this.data.getInputs;
    this.noBtnText = (undefined !== this.data.noBtnText) ? this.data.noBtnText : 'No';
    this.yesBtnText = (undefined !== this.data.yesBtnText) ? this.data.yesBtnText : 'Yes';

    // INFO/WARN/ERROR/SUCCESS/CONFIRM
    if (this.data.type === 'WARN') {
      this.msgTypeBackground = 'bg-accent p-1';
    }
    if (this.data.type === 'ERROR') {
      this.msgTypeBackground = 'bg-warn p-1';
      this.msgTypeForeground = 'warn';
    }
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
    this.messageObj = (this.data.message === '') ? [] : this.data.message.split(',');
    this.messageObj.forEach((obj, idx) => {
      this.messageObj[idx] = obj.split(':');
      this.messageObj[idx][0] = this.messageObj[idx][0].replace(/_/g, ' '); // To replace Backend Data's '_'
      // Start: To Merge Time Value Again with ':', example Payment Creation Time
      if (this.messageObj[idx].length > 2) {
        this.messageObj[idx].forEach((dataValue, j) => {
          if (j === 0 || j === 1) {
            return;
          } else {
            this.messageObj[idx][1] = this.messageObj[idx][1] + ':' + this.messageObj[idx][j];
          }
        });
      }
      // End: To Merge Time Value Again with ':', example Payment Creation Time
    });
  }

  showCopyOption(key): boolean {
    let flgFoundKey = false;
    const showCopyOnKeys = ['payment request'];
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
    const notNumberKeys = ['chan id', 'creation date'];
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

  onClose(dialogRes: any) {
    this.store.dispatch(new RTLActions.CloseConfirmation(dialogRes));
  }
}
