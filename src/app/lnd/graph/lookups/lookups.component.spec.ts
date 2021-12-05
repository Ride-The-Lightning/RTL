import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../store/rtl.reducers';
import { LNDReducer } from '../../lnd/store/lnd.reducers';
import { CLReducer } from '../../clightning/store/cl.reducers';
import { ECLReducer } from '../../eclair/store/ecl.reducers';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';

import { LookupsComponent } from './lookups.component';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../shared/test-helpers/mock-services';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../shared/services/data.service';

describe('LookupsComponent', () => {
  let component: LookupsComponent;
  let fixture: ComponentFixture<LookupsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LookupsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer }),
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
    fixture = TestBed.createComponent(LookupsComponent);
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
