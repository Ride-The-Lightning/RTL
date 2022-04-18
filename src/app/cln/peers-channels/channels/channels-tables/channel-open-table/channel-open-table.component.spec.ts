import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../../../../shared/services/common.service';
import { DataService } from '../../../../../shared/services/data.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects, mockRouter } from '../../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../../shared/shared.module';
import { RTLEffects } from '../../../../../store/rtl.effects';

import { RootReducer } from '../../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../../cln/store/cl.reducers';
import { ECLReducer } from '../../../../../eclair/store/ecl.reducers';
import { CLNEffects } from '../../../../store/cl.effects';
import { CLNChannelOpenTableComponent } from './channel-open-table.component';
import { ExtraOptions, Route, Router } from '@angular/router';

describe('CLChannelOpenTableComponent', () => {
  let component: CLChannelOpenTableComponent;
  let fixture: ComponentFixture<CLChannelOpenTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLChannelOpenTableComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: Router, useClass: mockRouter },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: CLNEffects, useClass: mockCLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelOpenTableComponent);
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
