import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRInvoiceInformationComponent } from './invoice-information.component';

describe('ECLRInvoiceInformationComponent', () => {
  let component: ECLRInvoiceInformationComponent;
  let fixture: ComponentFixture<ECLRInvoiceInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRInvoiceInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRInvoiceInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
