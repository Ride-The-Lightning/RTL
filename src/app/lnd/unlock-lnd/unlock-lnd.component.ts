import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatStepper } from '@angular/material';

import { LNDEffects } from '../store/lnd.effects';
import { RTLEffects } from '../../store/rtl.effects';
import * as LNDActions from '../store/lnd.actions';
import * as RTLActions from '../../store/rtl.actions';
import * as fromApp from '../../store/rtl.reducers';

export const matchedPasswords: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const initWalletPassword = control.get('initWalletPassword');
  const initWalletConfirmPassword = control.get('initWalletConfirmPassword');
  return initWalletPassword && initWalletConfirmPassword && initWalletPassword.value !== initWalletConfirmPassword.value ? { 'unmatchedPasswords': true } : null;
};

export const cipherSeedLength: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const existingCipher = control.get('existingCipher');
  const cipherSeed = control.get('cipherSeed');
  const cipherArr = cipherSeed.value.toString().trim().split(',');
  return existingCipher.value && cipherArr && cipherArr.length !== 24 ? { 'invalidCipher': true } : null;
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
  @ViewChild(MatStepper, { static: true }) stepper: MatStepper;
  public insecureLND = false;
  public genSeedResponse = [];
  public initWalletResponse = '';
  walletOperation = 'unlock';
  walletPassword = '';
  passwordFormGroup: FormGroup;
  cipherFormGroup: FormGroup;
  passphraseFormGroup: FormGroup;
  proceed = true;
  warnRes = true;
  private unsubs = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromApp.AppState>, private formBuilder: FormBuilder, private rtlEffects: RTLEffects,
    private lndEffects: LNDEffects, private router: Router) {}

  ngOnInit() {
    this.walletPassword = '';
    this.passwordFormGroup = this.formBuilder.group({
      initWalletPassword: ['', [Validators.required, Validators.minLength(8)]],
      initWalletConfirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    }, {validators: matchedPasswords});
    this.cipherFormGroup = this.formBuilder.group({
      existingCipher: [false],
      cipherSeed: [{value: '', disabled: true}]
    }, {validators: cipherSeedLength});
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

    this.insecureLND = !window.location.protocol.includes('https://');

    this.lndEffects.initWalletRes
    .pipe(takeUntil(this.unsubs[2]))
    .subscribe(initWalletResponse => {
      this.initWalletResponse = initWalletResponse;
    });

    this.lndEffects.genSeedResponse
    .pipe(takeUntil(this.unsubs[3]))
    .subscribe(genSeedRes => {
      this.genSeedResponse = genSeedRes;
      // if (this.passphraseFormGroup.controls.enterPassphrase.value) {
      //   this.store.dispatch(new RTLActions.InitWallet({
      //     pwd: window.btoa(this.passwordFormGroup.controls.initWalletPassword.value),
      //     cipher: this.genSeedResponse,
      //     passphrase: window.btoa(this.passphraseFormGroup.controls.passphrase.value)
      //   }));
      // } else {
        this.store.dispatch(new LNDActions.InitWallet({
          pwd: window.btoa(this.passwordFormGroup.controls.initWalletPassword.value),
          cipher: this.genSeedResponse
        }));
      // }
    });

  }

  onOperateWallet() {
    this.store.dispatch(new RTLActions.OpenSpinner('Unlocking...'));
    this.store.dispatch(new LNDActions.UnlockWallet({pwd: window.btoa(this.walletPassword)}));
  }

  onInitWallet() {
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
      this.store.dispatch(new RTLActions.InitAppData());
      this.router.navigate(['/']);
    }, 1000 * 1);
  }

  resetData() {
    this.walletOperation = 'unlock';
    this.walletPassword = '';
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
