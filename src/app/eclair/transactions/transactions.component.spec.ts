import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../store/rtl.reducers';
import { LoggerService } from '../../shared/services/logger.service';

import { ECLTransactionsComponent } from './transactions.component';
import { SharedModule } from '../../shared/shared.module';
import { CurrencyUnitConverterComponent } from '../../shared/components/currency-unit-converter/currency-unit-converter.component';
import { mockDataService, mockLoggerService } from '../../shared/test-helpers/mock-services';
import { CommonService } from '../../shared/services/common.service';
import { DataService } from '../../shared/services/data.service';

describe('ECLTransactionsComponent', () => {
  let component: ECLTransactionsComponent;
  let fixture: ComponentFixture<ECLTransactionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLTransactionsComponent, CurrencyUnitConverterComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
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

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
