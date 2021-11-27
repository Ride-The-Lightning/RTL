import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { OnChainSendFunds } from '../../../shared/models/alertData';
import { SelNodeChild, RTLConfiguration } from '../../../shared/models/RTLconfig';
import { GetInfo, AddressType, BlockchainBalance } from '../../../shared/models/lndModels';
import { CURRENCY_UNITS, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, APICallStatusEnum, LNDActions } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import * as sha256 from 'sha256';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { isAuthorized, openSnackBar } from '../../../store/rtl.actions';
import { setChannelTransaction } from '../../store/lnd.actions';
import { rootAppConfig, rootSelectedNode } from '../../../store/rtl.selector';

@Component({
  selector: 'rtl-on-chain-send-modal',
  templateUrl: './on-chain-send-modal.component.html',
  styleUrls: ['./on-chain-send-modal.component.scss']
})
export class OnChainSendModalComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  @ViewChild('formSweepAll', { static: false }) formSweepAll: any;
  @ViewChild('stepper', { static: false }) stepper: MatStepper;
  public faExclamationTriangle = faExclamationTriangle;
  public sweepAll = false;
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public addressTypes = [];
  public selectedAddress: AddressType = {};
  public blockchainBalance: BlockchainBalance = {};
  public information: GetInfo = {};
  public newAddress = '';
  public transactionAddress = '';
  public transactionAmount = null;
  public transactionFees = null;
  public transactionBlocks = null;
  public transTypes = [{ id: '1', name: 'Target Confirmation Blocks' }, { id: '2', name: 'Fee' }];
  public selTransType = '1';
  public fiatConversion = false;
  public amountUnits = CURRENCY_UNITS;
  public selAmountUnit = CURRENCY_UNITS[0];
  public currConvertorRate = {};
  public unitConversionValue = 0;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  public sendFundError = '';
  public flgValidated = false;
  public flgEditable = true;
  public passwordFormLabel = 'Authenticate with your RTL password';
  public sendFundFormLabel = 'Sweep funds';
  public confirmFormLabel = 'Confirm sweep';
  public amountError = 'Amount is Required.';
  passwordFormGroup: FormGroup;
  sendFundFormGroup: FormGroup;
  confirmFormGroup: FormGroup;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<OnChainSendModalComponent>, @Inject(MAT_DIALOG_DATA) public data: OnChainSendFunds, private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService, private decimalPipe: DecimalPipe, private snackBar: MatSnackBar, private actions: Actions, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.sweepAll = this.data.sweepAll;
    this.passwordFormGroup = this.formBuilder.group({
      hiddenPassword: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    this.sendFundFormGroup = this.formBuilder.group({
      transactionAddress: ['', Validators.required],
      transactionBlocks: [null],
      transactionFees: [null],
      selTransType: ['1', Validators.required]
    });
    this.confirmFormGroup = this.formBuilder.group({});
    this.sendFundFormGroup.controls.selTransType.valueChanges.pipe(takeUntil(this.unSubs[0])).subscribe((transType) => {
      if (transType === '1') {
        this.sendFundFormGroup.controls.transactionBlocks.setValidators([Validators.required]);
        this.sendFundFormGroup.controls.transactionBlocks.setValue(null);
        this.sendFundFormGroup.controls.transactionFees.setValidators(null);
        this.sendFundFormGroup.controls.transactionFees.setValue(null);
      } else {
        this.sendFundFormGroup.controls.transactionBlocks.setValidators(null);
        this.sendFundFormGroup.controls.transactionBlocks.setValue(null);
        this.sendFundFormGroup.controls.transactionFees.setValidators([Validators.required]);
        this.sendFundFormGroup.controls.transactionFees.setValue(null);
      }
    });
    this.store.select(rootAppConfig).pipe(takeUntil(this.unSubs[1])).subscribe((appConfig) => {
      this.appConfig = appConfig;
    });
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[2])).subscribe((selNode) => {
      this.fiatConversion = selNode.settings.fiatConversion;
      this.amountUnits = selNode.settings.currencyUnits;
      this.logger.info(selNode);
    });
    this.actions.pipe(
      takeUntil(this.unSubs[3]),
      filter((action) => action.type === LNDActions.UPDATE_API_CALL_STATUS_LND || action.type === LNDActions.SET_CHANNEL_TRANSACTION_RES_LND)).
      subscribe((action: any) => {
        if (action.type === LNDActions.SET_CHANNEL_TRANSACTION_RES_LND) {
          this.store.dispatch(openSnackBar({ payload: (this.sweepAll ? 'All Funds Sent Successfully!' : 'Fund Sent Successfully!') }));
          this.dialogRef.close();
        }
        if (action.type === LNDActions.UPDATE_API_CALL_STATUS_LND && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SetChannelTransaction') {
          this.sendFundError = action.payload.message;
        }
      });
  }

  onAuthenticate(): boolean | void {
    if (!this.passwordFormGroup.controls.password.value) {
      return true;
    }
    this.flgValidated = false;
    this.store.dispatch(isAuthorized({ payload: sha256(this.passwordFormGroup.controls.password.value).toString() }));
    this.rtlEffects.isAuthorizedRes.pipe(take(1)).
      subscribe((authRes) => {
        if (authRes !== 'ERROR') {
          this.passwordFormGroup.controls.hiddenPassword.setValue(this.passwordFormGroup.controls.password.value);
          this.stepper.next();
        } else {
          this.dialogRef.close();
          this.snackBar.open('Unauthorized User. Logging out from RTL.');
        }
      });
  }

  onSendFunds(): boolean | void {
    if (this.invalidValues) {
      return true;
    }
    this.sendFundError = '';
    const postTransaction = {
      amount: this.transactionAmount ? this.transactionAmount : 0,
      sendAll: this.sweepAll
    };
    if (this.sweepAll) {
      postTransaction['address'] = this.sendFundFormGroup.controls.transactionAddress.value;
      if (this.sendFundFormGroup.controls.selTransType.value === '1') {
        postTransaction['blocks'] = this.sendFundFormGroup.controls.transactionBlocks.value;
      }
      if (this.sendFundFormGroup.controls.selTransType.value === '2') {
        postTransaction['fees'] = this.sendFundFormGroup.controls.transactionFees.value;
      }
    } else {
      postTransaction['address'] = this.transactionAddress;
      if (this.selTransType === '1') {
        postTransaction['blocks'] = this.transactionBlocks;
      }
      if (this.selTransType === '2') {
        postTransaction['fees'] = this.transactionFees;
      }
    }
    if (this.transactionAmount && this.selAmountUnit !== CurrencyUnitEnum.SATS) {
      this.commonService.convertCurrency(this.transactionAmount, this.selAmountUnit === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : this.selAmountUnit, CurrencyUnitEnum.SATS, this.amountUnits[2], this.fiatConversion).
        pipe(takeUntil(this.unSubs[4])).
        subscribe({
          next: (data) => {
            this.selAmountUnit = CurrencyUnitEnum.SATS;
            postTransaction.amount = +this.decimalPipe.transform(data[this.amountUnits[0]], this.currencyUnitFormats[this.amountUnits[0]]).replace(/,/g, '');
            this.store.dispatch(setChannelTransaction({ payload: postTransaction }));
          }, error: (err) => {
            this.transactionAmount = null;
            this.selAmountUnit = CurrencyUnitEnum.SATS;
            this.amountError = 'Conversion Error: ' + err;
          }
        });
    } else {
      this.store.dispatch(setChannelTransaction({ payload: postTransaction }));
    }
  }

  get invalidValues(): boolean {
    if (this.sweepAll) {
      return (!this.sendFundFormGroup.controls.transactionAddress.value || this.sendFundFormGroup.controls.transactionAddress.value === '') ||
        (this.sendFundFormGroup.controls.selTransType.value === '1' && (!this.sendFundFormGroup.controls.transactionBlocks.value || this.sendFundFormGroup.controls.transactionBlocks.value <= 0)) || (this.sendFundFormGroup.controls.selTransType.value === '2' && (!this.sendFundFormGroup.controls.transactionFees.value || this.sendFundFormGroup.controls.transactionFees.value <= 0));
    } else {
      return (!this.transactionAddress || this.transactionAddress === '') || (!this.transactionAmount || this.transactionAmount <= 0) ||
        (this.selTransType === '1' && (!this.transactionBlocks || this.transactionBlocks <= 0)) || (this.selTransType === '2' && (!this.transactionFees || this.transactionFees <= 0));
    }
  }

  resetData() {
    this.sendFundError = '';
    this.selTransType = '1';
    this.transactionAddress = '';
    this.transactionBlocks = null;
    this.transactionFees = null;
    if (!this.sweepAll) {
      this.transactionAmount = null;
    }
  }

  stepSelectionChanged(event: any) {
    this.sendFundError = '';
    switch (event.selectedIndex) {
      case 0:
        this.passwordFormLabel = 'Authenticate with your RTL password';
        this.sendFundFormLabel = 'Sweep funds';
        break;

      case 1:
        this.passwordFormLabel = 'User authenticated successfully';
        this.sendFundFormLabel = 'Sweep funds';
        break;

      case 2:
        this.passwordFormLabel = 'User authenticated successfully';
        this.sendFundFormLabel = 'Sweep funds | Address: ' + this.sendFundFormGroup.controls.transactionAddress.value + ' | ' +
          this.transTypes[this.sendFundFormGroup.controls.selTransType.value - 1].name +
          (this.sendFundFormGroup.controls.selTransType.value === '2' ? ' (Sats/vByte)' : '') + ': ' +
          (this.sendFundFormGroup.controls.selTransType.value === '1' ? this.sendFundFormGroup.controls.transactionBlocks.value : this.sendFundFormGroup.controls.transactionFees.value);
        break;

      default:
        this.passwordFormLabel = 'Authenticate with your RTL password';
        this.sendFundFormLabel = 'Sweep funds';
        break;
    }
    if (event.selectedIndex < event.previouslySelectedIndex) {
      if (event.selectedIndex === 0) {
        this.passwordFormGroup.controls.hiddenPassword.setValue('');
      }
    }
  }

  onAmountUnitChange(event: any) {
    const self = this;
    const prevSelectedUnit = (this.sweepAll) ? CurrencyUnitEnum.SATS : (this.selAmountUnit === this.amountUnits[2]) ? CurrencyUnitEnum.OTHER : this.selAmountUnit;
    let currSelectedUnit = event.value === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : event.value;
    if (this.transactionAmount && this.selAmountUnit !== event.value) {
      const amount = this.transactionAmount ? this.transactionAmount : 0;
      this.commonService.convertCurrency(amount, prevSelectedUnit, currSelectedUnit, this.amountUnits[2], this.fiatConversion).
        pipe(takeUntil(this.unSubs[5])).
        subscribe({
          next: (data) => {
            this.selAmountUnit = event.value;
            self.transactionAmount = +self.decimalPipe.transform(data[currSelectedUnit], self.currencyUnitFormats[currSelectedUnit]).replace(/,/g, '');
          }, error: (err) => {
            self.transactionAmount = null;
            this.amountError = 'Conversion Error: ' + err;
            this.selAmountUnit = prevSelectedUnit;
            currSelectedUnit = prevSelectedUnit;
          }
        });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
