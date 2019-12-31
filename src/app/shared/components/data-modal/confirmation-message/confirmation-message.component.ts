import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../services/logger.service';
import { InputData, ConfirmationData } from '../../../models/alertData';
import { AlertTypeEnum, DataTypeEnum } from '../../../services/consts-enums-functions';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-confirmation-message',
  templateUrl: './confirmation-message.component.html',
  styleUrls: ['./confirmation-message.component.scss']
})
export class ConfirmationMessageComponent implements OnInit {
  public noBtnText = 'No';
  public yesBtnText = 'Yes';
  public messageObjs = [];
  public flgShowInput = false;
  public alertTypeEnum = AlertTypeEnum;
  public dataTypeEnum = DataTypeEnum;
  public getInputs: Array<InputData> = [{placeholder: '', inputType: 'text', inputValue: ''}];

  constructor(public dialogRef: MatDialogRef<ConfirmationMessageComponent>, @Inject(MAT_DIALOG_DATA) public data: ConfirmationData, private logger: LoggerService,
   private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    this.flgShowInput = this.data.flgShowInput;
    this.getInputs = this.data.getInputs;
    this.noBtnText = (undefined !== this.data.noBtnText) ? this.data.noBtnText : 'No';
    this.yesBtnText = (undefined !== this.data.yesBtnText) ? this.data.yesBtnText : 'Yes';
    this.messageObjs = this.data.message;
    if (this.data.type === AlertTypeEnum.ERROR) {
      if (undefined === this.data.message && undefined === this.data.titleMessage && this.messageObjs.length <= 0) {
        this.data.titleMessage = 'Please Check Server Connection';
      }
    }
  }

  onClose(dialogRes: any) {
    if (dialogRes && this.getInputs.some(input => !input.inputValue)) { return true; }
    this.store.dispatch(new RTLActions.CloseConfirmation(dialogRes));
  }
}
