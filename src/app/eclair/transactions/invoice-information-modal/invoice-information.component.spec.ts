import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLInvoiceInformationComponent } from './invoice-information.component';

describe('ECLInvoiceInformationComponent', () => {
  let component: ECLInvoiceInformationComponent;
  let fixture: ComponentFixture<ECLInvoiceInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLInvoiceInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLInvoiceInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
