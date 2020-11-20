import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DataService } from '../../../shared/services/data.service';

import { FeeReportComponent } from './fee-report.component';

describe('FeeReportComponent', () => {
  let component: FeeReportComponent;
  let fixture: ComponentFixture<FeeReportComponent>;
  const mockDataService = jasmine.createSpyObj("DataService", ["getChildAPIUrl","setChildAPIUrl","getFiatRates",
  "getAliasesFromPubkeys","signMessage","verifyMessage","handleErrorWithoutAlert","handleErrorWithAlert"]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeeReportComponent ],
      providers: [
        { provide: DataService, useValue: mockDataService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
