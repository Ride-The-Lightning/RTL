import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import * as sha256 from 'sha256';

import { SelNodeChild, RTLConfiguration } from '../../../shared/models/RTLconfig';
import { CLNOnChainSendFunds } from '../../../shared/models/alertData';
import { GetInfo, Balance, OnChain, UTXO } from '../../../shared/models/clnModels';
import { CURRENCY_UNITS, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, ADDRESS_TYPES, FEE_RATE_TYPES, APICallStatusEnum, CLNActions, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLEffects } from '../../../store/rtl.effects';
import { RTLState } from '../../../store/rtl.state';
import { isAuthorized, openSnackBar } from '../../../store/rtl.actions';
import { setChannelTransaction } from '../../store/cln.actions';
import { rootAppConfig, rootSelectedNode } from '../../../store/rtl.selector';
import { clnNodeInformation, utxos } from '../../store/cln.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-cln-on-chain-send-modal',
  templateUrl: './on-chain-send-modal.component.html',
  styleUrls: ['./on-chain-send-modal.component.scss']
})
export class CLNOnChainSendModalComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  @ViewChild('formSweepAll', { static: false }) formSweepAll: any;
  @ViewChild('stepper', { static: false }) stepper: MatStepper;
  public faExclamationTriangle = faExclamationTriangle;
  public sweepAll = false;
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public addressTypes = [];
  public utxos: UTXO[] = [];
  public selUTXOs = [];
  public flgUseAllBalance = false;
  public totalSelectedUTXOAmount = null;
  public selectedAddress = ADDRESS_TYPES[1];
  public blockchainBalance: Balance = {};
  public information: GetInfo = {};
  public isCompatibleVersion = false;
  public newAddress = '';
  public transaction: OnChain = {};
  public feeRateTypes = FEE_RATE_TYPES;
  public selFeeRate = '';
  public customFeeRate = null;
  public flgMinConf = false;
  public minConfValue = null;
  public sendFundError = '';
  public fiatConversion = false;
  public amountUnits = CURRENCY_UNITS;
  public selAmountUnit = CURRENCY_UNITS[0];
  public currConvertorRate = {};
  public unitConversionValue = 0;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  public advancedTitle = 'Advanced Options';
  public flgValidated = false;
  public flgEditable = true;
  public passwordFormLabel = 'Authenticate with your RTL password';
  public sendFundFormLabel = 'Sweep funds';
  public confirmFormLabel = 'Confirm sweep';
  public amountError = 'Amount is Required.';
  passwordFormGroup: FormGroup;
  sendFundFormGroup: FormGroup;
  confirmFormGroup: FormGroup;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLNOnChainSendModalComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNOnChainSendFunds, private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions: Actions, private formBuilder: FormBuilder, private rtlEffects: RTLEffects, private snackBar: MatSnackBar) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.sweepAll = this.data.sweepAll;
    this.passwordFormGroup = this.formBuilder.group({
      hiddenPassword: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    this.sendFundFormGroup = this.formBuilder.group({
      transactionAddress: ['', Validators.required],
      selFeeRate: [null],
      customFeeRate: [null],
      flgMinConf: [false],
      minConfValue: [{ value: null, disabled: true }]
    });
    this.confirmFormGroup = this.formBuilder.group({});
    this.sendFundFormGroup.controls.flgMinConf.valueChanges.pipe(takeUntil(this.unSubs[0])).subscribe((flg) => {
      if (flg) {
        this.sendFundFormGroup.controls.selFeeRate.disable();
        this.sendFundFormGroup.controls.selFeeRate.setValue(null);
        this.sendFundFormGroup.controls.minConfValue.reset();
        this.sendFundFormGroup.controls.minConfValue.enable();
        this.sendFundFormGroup.controls.minConfValue.setValidators([Validators.required]);
        this.sendFundFormGroup.controls.minConfValue.setValue(null);
      } else {
        this.sendFundFormGroup.controls.selFeeRate.enable();
        this.sendFundFormGroup.controls.selFeeRate.setValue(null);
        this.sendFundFormGroup.controls.minConfValue.setValue(null);
        this.sendFundFormGroup.controls.minConfValue.disable();
        this.sendFundFormGroup.controls.minConfValue.setValidators(null);
        this.sendFundFormGroup.controls.minConfValue.setErrors(null);
      }
    });
    this.sendFundFormGroup.controls.selFeeRate.valueChanges.pipe(takeUntil(this.unSubs[1])).subscribe((feeRate) => {
      this.sendFundFormGroup.controls.customFeeRate.setValue(null);
      this.sendFundFormGroup.controls.customFeeRate.reset();
      if (feeRate === 'customperkb' && !this.sendFundFormGroup.controls.flgMinConf.value) {
        this.sendFundFormGroup.controls.customFeeRate.setValidators([Validators.required]);
      } else {
        this.sendFundFormGroup.controls.customFeeRate.setValidators(null);
      }
    });
    combineLatest([this.store.select(rootSelectedNode), this.store.select(rootAppConfig)]).pipe(takeUntil(this.unSubs[1])).
      subscribe(([selNode, appConfig]) => {
        this.fiatConversion = selNode.settings.fiatConversion;
        this.amountUnits = selNode.settings.currencyUnits;
        this.appConfig = appConfig;
      });
    this.store.select(clnNodeInformation).pipe(takeUntil(this.unSubs[2])).
      subscribe((nodeInfo: GetInfo) => {
        this.information = nodeInfo;
        this.isCompatibleVersion =
          this.commonService.isVersionCompatible(this.information.version, '0.9.0') &&
          this.commonService.isVersionCompatible(this.information.api_version, '0.4.0');
      });
    this.store.select(utxos).pipe(takeUntil(this.unSubs[3])).
      subscribe((utxosSeletor: { utxos: UTXO[], apiCallStatus: ApiCallStatusPayload }) => {
        this.utxos = this.commonService.sortAscByKey(utxosSeletor.utxos.filter((utxo) => utxo.status === 'confirmed'), 'value');
        this.logger.info(utxosSeletor);
      });
    this.actions.pipe(
      takeUntil(this.unSubs[4]),
      filter((action) => action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN || action.type === CLNActions.SET_CHANNEL_TRANSACTION_RES_CLN)).
      subscribe((action: any) => {
        if (action.type === CLNActions.SET_CHANNEL_TRANSACTION_RES_CLN) {
          this.store.dispatch(openSnackBar({ payload: 'Fund Sent Successfully!' }));
          this.dialogRef.close();
        }
        if (action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SetChannelTransaction') {
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
    this.rtlEffects.isAuthorizedRes.
      pipe(take(1)).
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
    this.sendFundError = '';
    if (this.flgUseAllBalance) {
      this.transaction.satoshis = 'all';
    }
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      this.transaction.utxos = [];
      this.selUTXOs.forEach((utxo) => this.transaction.utxos.push(utxo.txid + ':' + utxo.output));
    }
    if (this.sweepAll) {
      if (
        (!this.sendFundFormGroup.controls.transactionAddress.value || this.sendFundFormGroup.controls.transactionAddress.value === '') ||
        (this.sendFundFormGroup.controls.flgMinConf.value && (!this.sendFundFormGroup.controls.minConfValue.value || this.sendFundFormGroup.controls.minConfValue.value <= 0)) ||
        (this.selFeeRate === 'customperkb' && !this.flgMinConf && !this.customFeeRate)
      ) {
        return true;
      }
      this.transaction.satoshis = 'all';
      this.transaction.address = this.sendFundFormGroup.controls.transactionAddress.value;
      if (this.sendFundFormGroup.controls.flgMinConf.value) {
        delete this.transaction.feeRate;
        this.transaction.minconf = this.sendFundFormGroup.controls.flgMinConf.value ? this.sendFundFormGroup.controls.minConfValue.value : null;
      } else {
        delete this.transaction.minconf;
        this.transaction.feeRate = (this.sendFundFormGroup.controls.selFeeRate.value === 'customperkb' && !this.sendFundFormGroup.controls.flgMinConf.value && this.sendFundFormGroup.controls.customFeeRate.value) ? ((this.sendFundFormGroup.controls.customFeeRate.value * 1000) + 'perkb') : this.sendFundFormGroup.controls.selFeeRate.value;
      }
      delete this.transaction.utxos;
      this.store.dispatch(setChannelTransaction({ payload: this.transaction }));
    } else {
      this.transaction.minconf = this.flgMinConf ? this.minConfValue : null;
      this.transaction['feeRate'] = (this.selFeeRate === 'customperkb' && !this.flgMinConf && this.customFeeRate) ? (this.customFeeRate * 1000) + 'perkb' : this.selFeeRate;
      if ((!this.transaction.address || this.transaction.address === '') ||
        ((!this.transaction.satoshis || +this.transaction.satoshis <= 0)) ||
        (this.flgMinConf && (!this.transaction.minconf || this.transaction.minconf <= 0)) ||
        (this.selFeeRate === 'customperkb' && !this.flgMinConf && !this.customFeeRate)) {
        return true;
      }
      if (this.transaction.satoshis && this.transaction.satoshis !== 'all' && this.selAmountUnit !== CurrencyUnitEnum.SATS) {
        this.commonService.convertCurrency(+this.transaction.satoshis, this.selAmountUnit === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : this.selAmountUnit, CurrencyUnitEnum.SATS, this.amountUnits[2], this.fiatConversion).
          pipe(takeUntil(this.unSubs[5])).
          subscribe({
            next: (data) => {
              this.transaction.satoshis = data[CurrencyUnitEnum.SATS];
              this.selAmountUnit = CurrencyUnitEnum.SATS;
              this.store.dispatch(setChannelTransaction({ payload: this.transaction }));
            }, error: (err) => {
              this.transaction.satoshis = null;
              this.selAmountUnit = CurrencyUnitEnum.SATS;
              this.amountError = 'Conversion Error: ' + err;
            }
          });
      } else {
        this.store.dispatch(setChannelTransaction({ payload: this.transaction }));
      }
    }
  }

  resetData() {
    this.sendFundError = '';
    this.transaction = {};
    this.flgMinConf = false;
    this.totalSelectedUTXOAmount = null;
    this.selUTXOs = [];
    this.flgUseAllBalance = false;
    this.selAmountUnit = CURRENCY_UNITS[0];
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
        this.sendFundFormLabel = 'Sweep funds | Address: ' + this.sendFundFormGroup.controls.transactionAddress.value +
          (this.sendFundFormGroup.controls.flgMinConf.value ? (' | Min Confirmation Blocks: ' + this.sendFundFormGroup.controls.minConfValue.value) : (this.sendFundFormGroup.controls.selFeeRate.value ? (' | Fee Rate: ' +
            this.feeRateTypes.find((frType) => frType.feeRateId === this.sendFundFormGroup.controls.selFeeRate.value).feeRateType) : ''));
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

  onUTXOSelectionChange(event: any) {
    const utxoNew = { value: 0 };
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      this.totalSelectedUTXOAmount = this.selUTXOs.reduce((a, b) => {
        utxoNew.value = a.value + b.value;
        return utxoNew;
      }).value;
      if (this.flgUseAllBalance) {
        this.onUTXOAllBalanceChange();
      }
    } else {
      this.totalSelectedUTXOAmount = null;
      this.transaction.satoshis = null;
      this.flgUseAllBalance = false;
    }
  }

  onUTXOAllBalanceChange() {
    if (this.flgUseAllBalance) {
      this.transaction.satoshis = this.totalSelectedUTXOAmount;
      this.selAmountUnit = CURRENCY_UNITS[0];
    } else {
      this.transaction.satoshis = null;
    }
  }

  onAmountUnitChange(event: any) {
    const self = this;
    const prevSelectedUnit = (this.selAmountUnit === this.amountUnits[2]) ? CurrencyUnitEnum.OTHER : this.selAmountUnit;
    let currSelectedUnit = event.value === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : event.value;
    if (this.transaction.satoshis && this.selAmountUnit !== event.value) {
      this.commonService.convertCurrency(+this.transaction.satoshis, prevSelectedUnit, currSelectedUnit, this.amountUnits[2], this.fiatConversion).
        pipe(takeUntil(this.unSubs[6])).
        subscribe({
          next: (data) => {
            this.selAmountUnit = event.value;
            self.transaction.satoshis = self.decimalPipe.transform(data[currSelectedUnit], self.currencyUnitFormats[currSelectedUnit]).replace(/,/g, '');
          }, error: (err) => {
            self.transaction.satoshis = null;
            this.amountError = 'Conversion Error: ' + err;
            this.selAmountUnit = prevSelectedUnit;
            currSelectedUnit = prevSelectedUnit;
          }
        });
    }
  }

  onAdvancedPanelToggle(isClosed: boolean) {
    if (isClosed) {
      this.advancedTitle = (this.selUTXOs.length && this.selUTXOs.length > 0) ? 'Advanced Options | Selected UTXOs: ' + this.selUTXOs.length + ' | Selected UTXO Amount: ' + this.decimalPipe.transform(this.totalSelectedUTXOAmount) + ' Sats' : 'Advanced Options';
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
