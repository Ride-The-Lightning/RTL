import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { SharedModule } from '../../../shared/shared.module';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLConnectPeerComponent } from './connect-peer.component';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../shared/services/test-consts';
import { ECLEffects } from '../../../eclair/store/ecl.effects';
import { CLEffects } from '../../store/cl.effects';
import { LNDEffects } from '../../../lnd/store/lnd.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import { EffectsModule } from '@ngrx/effects';

describe('CLConnectPeerComponent', () => {
  let component: CLConnectPeerComponent;
  let fixture: ComponentFixture<CLConnectPeerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLConnectPeerComponent ],
      imports: [ SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [ 
        LoggerService, FormBuilder,
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {alertTitle: '', titleMessage: '', message: {}, newlyAdded: true}}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLConnectPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
