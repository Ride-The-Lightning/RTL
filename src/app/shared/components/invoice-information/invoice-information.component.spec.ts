import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceInformationComponent } from './invoice-information.component';

describe('InvoiceInformationComponent', () => {
  let component: InvoiceInformationComponent;
  let fixture: ComponentFixture<InvoiceInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvoiceInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
