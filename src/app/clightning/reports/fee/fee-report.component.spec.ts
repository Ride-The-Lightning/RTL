import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DataService } from '../../../shared/services/data.service';

import { CLFeeReportComponent } from './fee-report.component';

describe('CLFeeReportComponent', () => {
  let component: CLFeeReportComponent;
  let fixture: ComponentFixture<CLFeeReportComponent>;
  const mockDataService = jasmine.createSpyObj("DataService", ["getChildAPIUrl","setChildAPIUrl","getFiatRates",
  "getAliasesFromPubkeys","signMessage","verifyMessage","handleErrorWithoutAlert","handleErrorWithAlert"]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLFeeReportComponent ],
      providers: [
        { provide: DataService, useValue: mockDataService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLFeeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
