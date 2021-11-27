import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';


import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLReducer } from '../../../../clightning/store/cl.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SessionService } from '../../../../shared/services/session.service';

import { TopMenuComponent } from './top-menu.component';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockLoggerService, mockRTLEffects } from '../../../test-helpers/mock-services';
import { RTLEffects } from '../../../../store/rtl.effects';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../../shared.module';

describe('TopMenuComponent', () => {
  let component: TopMenuComponent;
  let fixture: ComponentFixture<TopMenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TopMenuComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        SessionService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopMenuComponent);
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
