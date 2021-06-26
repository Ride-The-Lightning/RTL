import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../shared/services/test-consts';
import { SharedModule } from '../../../shared/shared.module';

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
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        { provide: CLEffects, useClass: mockCLEffects }
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
