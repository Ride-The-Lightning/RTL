import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Store, StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { ECLPeersComponent } from './peers.component';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { EffectsModule } from '@ngrx/effects';
import { RTLEffects } from '../../../store/rtl.effects';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { disconnectPeer } from '../../store/ecl.actions';

describe('ECLPeersComponent', () => {
  let component: ECLPeersComponent;
  let fixture: ComponentFixture<ECLPeersComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLPeersComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]

    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLPeersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disconnect only the confirmed peer after refusing to disconnect a peer with channels', () => {
    const closeConfirm = new Subject<boolean>();
    (<any>TestBed.inject(RTLEffects)).closeConfirm = closeConfirm;
    const dispatchSpy = spyOn(TestBed.inject(Store), 'dispatch');
    component.onPeerDetach({ nodeId: 'peer-with-channel', channels: 1 });
    component.onPeerDetach({ nodeId: 'peer-without-channel', channels: 0 });
    closeConfirm.next(true);
    const disconnected = dispatchSpy.calls.allArgs().map(([action]) => action).filter((action: any) => action.type === disconnectPeer.type);
    expect(disconnected).toEqual([disconnectPeer({ payload: { nodeId: 'peer-without-channel' } })]);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
