import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLOnChainSendModalComponent } from './on-chain-send-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { mockCLEffects, mockCommonService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../shared/services/test-consts';
import { RTLEffects } from '../../../store/rtl.effects';
import { LNDEffects } from '../../../lnd/store/lnd.effects';
import { CLEffects } from '../../store/cl.effects';
import { ECLEffects } from '../../../eclair/store/ecl.effects';

describe('CLOnChainSendModalComponent', () => {
  let component: CLOnChainSendModalComponent;
  let fixture: ComponentFixture<CLOnChainSendModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainSendModalComponent ],
      imports: [ 
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([RTLEffects, LNDEffects, CLEffects, ECLEffects])
      ],
      providers: [ 
        LoggerService, MatSnackBar, DecimalPipe, FormBuilder,
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { sweepAll: true } },
        { provide: RTLEffects, useValue: mockRTLEffects },
        { provide: LNDEffects, useValue: mockLNDEffects },
        { provide: CLEffects, useClass: mockCLEffects },
        { provide: ECLEffects, useValue: mockECLEffects },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainSendModalComponent);
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
