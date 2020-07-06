import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLOnChainTransactionHistoryComponent } from './on-chain-transaction-history.component';

describe('ECLOnChainTransactionHistoryComponent', () => {
  let component: ECLOnChainTransactionHistoryComponent;
  let fixture: ComponentFixture<ECLOnChainTransactionHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLOnChainTransactionHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLOnChainTransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
