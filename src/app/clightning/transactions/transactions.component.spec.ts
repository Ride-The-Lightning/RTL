import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLTransactionsComponent } from './transactions.component';

describe('CLTransactionsComponent', () => {
  let component: CLTransactionsComponent;
  let fixture: ComponentFixture<CLTransactionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLTransactionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
