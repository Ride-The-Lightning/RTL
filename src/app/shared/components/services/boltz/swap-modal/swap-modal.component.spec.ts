import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { BoltzService } from '../../../../../shared/services/boltz.service';

import { SwapModalComponent } from './swap-modal.component';

describe('SwapModalComponent', () => {
  let component: SwapModalComponent;
  let fixture: ComponentFixture<SwapModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapModalComponent ],
      imports: [ RouterTestingModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
 ],
      providers: [ LoggerService, CommonService, BoltzService, MatDialogRef, DecimalPipe, FormBuilder ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
