import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { CLTransactionsReportComponent } from './transactions-report.component';

const mockCommonService = jasmine.createSpyObj("CommonService", ["getScreenSize", "setScreenSize", "getContainerSize", "setContainerSize", "sortByKey", "sortDescByKey", "sortAscByKey", "camelCase", "titleCase", "convertCurrency", "convertWithoutFiat", "convertWithFiat", "convertTime", "downloadFile", "convertToCSV", "isVersionCompatible"]);

describe('CLTransactionsReportComponent', () => {
  let component: CLTransactionsReportComponent;
  let fixture: ComponentFixture<CLTransactionsReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLTransactionsReportComponent ],
      imports: [ 
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
      ],
      providers: [ 
        { provide: CommonService, useValue: mockCommonService }
      ]
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
