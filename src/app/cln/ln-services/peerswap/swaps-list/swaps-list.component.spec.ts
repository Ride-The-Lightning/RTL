import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../../../shared/services/common.service';
import { mockCLEffects, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects, mockDataService } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { DataService } from '../../../../shared/services/data.service';
import { PeerswapsListComponent } from './swaps-list.component';
import { LoggerService } from '../../../../shared/services/logger.service';
import { Router } from '@angular/router';

describe('PeerswapsListComponent', () => {
  let component: PeerswapsListComponent;
  let fixture: ComponentFixture<PeerswapsListComponent>;
  // private commonService: CommonService, private store: Store<RTLState>, private router: Router
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PeerswapsListComponent],
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
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeerswapsListComponent);
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
