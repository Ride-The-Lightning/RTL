import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { PaymentLookupComponent } from './payment-lookup.component';
import { mockDataService, mockLoggerService } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';
import { DataService } from '../../../../shared/services/data.service';

describe('PaymentLookupComponent', () => {
  let component: PaymentLookupComponent;
  let fixture: ComponentFixture<PaymentLookupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PaymentLookupComponent],
      imports: [
        SharedModule
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentLookupComponent);
    component = fixture.componentInstance;
    component.payment = { htlcs: [] };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
