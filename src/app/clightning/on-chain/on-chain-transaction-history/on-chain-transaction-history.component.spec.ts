import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLOnChainTransactionHistoryComponent } from './on-chain-transaction-history.component';

describe('CLOnChainTransactionHistoryComponent', () => {
  let component: CLOnChainTransactionHistoryComponent;
  let fixture: ComponentFixture<CLOnChainTransactionHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainTransactionHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainTransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
