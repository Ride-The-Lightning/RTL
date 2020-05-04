import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoopTransactionDetailsComponent } from './loop-transaction-details.component';

describe('LoopTransactionDetailsComponent', () => {
  let component: LoopTransactionDetailsComponent;
  let fixture: ComponentFixture<LoopTransactionDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopTransactionDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopTransactionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
