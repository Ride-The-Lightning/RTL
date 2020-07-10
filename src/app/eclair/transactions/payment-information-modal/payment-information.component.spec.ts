import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLPaymentInformationComponent } from './payment-information.component';

describe('ECLPaymentInformationComponent', () => {
  let component: ECLPaymentInformationComponent;
  let fixture: ComponentFixture<ECLPaymentInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLPaymentInformationComponent ]
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
