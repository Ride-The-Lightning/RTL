import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../../lnd/store/lnd.reducers';
import { CLReducer } from '../../../../../cln/store/cl.reducers';
import { ECLReducer } from '../../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { LoopService } from '../../../../../shared/services/loop.service';

import { ChannelOpenTableComponent } from './channel-open-table.component';
import { SharedModule } from '../../../../../shared/shared.module';
import { mockDataService, mockLoggerService, mockLNDEffects, mockRTLEffects, mockRouter } from '../../../../../shared/test-helpers/mock-services';
import { RTLEffects } from '../../../../../store/rtl.effects';
import { LNDEffects } from '../../../../store/lnd.effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../../../shared/services/data.service';
import { Router } from '@angular/router';

describe('ChannelOpenTableComponent', () => {
  let component: ChannelOpenTableComponent;
  let fixture: ComponentFixture<ChannelOpenTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ChannelOpenTableComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService, LoopService,
        { provide: Router, useClass: mockRouter },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: LNDEffects, useClass: mockLNDEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelOpenTableComponent);
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
