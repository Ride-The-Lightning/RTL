import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { LookupTransactionsComponent } from './lookup-transactions.component';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../../shared/shared.module';
import { DataService } from '../../../shared/services/data.service';

describe('LookupTransactionsComponent', () => {
  let component: LookupTransactionsComponent;
  let fixture: ComponentFixture<LookupTransactionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LookupTransactionsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
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
    fixture = TestBed.createComponent(LookupTransactionsComponent);
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
