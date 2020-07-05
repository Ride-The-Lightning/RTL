import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLROnChainTransactionHistoryComponent } from './on-chain-transaction-history.component';

describe('ECLROnChainTransactionHistoryComponent', () => {
  let component: ECLROnChainTransactionHistoryComponent;
  let fixture: ComponentFixture<ECLROnChainTransactionHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLROnChainTransactionHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLROnChainTransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
