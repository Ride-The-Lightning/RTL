import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { ECLTransactionsReportComponent } from './transactions-report.component';

describe('ECLTransactionsReportComponent', () => {
  let component: ECLTransactionsReportComponent;
  let fixture: ComponentFixture<ECLTransactionsReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLTransactionsReportComponent ],
      imports: [
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
 ],
      providers: [ CommonService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLTransactionsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
