import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnChainTransactionHistoryComponent } from './on-chain-transaction-history.component';

describe('OnChainTransactionHistoryComponent', () => {
  let component: OnChainTransactionHistoryComponent;
  let fixture: ComponentFixture<OnChainTransactionHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainTransactionHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainTransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
