import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { LightningSendPaymentsComponent } from './send-payment.component';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../shared/services/test-consts';
import { LoggerService } from '../../../shared/services/logger.service';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { MatDialogRef } from '@angular/material/dialog';
import { EffectsModule } from '@ngrx/effects';
import { FEE_LIMIT_TYPES } from '../../../shared/services/consts-enums-functions';

describe('LightningSendPaymentsComponent', () => {
  let component: LightningSendPaymentsComponent;
  let fixture: ComponentFixture<LightningSendPaymentsComponent>;
  let commonService: CommonService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LightningSendPaymentsComponent ],
      imports: [ 
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        LoggerService, CommonService,
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightningSendPaymentsComponent);
    component = fixture.componentInstance;
    commonService = fixture.debugElement.injector.get(CommonService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset component', () => {
    component.resetData();
    expect(component.paymentDecoded).toEqual({});
    expect(component.paymentRequest).toEqual('');
    expect(component.selActiveChannel).toBe(null);
    expect(component.filteredMinAmtActvChannels).toEqual(component.activeChannels);
    expect(component.feeLimit).toBe(null);
    expect(component.selFeeLimitType).toEqual(FEE_LIMIT_TYPES[0]);
    expect(component.advancedTitle).toEqual('Advanced Options');
    expect(component.zeroAmtInvoice).toEqual(false);
    expect(component.paymentReq.control.errors).toBe(null);
    expect(component.paymentError).toEqual('');
    expect(component.paymentDecodedHint).toEqual('');
  });

  it('should convert Sats to USD by calling convertCurrency method from CommonService', () => {
    commonService.convertCurrency(200000, 'Sats', 'USD', true).subscribe(data => {
      expect(data.OTHER).toBe(66.87764);
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
