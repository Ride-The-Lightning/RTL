import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLInvoicesComponent } from './invoices.component';

describe('CLInvoicesComponent', () => {
  let component: CLInvoicesComponent;
  let fixture: ComponentFixture<CLInvoicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLInvoicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLInvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
