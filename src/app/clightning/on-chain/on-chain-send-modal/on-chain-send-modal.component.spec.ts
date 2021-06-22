import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLOnChainSendModalComponent } from './on-chain-send-modal.component';

describe('CLOnChainSendModalComponent', () => {
  let component: CLOnChainSendModalComponent;
  let fixture: ComponentFixture<CLOnChainSendModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainSendModalComponent ],
      imports: [ SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
, provideMockActions ],
      providers: [ LoggerService, CommonService, MatSnackBar, MatDialogRef, DecimalPipe, FormBuilder ]
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
});
