import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReplaySubject, throwError } from 'rxjs';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';

import { SharedModule } from '../shared/shared.module';
import { mockActionsData, mockResponseData, mockRTLStoreState } from '../shared/test-helpers/test-data';
import { mockDataService, mockLoggerService, mockSessionService, mockMatDialogRef } from '../shared/test-helpers/mock-services';
import { ThemeOverlay } from '../shared/theme/overlay-container/theme-overlay';
import { CommonService } from '../shared/services/common.service';
import { SessionService } from '../shared/services/session.service';
import { LoggerService } from '../shared/services/logger.service';
import { DataService } from '../shared/services/data.service';
import { WebSocketClientService } from '../shared/services/web-socket.service';
import { ErrorMessageComponent } from '../shared/components/data-modal/error-message/error-message.component';
import { APICallStatusEnum, RTLActions, UI_MESSAGES } from '../shared/services/consts-enums-functions';
import { environment } from '../../environments/environment';

import { RTLEffects } from './rtl.effects';
import { RTLState } from './rtl.state';
import { updateRootAPICallStatus, openSpinner, closeSpinner, openAlert, resetRootStore } from './rtl.actions';
import { resetLNDStore, fetchInfoLND } from '../lnd/store/lnd.actions';
import { resetCLStore } from '../cln/store/cln.actions';
import { resetECLStore } from '../eclair/store/ecl.actions';

describe('RTL Root Effects', () => {
  let actions: ReplaySubject<any>;
  let effects: RTLEffects;
  let mockStore: Store<RTLState>;
  let snackBar: MatSnackBar;
  let container: any;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        RTLEffects, CommonService, HttpClient, WebSocketClientService,
        { provide: SessionService, useClass: mockSessionService },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: DataService, useClass: mockDataService },
        { provide: OverlayContainer, useClass: ThemeOverlay },
        provideMockStore({ initialState: mockRTLStoreState, selectors: [] }),
        provideMockActions(() => actions)
      ]
    });
    effects = TestBed.inject(RTLEffects);
    mockStore = TestBed.inject(Store);
    snackBar = TestBed.inject(MatSnackBar);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    container = document.createElement('div');
    container.id = 'rtl-container';
    document.body.appendChild(container);
  });

  it('should be created', async () => {
    expect(effects).toBeTruthy();
  });

  it('should dispatch set selected node', (done) => {
    const storeDispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
    actions = new ReplaySubject(1);
    const setSelectedNodeAction = {
      type: RTLActions.SET_SELECTED_NODE,
      payload: { uiMessage: UI_MESSAGES.UPDATE_SELECTED_NODE, prevLnNodeIndex: -1, currentLnNode: mockActionsData.setSelectedNode, isInitialSetup: false }
    };
    actions.next(setSelectedNodeAction);
    const sub = effects.setSelectedNode.subscribe((setSelectedNodeResponse) => {
      expect(setSelectedNodeResponse).toEqual({ type: RTLActions.VOID });
      expect(storeDispatchSpy.calls.all()[0].args[0]).toEqual(openSpinner({ payload: UI_MESSAGES.UPDATE_SELECTED_NODE }));
      expect(storeDispatchSpy.calls.all()[1].args[0]).toEqual(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.INITIATED } }));
      expect(storeDispatchSpy.calls.all()[2].args[0]).toEqual(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.COMPLETED } }));
      expect(storeDispatchSpy.calls.all()[3].args[0]).toEqual(closeSpinner({ payload: UI_MESSAGES.UPDATE_SELECTED_NODE }));
      expect(storeDispatchSpy.calls.all()[4].args[0]).toEqual(resetRootStore({ payload: mockActionsData.resetRootStore }));
      expect(storeDispatchSpy.calls.all()[5].args[0]).toEqual(resetLNDStore({ payload: mockActionsData.resetChildrenStores }));
      expect(storeDispatchSpy.calls.all()[6].args[0]).toEqual(resetCLStore({ payload: mockActionsData.resetChildrenStores }));
      expect(storeDispatchSpy.calls.all()[7].args[0]).toEqual(resetECLStore({ payload: mockActionsData.resetChildrenStores }));
      expect(storeDispatchSpy.calls.all()[8].args[0]).toEqual(fetchInfoLND({ payload: { loadPage: 'HOME' } }));
      expect(storeDispatchSpy).toHaveBeenCalledTimes(9);
      done();
      setTimeout(() => sub.unsubscribe());
    });

    const req = httpTestingController.expectOne(environment.CONF_API + '/updateSelNode');
    const expectedResponse = mockResponseData.setSelectedNodeSuccess;
    req.flush(expectedResponse);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({ prevNodeIndex: -1, currNodeIndex: setSelectedNodeAction.payload.currentLnNode.index });
  });

  it('should throw error on dispatch set selected node', (done) => {
    const storeDispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
    const httpClientSpy = spyOn(httpClient, 'post').and.returnValue(throwError(() => mockResponseData.error));
    actions = new ReplaySubject(1);
    const setSelectedNodeAction = {
      type: RTLActions.SET_SELECTED_NODE,
      payload: { uiMessage: UI_MESSAGES.UPDATE_SELECTED_NODE, prevLnNodeIndex: -1, currentLnNode: mockActionsData.setSelectedNode, isInitialSetup: false }
    };
    actions.next(setSelectedNodeAction);
    const sub = effects.setSelectedNode.subscribe((setSelectedNodeResponse: any) => {
      expect(setSelectedNodeResponse).toEqual({ type: RTLActions.VOID });
      expect(storeDispatchSpy.calls.all()[0].args[0]).toEqual(openSpinner({ payload: UI_MESSAGES.UPDATE_SELECTED_NODE }));
      expect(storeDispatchSpy.calls.all()[1].args[0]).toEqual(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.INITIATED } }));
      expect(storeDispatchSpy.calls.all()[2].args[0]).toEqual(closeSpinner({ payload: UI_MESSAGES.UPDATE_SELECTED_NODE }));
      expect(storeDispatchSpy.calls.all()[3].args[0]).toEqual(openAlert({ payload: { data: { type: 'ERROR', alertTitle: 'Update Selected Node Failed!', message: { code: '500', message: 'Request Failed. ', URL: environment.CONF_API + '/updateSelNode' }, component: ErrorMessageComponent } } }));
      expect(storeDispatchSpy.calls.all()[4].args[0]).toEqual(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.ERROR, statusCode: '500', message: 'Request Failed. ', URL: environment.CONF_API + '/updateSelNode' } }));
      expect(storeDispatchSpy).toHaveBeenCalledTimes(5);
      done();
      setTimeout(() => sub.unsubscribe());
    });
  });

  it('should open snack bar', (done) => {
    const snackBarOpenSpy = spyOn(snackBar, 'open').and.callThrough();
    actions = new ReplaySubject(1);
    const openSnackBarAction = {
      type: RTLActions.OPEN_SNACK_BAR,
      payload: 'Testing the snackbar open effect...'
    };
    actions.next(openSnackBarAction);
    const sub = effects.openSnackBar.subscribe((openSnackBarResponse) => {
      expect(openSnackBarResponse).toBeUndefined();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(openSnackBarAction.payload);
      expect(snackBarOpenSpy).toHaveBeenCalledTimes(1);
      done();
      setTimeout(() => sub.unsubscribe());
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });
});
