import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';


import { RTLReducer } from '../../../../store/rtl.reducers';
import { CLOpenChannelComponent } from './open-channel.component';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../../shared/services/test-consts';
import { EffectsModule } from '@ngrx/effects';
import { RTLEffects } from '../../../../store/rtl.effects';
import { LNDEffects } from '../../../../lnd/store/lnd.effects';
import { CLEffects } from '../../../store/cl.effects';
import { ECLEffects } from '../../../../eclair/store/ecl.effects';
import { SharedModule } from '../../../../shared/shared.module';

describe('CLOpenChannelComponent', () => {
  let component: CLOpenChannelComponent;
  let fixture: ComponentFixture<CLOpenChannelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOpenChannelComponent ],
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
        DecimalPipe,
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {message:{}} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOpenChannelComponent);
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
