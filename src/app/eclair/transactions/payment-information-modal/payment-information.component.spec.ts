import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { mockMatDialogRef } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';

import { ECLPaymentInformationComponent } from './payment-information.component';

describe('ECLPaymentInformationComponent', () => {
  let component: ECLPaymentInformationComponent;
  let fixture: ComponentFixture<ECLPaymentInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLPaymentInformationComponent],
      imports: [SharedModule],
      providers: [
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { payment: {}, sentPaymentInfo: {} } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLPaymentInformationComponent);
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
