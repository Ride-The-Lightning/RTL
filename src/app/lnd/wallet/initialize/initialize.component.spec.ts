import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { mockLNDEffects } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { LNDEffects } from '../../store/lnd.effects';
import { genSeed, initWallet } from '../../store/lnd.actions';
import { DEFAULT_RECOVERY_WINDOW, InitializeWalletComponent, MAX_RECOVERY_WINDOW } from './initialize.component';

describe('InitializeWalletComponent', () => {
  let component: InitializeWalletComponent;
  let fixture: ComponentFixture<InitializeWalletComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InitializeWalletComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        { provide: LNDEffects, useClass: mockLNDEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InitializeWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Issue #494: a wallet restored without a recovery window shows none of its on-chain funds.
  describe('recovery window', () => {
    const seed = Array.from({ length: 24 }, (_, i) => 'word' + i).join(',');
    let dispatchSpy: jasmine.Spy;
    const restore = () => {
      component.passwordFormGroup.setValue({ initWalletPassword: 'password123', initWalletConfirmPassword: 'password123' });
      component.cipherFormGroup.controls.existingCipher.setValue(true);
      component.cipherFormGroup.controls.cipherSeed.setValue(seed);
    };

    beforeEach(() => {
      dispatchSpy = spyOn(TestBed.inject(Store), 'dispatch');
    });

    it('is sent with its default when a wallet is restored from an existing seed', () => {
      restore();
      component.onInitWallet();
      expect(dispatchSpy.calls.allArgs().map(([action]) => action)).toEqual([
        initWallet({ payload: { pwd: window.btoa('password123'), cipher: seed.split(','), recoveryWindow: DEFAULT_RECOVERY_WINDOW } })
      ]);
    });

    it('is sent as entered, along with the passphrase', () => {
      restore();
      component.cipherFormGroup.controls.recoveryWindow.setValue(20000);
      component.passphraseFormGroup.controls.enterPassphrase.setValue(true);
      component.passphraseFormGroup.controls.passphrase.setValue('hunter2');
      component.onInitWallet();
      expect(dispatchSpy.calls.mostRecent().args[0]).toEqual(
        initWallet({ payload: { pwd: window.btoa('password123'), cipher: seed.split(','), passphrase: window.btoa('hunter2'), recoveryWindow: 20000 } })
      );
    });

    it('blocks initialization while it is not a whole number LND accepts', () => {
      restore();
      [null, '', -1, 1.5, MAX_RECOVERY_WINDOW + 1].forEach((value) => {
        component.cipherFormGroup.controls.recoveryWindow.setValue(value);
        component.onInitWallet();
      });
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('is not sent for a newly generated seed', () => {
      component.passwordFormGroup.setValue({ initWalletPassword: 'password123', initWalletConfirmPassword: 'password123' });
      component.onInitWallet();
      expect(dispatchSpy.calls.allArgs().map(([action]) => action)).toEqual([genSeed({ payload: '' })]);
    });

    it('shows its field only for an existing seed', () => {
      // The test page is served over http, which otherwise puts a warning in place of the steps,
      // and the mocked effects emit a response at once, which puts the result in their place.
      component.insecureLND = false;
      component.resetData();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input[name="cipherSeed"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('input[name="recoveryWindow"]')).toBeNull();
      component.cipherFormGroup.controls.existingCipher.setValue(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input[name="recoveryWindow"]').value).toBe(String(DEFAULT_RECOVERY_WINDOW));
      component.cipherFormGroup.controls.existingCipher.setValue(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input[name="recoveryWindow"]')).toBeNull();
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
