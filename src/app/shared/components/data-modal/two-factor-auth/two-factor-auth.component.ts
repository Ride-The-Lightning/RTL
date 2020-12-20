import { Component, OnInit, OnDestroy, Inject, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatVerticalStepper } from '@angular/material/stepper';
import { faInfoCircle, faCopy, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { authenticator } from 'otplib';
import * as sha256 from 'sha256';

import { RTLConfiguration } from '../../../models/RTLconfig';
import { AuthConfig } from '../../../models/alertData';

import { RTLEffects } from '../../../../store/rtl.effects';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-two-factor-auth',
  templateUrl: './two-factor-auth.component.html',
  styleUrls: ['./two-factor-auth.component.scss']
})
export class TwoFactorAuthComponent implements OnInit, OnDestroy {
  @ViewChild('stepper', { static: false }) stepper: MatVerticalStepper;
  public faExclamationTriangle = faExclamationTriangle;
  public faCopy = faCopy;
  public faInfoCircle = faInfoCircle;
  public flgValidated = false;
  public isTokenValid = true;
  public otpauth: string;
  public appConfig: RTLConfiguration;
  public flgEditable = true;
  public showDisableStepper = false;
  public passwordFormLabel = 'Authenticate with your RTL password';
  public secretFormLabel = 'Scan or copy the secret';
  public tokenFormLabel = 'Verify your authentication is working';
  public disableFormLabel = 'Disable two factor authentication';
  passwordFormGroup: FormGroup = this.formBuilder.group({
    hiddenPassword: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });
  secretFormGroup: FormGroup = this.formBuilder.group({
    secret: [{value: '', disabled: true}, Validators.required]
  });
  tokenFormGroup: FormGroup = this.formBuilder.group({
    token: ['', Validators.required]      
  });
  disableFormGroup: FormGroup = this.formBuilder.group({});
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<TwoFactorAuthComponent>, @Inject(MAT_DIALOG_DATA) public data: AuthConfig, private store: Store<fromRTLReducer.RTLState>, private formBuilder: FormBuilder, private rtlEffects: RTLEffects, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.appConfig = this.data.appConfig;
    this.showDisableStepper = !!this.appConfig.enable2FA;
    this.secretFormGroup =  this.formBuilder.group({
      secret: [{value: !this.appConfig.enable2FA ? this.generateSecret() : '', disabled: true}, Validators.required]
    });
  }

  generateSecret() {
    let secret2fa = authenticator.generateSecret();
    this.otpauth = authenticator.keyuri('', 'Ride The Lightning (RTL)', secret2fa);
    return secret2fa;
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

  onCopySecret(payload: string) {
    this.snackBar.open('Secret code ' + this.secretFormGroup.controls.secret.value + ' copied.');
  }

  onVerifyToken():boolean|void {
    if (this.appConfig.enable2FA) {
      this.store.dispatch(new RTLActions.OpenSpinner('Updating Settings...'));
      this.store.dispatch(new RTLActions.TwoFASaveSettings({secret2fa: ''}));
      this.generateSecret();
      this.isTokenValid = true;
    } else {
      if (!this.tokenFormGroup.controls.token.value) { return true; }
      this.isTokenValid = authenticator.check(this.tokenFormGroup.controls.token.value, this.secretFormGroup.controls.secret.value);
      if (!this.isTokenValid) {
        this.tokenFormGroup.controls.token.setErrors({ notValid: true });
        return true;
      }
      this.store.dispatch(new RTLActions.OpenSpinner('Updating Settings...'));
      this.store.dispatch(new RTLActions.TwoFASaveSettings({secret2fa: this.secretFormGroup.controls.secret.value}));
      this.tokenFormGroup.controls.token.setValue('');
    }
    this.flgValidated = true;
    this.appConfig.enable2FA = !this.appConfig.enable2FA;
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 0:
        this.passwordFormLabel = 'Authenticate with your RTL password';
        break;
    
      case 1:
        this.passwordFormLabel = 'User authenticated successfully';
        break;

      case 2:
        this.passwordFormLabel = 'User authenticated successfully';
        break;

      default:
        this.passwordFormLabel = 'Authenticate with your RTL password';
        break;
    }
    if (event.selectedIndex < event.previouslySelectedIndex) {
      if (event.selectedIndex === 0) {
        this.passwordFormGroup.controls.hiddenPassword.setValue('');
      }
    }    
  }

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
