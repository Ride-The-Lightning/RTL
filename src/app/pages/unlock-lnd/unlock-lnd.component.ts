import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatStepper } from '@angular/material';

import * as RTLActions from '../../shared/store/rtl.actions';
import * as fromRTLReducer from '../../shared/store/rtl.reducers';

export const matchedPasswords: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const initWalletPassword = control.get('initWalletPassword');
  const initWalletConfirmPassword = control.get('initWalletConfirmPassword');
  return initWalletPassword && initWalletConfirmPassword && initWalletPassword.value !== initWalletConfirmPassword.value ? { 'unmatchedPasswords': true } : null;
};

@Component({
  selector: 'rtl-unlock-lnd',
  templateUrl: './unlock-lnd.component.html',
  styleUrls: ['./unlock-lnd.component.scss'],
  providers: [{
    provide: STEPPER_GLOBAL_OPTIONS, useValue: {displayDefaultIndicatorType: false}
  }]
})
export class UnlockLNDComponent implements OnInit, OnDestroy {
  @ViewChild(MatStepper) stepper: MatStepper;
  public insecureLND = false;
  walletOperation = 'init';
  walletPassword = '';
  passwordFormGroup: FormGroup;
  cipherFormGroup: FormGroup;
  passphraseFormGroup: FormGroup;
  private unsubs = [new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.State>, private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.walletPassword = '';
    // this.passwordFormGroup = this.formBuilder.group({
    //   initWalletPassword: ['', [Validators.required, Validators.minLength(8)]],
    //   initWalletConfirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    // }, {updateOn: 'blur', validators: matchedPasswords});
    this.passwordFormGroup = this.formBuilder.group({
      initWalletPassword: ['', [Validators.required, Validators.minLength(8)]],
      initWalletConfirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    }, {validators: matchedPasswords});
    this.cipherFormGroup = this.formBuilder.group({
      existingCipher: [false],
      cipherSeed: [{value: '', disabled: true}]
    });
    this.passphraseFormGroup = this.formBuilder.group({
      enterPassphrase: [false],
      passphrase: [{value: '', disabled: true}]
    });

    this.cipherFormGroup.controls.existingCipher.valueChanges.pipe(takeUntil(this.unsubs[0])).subscribe(checked => {
      if (checked) {
        this.cipherFormGroup.controls.cipherSeed.setValue('');
        this.cipherFormGroup.controls.cipherSeed.enable();
      } else {
        this.cipherFormGroup.controls.cipherSeed.setValue('');
        this.cipherFormGroup.controls.cipherSeed.disable();
      }
    });

    this.passphraseFormGroup.controls.enterPassphrase.valueChanges.pipe(takeUntil(this.unsubs[1])).subscribe(checked => {
      if (checked) {
        this.passphraseFormGroup.controls.passphrase.setValue('');
        this.passphraseFormGroup.controls.passphrase.enable();
      } else {
        this.passphraseFormGroup.controls.passphrase.setValue('');
        this.passphraseFormGroup.controls.passphrase.disable();
      }
    });

    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsubs[2]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      if (rtlStore.selNode.settings.lndServerUrl) {
        this.insecureLND = rtlStore.selNode.settings.lndServerUrl.includes('https://');
      }
    });

  }

  onOperateWallet() {
    this.store.dispatch(new RTLActions.OpenSpinner('Unlocking...'));
    this.store.dispatch(new RTLActions.OperateWallet({operation: 'unlock', pwd: this.walletPassword}));
  }

  onInitWallet() {
    this.store.dispatch(new RTLActions.OpenSpinner('Initializing...'));
    // this.store.dispatch(new RTLActions.OperateWallet({operation: 'init', pwd: this.initWalletPassword}));
  }

  resetData() {
    this.walletOperation = 'init';
    this.walletPassword = '';
    this.stepper.reset();
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
