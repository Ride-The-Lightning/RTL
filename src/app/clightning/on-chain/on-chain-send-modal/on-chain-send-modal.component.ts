import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatVerticalStepper } from '@angular/material/stepper';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild, GetInfoRoot } from '../../../shared/models/RTLconfig';
import { CLOnChainSendFunds } from '../../../shared/models/alertData';
import { GetInfo, Balance, OnChain, UTXO } from '../../../shared/models/clModels';
import { CURRENCY_UNITS, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, ADDRESS_TYPES, FEE_RATE_TYPES } from '../../../shared/services/consts-enums-functions';
import { RTLConfiguration } from '../../../shared/models/RTLconfig';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLEffects } from '../../../store/rtl.effects';

import * as CLActions from '../../store/cl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as sha256 from 'sha256';

@Component({
  selector: 'rtl-cl-on-chain-send-modal',
  templateUrl: './on-chain-send-modal.component.html',
  styleUrls: ['./on-chain-send-modal.component.scss']
})
export class CLOnChainSendModalComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true }) form: any;  
  @ViewChild('formSweepAll', { static: false }) formSweepAll: any;  
  @ViewChild('stepper', { static: false }) stepper: MatVerticalStepper;
  public faExclamationTriangle = faExclamationTriangle;
  public sweepAll = false;
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public nodeData: GetInfoRoot;
  public addressTypes = [];
  public utxos: UTXO[] = [];
  public selUTXOs = [];
  public flgUseAllBalance = false;
  public totalSelectedUTXOAmount = null;
  public flgLoadingWallet: Boolean | 'error' = true;
  public selectedAddress = ADDRESS_TYPES[1];
  public blockchainBalance: Balance = {};
  public information: GetInfo = {};
  public isCompatibleVersion = false;
  public newAddress = '';
  public transaction: OnChain = {};
  public feeRateTypes = FEE_RATE_TYPES;
  public flgMinConf = false;
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
  passwordFormGroup: FormGroup;
  sendFundFormGroup: FormGroup;  
  confirmFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLOnChainSendModalComponent>, @Inject(MAT_DIALOG_DATA) public data: CLOnChainSendFunds, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions$: Actions, private formBuilder: FormBuilder, private rtlEffects: RTLEffects, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.sweepAll = this.data.sweepAll;
    this.passwordFormGroup = this.formBuilder.group({
      hiddenPassword: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    this.sendFundFormGroup = this.formBuilder.group({
      transactionAddress: ['', Validators.required],
      transactionFeeRate: [null],
      flgMinConf: [false],
      transactionBlocks: [{value: null, disabled: true}]
    });
    this.confirmFormGroup = this.formBuilder.group({}); 
    this.sendFundFormGroup.controls.flgMinConf.valueChanges.pipe(takeUntil(this.unSubs[4])).subscribe(flg => {
      if (flg) {
        this.sendFundFormGroup.controls.transactionBlocks.enable();
        this.sendFundFormGroup.controls.transactionBlocks.setValidators([Validators.required]);
        this.sendFundFormGroup.controls.transactionBlocks.setValue(null);
        this.sendFundFormGroup.controls.transactionFeeRate.disable();
        this.sendFundFormGroup.controls.transactionFeeRate.setValue(null);
      } else {
        this.sendFundFormGroup.controls.transactionBlocks.disable();
        this.sendFundFormGroup.controls.transactionBlocks.setValidators(null);
        this.sendFundFormGroup.controls.transactionBlocks.setValue(null);
        this.sendFundFormGroup.controls.transactionBlocks.setErrors(null);
        this.sendFundFormGroup.controls.transactionFeeRate.enable();
        this.sendFundFormGroup.controls.transactionFeeRate.setValue(null);
      }
    });
    combineLatest(
      this.store.select('root'),
      this.store.select('cl'))
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(([rootStore, rtlStore]) => {
      this.fiatConversion = rootStore.selNode.settings.fiatConversion;
      this.amountUnits = rootStore.selNode.settings.currencyUnits;
      this.appConfig = rootStore.appConfig;
      this.nodeData = rootStore.nodeData;
      this.information = rtlStore.information;
      this.isCompatibleVersion = 
        this.commonService.isVersionCompatible(this.information.version, '0.9.0')
        && this.commonService.isVersionCompatible(this.information.api_version, '0.4.0');
      this.utxos = this.commonService.sortAscByKey(rtlStore.utxos.filter(utxo => utxo.status === 'confirmed'), 'value');
      this.logger.info(rootStore);
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === CLActions.EFFECT_ERROR_CL || action.type === CLActions.SET_CHANNEL_TRANSACTION_RES_CL))
    .subscribe((action: CLActions.EffectError | CLActions.SetChannelTransactionRes) => {
      if (action.type === CLActions.SET_CHANNEL_TRANSACTION_RES_CL) {
        this.store.dispatch(new RTLActions.OpenSnackBar('Fund Sent Successfully!'));
        this.dialogRef.close();
      }    
      if (action.type === CLActions.EFFECT_ERROR_CL && action.payload.action === 'SetChannelTransaction') {
        this.sendFundError = action.payload.message;
      }
    });

  }

  onAuthenticate():boolean|void {
    if (!this.passwordFormGroup.controls.password.value) { return true; }
    this.flgValidated = false;
    this.store.dispatch(new RTLActions.IsAuthorized(sha256(this.passwordFormGroup.controls.password.value)));
    this.rtlEffects.isAuthorizedRes
    .pipe(take(1))
    .subscribe(authRes => {
      if (authRes !== 'ERROR') {
        this.passwordFormGroup.controls.hiddenPassword.setValue(this.passwordFormGroup.controls.password.value);
        this.stepper.next();
      } else {
        this.dialogRef.close();
        this.snackBar.open('Unauthorized User. Logging out from RTL.');
      }
    });
  }

  onSendFunds():boolean|void {
    if(this.invalidValues) { return true; }
    this.sendFundError = '';
    if (this.flgUseAllBalance) {
      this.transaction.satoshis = 'all';
    }
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      this.transaction.utxos = [];
      this.selUTXOs.forEach(utxo => this.transaction.utxos.push(utxo.txid + ':' + utxo.output));
    }
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Funds...'));
    if (this.sweepAll) {
      this.transaction.satoshis = 'all';
      this.transaction.address = this.sendFundFormGroup.controls.transactionAddress.value;
      if (this.sendFundFormGroup.controls.flgMinConf.value) {
        delete this.transaction.feeRate;
        this.transaction.minconf = this.sendFundFormGroup.controls.transactionBlocks.value;
      } else {
        delete this.transaction.minconf;
        if (this.sendFundFormGroup.controls.transactionFeeRate.value) {
          this.transaction.feeRate = this.sendFundFormGroup.controls.transactionFeeRate.value;
        } else {
          delete this.transaction.feeRate;
        }
      }
      delete this.transaction.utxos;
      this.store.dispatch(new CLActions.SetChannelTransaction(this.transaction));
    } else {
      if(this.transaction.satoshis && this.transaction.satoshis !== 'all' && this.selAmountUnit !== CurrencyUnitEnum.SATS) {
        this.commonService.convertCurrency(+this.transaction.satoshis, this.selAmountUnit === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : this.selAmountUnit, this.amountUnits[2], this.fiatConversion)
        .pipe(takeUntil(this.unSubs[2]))
        .subscribe(data => {
          this.transaction.satoshis = data[CurrencyUnitEnum.SATS];
          this.selAmountUnit = CurrencyUnitEnum.SATS;
          this.store.dispatch(new CLActions.SetChannelTransaction(this.transaction));
        });
      } else {
        this.store.dispatch(new CLActions.SetChannelTransaction(this.transaction));
      }
    }
  }

  get invalidValues(): boolean {
    if (this.sweepAll) {
      return (!this.sendFundFormGroup.controls.transactionAddress.value || this.sendFundFormGroup.controls.transactionAddress.value === '') || (this.sendFundFormGroup.controls.flgMinConf.value && (!this.sendFundFormGroup.controls.transactionBlocks.value || this.sendFundFormGroup.controls.transactionBlocks.value <= 0));
    } else {
      return (!this.transaction.address || this.transaction.address === '')
        || ((!this.transaction.satoshis || +this.transaction.satoshis <= 0))
        || (this.flgMinConf && (!this.transaction.minconf || this.transaction.minconf <= 0));
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
        this.sendFundFormLabel = 'Sweep funds'
        break;
    
      case 1:
        this.passwordFormLabel = 'User authenticated successfully';
        this.sendFundFormLabel = 'Sweep funds'
        break;

      case 2:
        this.passwordFormLabel = 'User authenticated successfully';
        this.sendFundFormLabel = 'Sweep funds | Address: ' + this.sendFundFormGroup.controls.transactionAddress.value + (this.sendFundFormGroup.controls.flgMinConf.value ? (' | Min Confirmation Blocks: ' + this.sendFundFormGroup.controls.transactionBlocks.value) : (this.sendFundFormGroup.controls.transactionFeeRate.value ? (' | Fee Rate: ' + this.feeRateTypes.find(frType => frType.feeRateId === this.sendFundFormGroup.controls.transactionFeeRate.value).feeRateType) : ''));
        break;

      default:
        this.passwordFormLabel = 'Authenticate with your RTL password';
        this.sendFundFormLabel = 'Sweep funds'
        break;
    }
    if (event.selectedIndex < event.previouslySelectedIndex) {
      if (event.selectedIndex === 0) {
        this.passwordFormGroup.controls.hiddenPassword.setValue('');
      }
    }    
  }

  onUTXOSelectionChange(event: any) {
    let utxoNew = {value: 0}; 
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      this.totalSelectedUTXOAmount = this.selUTXOs.reduce((a, b) => {utxoNew.value = a.value + b.value; return utxoNew;}).value;
      if (this.flgUseAllBalance) { this.onUTXOAllBalanceChange(); }
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
    let self = this;
    let prevSelectedUnit = (this.selAmountUnit === this.amountUnits[2]) ? CurrencyUnitEnum.OTHER : this.selAmountUnit;
    let currSelectedUnit = event.value === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : event.value;
    if(this.transaction.satoshis && this.selAmountUnit !== event.value) {
      this.commonService.convertCurrency(+this.transaction.satoshis, prevSelectedUnit, this.amountUnits[2], this.fiatConversion)
      .pipe(takeUntil(this.unSubs[3]))
      .subscribe(data => {
        self.transaction.satoshis = self.decimalPipe.transform(data[currSelectedUnit], self.currencyUnitFormats[currSelectedUnit]).replace(/,/g, '');
      });
    }
    this.selAmountUnit = event.value;
  }  

  onAdvancedPanelToggle(isClosed: boolean) {
    if (isClosed) {
      this.advancedTitle = (this.selUTXOs.length && this.selUTXOs.length > 0) ? 'Advanced Options | Selected UTXOs: ' + this.selUTXOs.length + ' | Selected UTXO Amount: ' + this.decimalPipe.transform(this.totalSelectedUTXOAmount) + ' Sats' : 'Advanced Options';
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
