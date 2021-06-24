import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';

import { RTLReducer } from '../../store/rtl.reducers';
import { CLLookupsComponent } from './lookups.component';
import { SharedModule } from '../../shared/shared.module';
import { CLNodeLookupComponent } from './node-lookup/node-lookup.component';
import { CLChannelLookupComponent } from './channel-lookup/channel-lookup.component';
import { mockCLEffects, mockCommonService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../shared/services/test-consts';
import { EffectsModule } from '@ngrx/effects';
import { RTLEffects } from '../../store/rtl.effects';
import { LNDEffects } from '../../lnd/store/lnd.effects';
import { CLEffects } from '../store/cl.effects';
import { ECLEffects } from '../../eclair/store/ecl.effects';

describe('CLLookupsComponent', () => {
  let component: CLLookupsComponent;
  let fixture: ComponentFixture<CLLookupsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLLookupsComponent, CLNodeLookupComponent, CLChannelLookupComponent ],
      imports: [
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([RTLEffects, LNDEffects, CLEffects, ECLEffects])
      ],
      providers: [
        LoggerService,
        { provide: RTLEffects, useValue: mockRTLEffects },
        { provide: LNDEffects, useValue: mockLNDEffects },
        { provide: CLEffects, useClass: mockCLEffects },
        { provide: ECLEffects, useValue: mockECLEffects },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLLookupsComponent);
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
