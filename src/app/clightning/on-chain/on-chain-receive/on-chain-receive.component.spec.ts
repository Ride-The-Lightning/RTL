import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ECLEffects } from '../../../eclair/store/ecl.effects';
import { LNDEffects } from '../../../lnd/store/lnd.effects';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../shared/services/test-consts';
import { SharedModule } from '../../../shared/shared.module';
import { RTLEffects } from '../../../store/rtl.effects';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CLEffects } from '../../store/cl.effects';
import { CLOnChainReceiveComponent } from './on-chain-receive.component';

describe('CLOnChainReceiveComponent', () => {
  let component: CLOnChainReceiveComponent;
  let fixture: ComponentFixture<CLOnChainReceiveComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainReceiveComponent ],
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
        { provide: RTLEffects, useValue: mockRTLEffects },
        { provide: LNDEffects, useValue: mockLNDEffects },
        { provide: CLEffects, useClass: mockCLEffects },
        { provide: ECLEffects, useValue: mockECLEffects }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainReceiveComponent);
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
