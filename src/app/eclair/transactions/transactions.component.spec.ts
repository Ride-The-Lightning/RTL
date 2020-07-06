import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLTransactionsComponent } from './transactions.component';

describe('ECLTransactionsComponent', () => {
  let component: ECLTransactionsComponent;
  let fixture: ComponentFixture<ECLTransactionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLTransactionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
