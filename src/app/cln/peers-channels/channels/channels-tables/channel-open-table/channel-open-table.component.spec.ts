import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../../../../shared/services/common.service';
import { DataService } from '../../../../../shared/services/data.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../../shared/shared.module';
import { RTLEffects } from '../../../../../store/rtl.effects';

import { RootReducer } from '../../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../../eclair/store/ecl.reducers';
import { CLNEffects } from '../../../../store/cln.effects';
import { CLNChannelOpenTableComponent } from './channel-open-table.component';
import { Router } from '@angular/router';

describe('CLNChannelOpenTableComponent', () => {
  let component: CLNChannelOpenTableComponent;
  let fixture: ComponentFixture<CLNChannelOpenTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNChannelOpenTableComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: CLNEffects, useClass: mockCLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNChannelOpenTableComponent);
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
