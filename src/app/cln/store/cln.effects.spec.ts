import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReplaySubject } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';

import { SharedModule } from '../../shared/shared.module';
import { mockRTLStoreState } from '../../shared/test-helpers/test-data';
import { mockDataService, mockLoggerService, mockSessionService } from '../../shared/test-helpers/mock-services';
import { CommonService } from '../../shared/services/common.service';
import { SessionService } from '../../shared/services/session.service';
import { LoggerService } from '../../shared/services/logger.service';
import { DataService } from '../../shared/services/data.service';
import { WebSocketClientService } from '../../shared/services/web-socket.service';

import { CLNEffects } from './cln.effects';
import { saveNewPeer } from './cln.actions';
import { allAPIsCallStatus } from './cln.selector';
import { initCLNState } from './cln.state';

// Core Lightning lists node ids in lower case. The peer the dialog goes on with is the one that was entered.
describe('CLN Effects: saveNewPeer', () => {
  let actions: ReplaySubject<any>;
  let effects: CLNEffects;
  let httpTestingController: HttpTestingController;
  const keyOne = '02' + '1a'.repeat(32);
  const keyNew = '03' + 'ab'.repeat(32);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        CLNEffects, CommonService, HttpClient, WebSocketClientService,
        { provide: SessionService, useClass: mockSessionService },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        provideMockStore({ initialState: mockRTLStoreState, selectors: [{ selector: allAPIsCallStatus, value: initCLNState.apisCallStatus }] }),
        provideMockActions(() => actions)
      ]
    });
    effects = TestBed.inject(CLNEffects);
    httpTestingController = TestBed.inject(HttpTestingController);
    actions = new ReplaySubject(1);
  });

  const connect = (id: string, peersAfterConnect: any[]) => {
    let emitted: any = null;
    actions.next(saveNewPeer({ payload: { id: id } }));
    const sub = effects.saveNewPeerCL.subscribe((action) => { emitted = action; });
    httpTestingController.expectOne(() => true).flush(peersAfterConnect);
    sub.unsubscribe();
    return emitted.payload.peer;
  };

  it('reports the entered peer as the newly added one, in whatever case it was entered', () => {
    const peers = [{ id: keyOne, alias: 'one' }, { id: keyNew, alias: 'new' }];
    expect(connect(keyNew, peers)).toEqual({ id: keyNew, alias: 'new' });
    expect(connect(keyNew.toUpperCase(), peers)).toEqual({ id: keyNew, alias: 'new' });
    expect(connect(keyNew.toUpperCase() + '@10.0.0.1:9735', peers)).toEqual({ id: keyNew, alias: 'new' });
  });

  it('reports the entered id when the list does not have the peer', () => {
    expect(connect(keyNew, [{ alias: 'no id' }, { id: keyOne, alias: 'one' }])).toEqual({ id: keyNew });
    expect(connect(keyNew.toUpperCase() + '@10.0.0.1:9735', [])).toEqual({ id: keyNew });
  });
});
