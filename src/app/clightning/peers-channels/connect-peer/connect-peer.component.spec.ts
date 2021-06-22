import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';

import { RTLReducer } from '../../../store/rtl.reducers';
import { SharedModule } from '../../../shared/shared.module';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLConnectPeerComponent } from './connect-peer.component';

describe('CLConnectPeerComponent', () => {
  let component: CLConnectPeerComponent;
  let fixture: ComponentFixture<CLConnectPeerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLConnectPeerComponent ],
      imports: [ SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
, provideMockActions ],
      providers: [ LoggerService, MatDialogRef, FormBuilder ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLConnectPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
