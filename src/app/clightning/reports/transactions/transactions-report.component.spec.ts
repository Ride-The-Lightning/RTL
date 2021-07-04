import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { CLTransactionsReportComponent } from './transactions-report.component';
import { mockDataService } from '../../../shared/test-helpers/test-consts';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';

describe('CLTransactionsReportComponent', () => {
  let component: CLTransactionsReportComponent;
  let fixture: ComponentFixture<CLTransactionsReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLTransactionsReportComponent ],
      imports: [ 
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [ 
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
    let service = TestBed.inject(CommonService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLTransactionsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
