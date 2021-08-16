import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { ECLForwardingHistoryComponent } from './forwarding-history.component';
import { SharedModule } from '../../../shared/shared.module';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';

describe('ECLForwardingHistoryComponent', () => {
  let component: ECLForwardingHistoryComponent;
  let fixture: ComponentFixture<ECLForwardingHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLForwardingHistoryComponent],
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
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLForwardingHistoryComponent);
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
