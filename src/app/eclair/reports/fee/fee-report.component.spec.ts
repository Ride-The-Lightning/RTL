import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DataService } from '../../../shared/services/data.service';

import { ECLFeeReportComponent } from './fee-report.component';

describe('ECLFeeReportComponent', () => {
  let component: ECLFeeReportComponent;
  let fixture: ComponentFixture<ECLFeeReportComponent>;
  const mockDataService = jasmine.createSpyObj("DataService", ["getChildAPIUrl","setChildAPIUrl","getFiatRates",
  "getAliasesFromPubkeys","signMessage","verifyMessage","handleErrorWithoutAlert","handleErrorWithAlert"]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLFeeReportComponent ],
      providers: [
        { provide: DataService, useValue: mockDataService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLFeeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
