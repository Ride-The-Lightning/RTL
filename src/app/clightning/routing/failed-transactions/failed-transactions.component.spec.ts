import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLFailedTransactionsComponent } from './failed-transactions.component';

describe('CLFailedTransactionsComponent', () => {
  let component: CLFailedTransactionsComponent;
  let fixture: ComponentFixture<CLFailedTransactionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLFailedTransactionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLFailedTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
