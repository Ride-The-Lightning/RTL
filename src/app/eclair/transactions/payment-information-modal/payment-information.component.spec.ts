import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { ECLPaymentInformationComponent } from './payment-information.component';

describe('ECLPaymentInformationComponent', () => {
  let component: ECLPaymentInformationComponent;
  let fixture: ComponentFixture<ECLPaymentInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLPaymentInformationComponent ],
      providers: [ MatDialogRef ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLPaymentInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
