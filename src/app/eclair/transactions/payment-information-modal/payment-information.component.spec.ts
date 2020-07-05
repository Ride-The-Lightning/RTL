import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRPaymentInformationComponent } from './payment-information.component';

describe('ECLRPaymentInformationComponent', () => {
  let component: ECLRPaymentInformationComponent;
  let fixture: ComponentFixture<ECLRPaymentInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRPaymentInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRPaymentInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
