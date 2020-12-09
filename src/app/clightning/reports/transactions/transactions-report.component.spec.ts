import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLTransactionsReportComponent } from './transactions-report.component';

describe('CLTransactionsReportComponent', () => {
  let component: CLTransactionsReportComponent;
  let fixture: ComponentFixture<CLTransactionsReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLTransactionsReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLTransactionsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
