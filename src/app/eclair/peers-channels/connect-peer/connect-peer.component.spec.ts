import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';

import { RTLReducer } from '../../../store/rtl.reducers';
import { LoggerService } from '../../../shared/services/logger.service';

import { ECLConnectPeerComponent } from './connect-peer.component';

describe('ECLConnectPeerComponent', () => {
  let component: ECLConnectPeerComponent;
  let fixture: ComponentFixture<ECLConnectPeerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLConnectPeerComponent ],
      imports: [
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
    fixture = TestBed.createComponent(ECLConnectPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
