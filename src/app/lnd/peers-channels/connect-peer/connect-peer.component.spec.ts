import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';


import { RTLReducer } from '../../../store/rtl.reducers';
import { LoggerService } from '../../../shared/services/logger.service';

import { ConnectPeerComponent } from './connect-peer.component';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../shared/services/test-consts';
import { LNDEffects } from '../../store/lnd.effects';
import { SharedModule } from '../../../shared/shared.module';
import { EffectsModule } from '@ngrx/effects';

describe('ConnectPeerComponent', () => {
  let component: ConnectPeerComponent;
  let fixture: ComponentFixture<ConnectPeerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectPeerComponent ],
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
        LoggerService,
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {message:{}} },
        { provide: LNDEffects, useClass: mockLNDEffects }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectPeerComponent);
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
