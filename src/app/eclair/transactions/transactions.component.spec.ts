import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRTransactionsComponent } from './transactions.component';

describe('ECLRTransactionsComponent', () => {
  let component: ECLRTransactionsComponent;
  let fixture: ComponentFixture<ECLRTransactionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRTransactionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
