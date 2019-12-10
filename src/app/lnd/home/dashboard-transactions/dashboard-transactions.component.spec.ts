import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardTransactionsComponent } from './dashboard-transactions.component';

describe('DashboardTransactionsComponent', () => {
  let component: DashboardTransactionsComponent;
  let fixture: ComponentFixture<DashboardTransactionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardTransactionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
