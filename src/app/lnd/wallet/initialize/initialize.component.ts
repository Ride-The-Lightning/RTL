import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatStepper } from '@angular/material/stepper';

import { LNDEffects } from '../../store/lnd.effects';
import * as LNDActions from '../../store/lnd.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

export const matchedPasswords: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const initWalletPassword = control.get('initWalletPassword');
  const initWalletConfirmPassword = control.get('initWalletConfirmPassword');
  return initWalletPassword && initWalletConfirmPassword && initWalletPassword.value !== initWalletConfirmPassword.value ? { 'unmatchedPasswords': true } : null;
};

export const cipherSeedLength: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const cipherArr = control.value ? control.value.toString().trim().split(',') : [];
  return cipherArr && cipherArr.length !== 24 ? { 'invalidCipher': true } : null;
};

@Component({
  selector: 'rtl-initialize-wallet',
  templateUrl: './initialize.component.html',
  styleUrls: ['./initialize.component.scss'],
  providers: [{
    provide: STEPPER_GLOBAL_OPTIONS, useValue: {displayDefaultIndicatorType: false}
  }]
})
export class InitializeWalletComponent implements OnInit, OnDestroy {
  @ViewChild(MatStepper, { static: false }) stepper: MatStepper;
  public insecureLND = false;
  public genSeedResponse = [];
  public initWalletResponse = '';
  passwordFormGroup: FormGroup;
  cipherFormGroup: FormGroup;
  passphraseFormGroup: FormGroup;
  proceed = true;
  warnRes = false;
  private unsubs = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private formBuilder: FormBuilder, private lndEffects: LNDEffects, private router: Router) {}

  ngOnInit() {
    this.passwordFormGroup = this.formBuilder.group({
      initWalletPassword: ['', [Validators.required, Validators.minLength(8)]],
      initWalletConfirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    }, {validators: matchedPasswords});
    this.cipherFormGroup = this.formBuilder.group({
      existingCipher: [false],
      cipherSeed: [{value: '', disabled: true}, [cipherSeedLength]]
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

    this.insecureLND = !window.location.protocol.includes('https:');

    this.lndEffects.initWalletRes
    .pipe(takeUntil(this.unsubs[2]))
    .subscribe(initWalletResponse => {
      this.initWalletResponse = initWalletResponse;
    });

    this.lndEffects.genSeedResponse
    .pipe(takeUntil(this.unsubs[3]))
    .subscribe(genSeedRes => {
      this.genSeedResponse = genSeedRes;
      if (this.passphraseFormGroup.controls.enterPassphrase.value) {
        this.store.dispatch(new LNDActions.InitWallet({
          pwd: window.btoa(this.passwordFormGroup.controls.initWalletPassword.value),
          cipher: this.genSeedResponse,
          passphrase: window.btoa(this.passphraseFormGroup.controls.passphrase.value)
        }));
      } else {
        this.store.dispatch(new LNDActions.InitWallet({
          pwd: window.btoa(this.passwordFormGroup.controls.initWalletPassword.value),
          cipher: this.genSeedResponse
        }));
      }
    });

  }

  onInitWallet():boolean|void {
    if (this.passwordFormGroup.invalid || this.cipherFormGroup.invalid || this.passphraseFormGroup.invalid) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Initializing...'));
    if (this.cipherFormGroup.controls.existingCipher.value) {
      const cipherArr = this.cipherFormGroup.controls.cipherSeed.value.toString().trim().split(',');
      if (this.passphraseFormGroup.controls.enterPassphrase.value) {
        this.store.dispatch(new LNDActions.InitWallet({
          pwd: window.btoa(this.passwordFormGroup.controls.initWalletPassword.value),
          cipher: cipherArr,
          passphrase: window.btoa(this.passphraseFormGroup.controls.passphrase.value)
        }));
      } else {
        this.store.dispatch(new LNDActions.InitWallet({
          pwd: window.btoa(this.passwordFormGroup.controls.initWalletPassword.value),
          cipher: cipherArr
        }));
      }
    } else {
      if (this.passphraseFormGroup.controls.enterPassphrase.value) {
        this.store.dispatch(new LNDActions.GenSeed(window.btoa(this.passphraseFormGroup.controls.passphrase.value)));
      } else {
        this.store.dispatch(new LNDActions.GenSeed(''));
      }
    }
  }

  onGoToHome() {
    setTimeout(() => {
      this.store.dispatch(new RTLActions.UpdateSelectedNodeOptions());
      this.store.dispatch(new LNDActions.FetchInfo({loadPage:'HOME'}));
    }, 1000 * 1);
  }

  resetData() {
    this.genSeedResponse = [];
    this.initWalletResponse = '';
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
