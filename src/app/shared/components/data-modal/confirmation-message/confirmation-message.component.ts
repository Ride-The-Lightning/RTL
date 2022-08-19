import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../../services/logger.service';
import { InputData, ConfirmationData } from '../../../models/alertData';
import { AlertTypeEnum, DataTypeEnum } from '../../../services/consts-enums-functions';

import { RTLState } from '../../../../store/rtl.state';
import { closeConfirmation } from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-confirmation-message',
  templateUrl: './confirmation-message.component.html',
  styleUrls: ['./confirmation-message.component.scss']
})
export class ConfirmationMessageComponent implements OnInit {

  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public informationMessage = '';
  public warningMessage = '';
  public noBtnText = 'No';
  public yesBtnText = 'Yes';
  public messageObjs = [];
  public flgShowInput = false;
  public hasAdvanced = false;
  public alertTypeEnum = AlertTypeEnum;
  public dataTypeEnum = DataTypeEnum;
  public getInputs: Array<InputData> = [{ placeholder: '', inputType: 'text', inputValue: '', hintText: '', hintFunction: null, advancedField: false }];

  private showAdvanced = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationMessageComponent>, @Inject(MAT_DIALOG_DATA) public data: ConfirmationData, private logger: LoggerService,
    private store: Store<RTLState>
  ) { }

  ngOnInit() {
    this.informationMessage = this.data.informationMessage || 'Info';
    this.warningMessage = this.data.warningMessage || 'Warn';
    this.flgShowInput = !!this.data.flgShowInput;
    this.getInputs = this.data.getInputs || [];
    this.noBtnText = (this.data.noBtnText) ? this.data.noBtnText : 'No';
    this.yesBtnText = (this.data.yesBtnText) ? this.data.yesBtnText : 'Yes';
    this.hasAdvanced = (this.data.hasAdvanced) ? this.data.hasAdvanced : false;
    this.messageObjs = this.data.message;
    if (this.data.type === AlertTypeEnum.ERROR) {
      if (!this.data.message && !this.data.titleMessage && this.messageObjs.length <= 0) {
        this.data.titleMessage = 'Please Check Server Connection';
      }
    }
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }

  onClose(dialogRes: any): boolean | any[] | void {
    if (dialogRes && this.getInputs && this.getInputs.some((input) => typeof input.inputValue === 'undefined')) {
      return true;
    }
    if (!this.showAdvanced && dialogRes.length) {
      dialogRes = dialogRes?.reduce((accumulator, current) => {
        if (!current.advancedField) {
          accumulator.push(current);
        }
        return accumulator;
      }, []);
    }
    this.store.dispatch(closeConfirmation({ payload: dialogRes }));
  }

}
