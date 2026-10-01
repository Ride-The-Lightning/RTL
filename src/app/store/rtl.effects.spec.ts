import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
import { API_END_POINTS, APICallStatusEnum, RTLActions, UI_MESSAGES } from '../shared/services/consts-enums-functions';

import { RTLEffects } from './rtl.effects';
import { RTLState } from './rtl.state';
import { updateRootAPICallStatus, openSpinner, closeSpinner, openAlert, resetRootStore, fetchRTLConfig, openSnackBar } from './rtl.actions';
import { resetLNDStore, fetchInfoLND, fetchPageSettings as fetchPageSettingsLND } from '../lnd/store/lnd.actions';
import { resetCLNStore } from '../cln/store/cln.actions';
import { resetECLStore } from '../eclair/store/ecl.actions';

describe('RTL Root Effects', () => {
  let actions: ReplaySubject<any>;
  let effects: RTLEffects;
  let mockStore: Store<RTLState>;
  let snackBar: MatSnackBar;
  let router: Router;
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
    router = TestBed.inject(Router);
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
      expect(storeDispatchSpy.calls.all()[4].args[0]).toEqual(resetRootStore({ payload: mockActionsData.setSelectedNode }));
      expect(storeDispatchSpy.calls.all()[5].args[0]).toEqual(resetLNDStore());
      expect(storeDispatchSpy.calls.all()[6].args[0]).toEqual(resetCLNStore());
      expect(storeDispatchSpy.calls.all()[7].args[0]).toEqual(resetECLStore());
      expect(storeDispatchSpy.calls.all()[8].args[0]).toEqual(fetchPageSettingsLND());
      expect(storeDispatchSpy.calls.all()[9].args[0]).toEqual(fetchInfoLND({ payload: { loadPage: 'HOME' } }));
      expect(storeDispatchSpy).toHaveBeenCalledTimes(10);
      done();
      setTimeout(() => sub.unsubscribe());
    });
    const req = httpTestingController.expectOne(API_END_POINTS.CONF_API + '/updateSelNode/1/-1');
    const expectedResponse = mockResponseData.setSelectedNodeSuccess;
    req.flush(expectedResponse);
    expect(req.request.method).toEqual('GET');
  });

  it('should set selected node locally without calling the server when logged out', (done) => {
    const sessionService = TestBed.inject(SessionService);
    spyOn(sessionService, 'getItem').and.returnValue(null);
    const storeDispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
    actions = new ReplaySubject(1);
    const setSelectedNodeAction = {
      type: RTLActions.SET_SELECTED_NODE,
      payload: { uiMessage: UI_MESSAGES.NO_SPINNER, prevLnNodeIndex: -1, currentLnNode: mockActionsData.setSelectedNode, isInitialSetup: true }
    };
    actions.next(setSelectedNodeAction);
    const sub = effects.setSelectedNode.subscribe((setSelectedNodeResponse) => {
      expect(setSelectedNodeResponse).toEqual({ type: RTLActions.VOID });
      httpTestingController.expectNone(API_END_POINTS.CONF_API + '/updateSelNode/1/-1');
      expect(storeDispatchSpy.calls.all()[0].args[0]).toEqual(openSpinner({ payload: UI_MESSAGES.NO_SPINNER }));
      expect(storeDispatchSpy.calls.all()[1].args[0]).toEqual(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.INITIATED } }));
      expect(storeDispatchSpy.calls.all()[2].args[0]).toEqual(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.COMPLETED } }));
      expect(storeDispatchSpy.calls.all()[3].args[0]).toEqual(closeSpinner({ payload: UI_MESSAGES.NO_SPINNER }));
      expect(storeDispatchSpy.calls.all()[4].args[0]).toEqual(resetRootStore({ payload: mockActionsData.setSelectedNode }));
      // The store's selNode must be a copy: the node handed in is an element of appConfig.nodes.
      expect((storeDispatchSpy.calls.all()[4].args[0] as any).payload).not.toBe(mockActionsData.setSelectedNode);
      expect(storeDispatchSpy.calls.all()[7].args[0]).toEqual(resetECLStore());
      // No token, so no node data is fetched: the reset actions are the last ones.
      expect(storeDispatchSpy).toHaveBeenCalledTimes(8);
      done();
      setTimeout(() => sub.unsubscribe());
    });
  });

  it('should throw error on dispatch set selected node', (done) => {
    const storeDispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
    const httpClientSpy = spyOn(httpClient, 'get').and.returnValue(throwError(() => mockResponseData.error));
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
      expect(storeDispatchSpy.calls.all()[3].args[0]).toEqual(openAlert({ payload: { data: { type: 'ERROR', alertTitle: 'Update Selected Node Failed!', message: { code: '500', message: 'Request Failed. ', URL: API_END_POINTS.CONF_API + '/updateSelNode' }, component: ErrorMessageComponent } } }));
      expect(storeDispatchSpy.calls.all()[4].args[0]).toEqual(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.ERROR, statusCode: '500', message: 'Request Failed. ', URL: API_END_POINTS.CONF_API + '/updateSelNode' } }));
      expect(storeDispatchSpy).toHaveBeenCalledTimes(5);
      done();
      setTimeout(() => sub.unsubscribe());
    });
  });

  it('should refresh application settings after default password login', () => {
    const storeDispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
    const routerNavigateSpy = spyOn(router, 'navigate').and.stub();

    effects.setLoggedInDetails(true, { token: 'test-token' });

    expect(storeDispatchSpy.calls.all()[0].args[0]).toEqual(fetchRTLConfig());
    expect(storeDispatchSpy.calls.all()[1].args[0]).toEqual(openSnackBar({ payload: 'Reset your password.' }));
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/settings/auth']);
  });

  it('should store application settings when selected node index is missing from config', (done) => {
    const storeDispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
    actions = new ReplaySubject(1);
    const appConfig = {
      ...mockRTLStoreState.root.appConfig,
      SSO: { rtlSSO: 0, logoutRedirectLink: '/rtl/login' },
      secret2FA: '',
      allowPasswordUpdate: true,
      disableAuth: false,
      selectedNodeIndex: 99
    };
    actions.next({ type: RTLActions.FETCH_APPLICATION_SETTINGS });
    const sub = effects.appConfigFetch.subscribe((appConfigResponse) => {
      expect(appConfigResponse).toEqual({ type: RTLActions.SET_APPLICATION_SETTINGS, payload: appConfig });
      const setSelectedNodeAction = storeDispatchSpy.calls.all().find((call) => (call.args[0] as any).type === RTLActions.SET_SELECTED_NODE)?.args[0] as any;
      expect(setSelectedNodeAction).toBeTruthy();
      expect(setSelectedNodeAction.payload.currentLnNode.index).toEqual(appConfig.nodes[0].index);
      done();
      setTimeout(() => sub.unsubscribe());
    });
    const req = httpTestingController.expectOne(API_END_POINTS.CONF_API);
    req.flush(appConfig);
    expect(req.request.method).toEqual('GET');
  });

  // Flushes the given config through appConfigFetch and returns the node it selected.
  const selectedNodeFor = (appConfig: any, done: (node: any, response: any) => void) => {
    const storeDispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
    actions = new ReplaySubject(1);
    actions.next({ type: RTLActions.FETCH_APPLICATION_SETTINGS });
    const sub = effects.appConfigFetch.subscribe((response) => {
      const setSelectedNodeAction = storeDispatchSpy.calls.all().find((call) => (call.args[0] as any).type === RTLActions.SET_SELECTED_NODE)?.args[0] as any;
      done(setSelectedNodeAction?.payload.currentLnNode, response);
      setTimeout(() => sub.unsubscribe());
    });
    httpTestingController.expectOne(API_END_POINTS.CONF_API).flush(appConfig);
  };

  const twoNodeConfig = (indexes: any[], selectedNodeIndex: any) => {
    const base = mockRTLStoreState.root.appConfig;
    return {
      ...base, SSO: { rtlSSO: 0, logoutRedirectLink: '/rtl/login' }, secret2FA: '', allowPasswordUpdate: true, disableAuth: false, selectedNodeIndex,
      nodes: indexes.map((index, i) => ({ ...JSON.parse(JSON.stringify(base.nodes[0])), index, lnNode: 'Node ' + i }))
    };
  };

  it('should select the node whose index is 0 when it is the selected one', (done) => {
    selectedNodeFor(twoNodeConfig([1, 0], 0), (node, response) => {
      expect(node.lnNode).toEqual('Node 1');
      expect(response.type).toEqual(RTLActions.SET_APPLICATION_SETTINGS);
      done();
    });
  });

  it('should match the selected node when the config carries indexes as strings', (done) => {
    selectedNodeFor(twoNodeConfig(['1', '2'], '2'), (node, response) => {
      expect(node.lnNode).toEqual('Node 1');
      expect(response.type).toEqual(RTLActions.SET_APPLICATION_SETTINGS);
      done();
    });
  });

  it('should store application settings when a node has no settings object', (done) => {
    const appConfig = twoNodeConfig([1, 2], 1);
    delete (appConfig.nodes[1] as any).settings;
    selectedNodeFor(appConfig, (node, response) => {
      expect(node.lnNode).toEqual('Node 0');
      expect(response.type).toEqual(RTLActions.SET_APPLICATION_SETTINGS);
      expect((response as any).payload.nodes.length).toEqual(2);
      done();
    });
  });

  it('should give the selected node a settings object when the config has none for it', (done) => {
    const appConfig = twoNodeConfig([1, 2], 2);
    delete (appConfig.nodes[1] as any).settings;
    selectedNodeFor(appConfig, (node, response) => {
      expect(node.lnNode).toEqual('Node 1');
      expect(Array.isArray(node.settings.currencyUnits)).toBeTrue();
      expect(response.type).toEqual(RTLActions.SET_APPLICATION_SETTINGS);
      done();
    });
  });

  it('should fetch application settings again after a failed fetch', (done) => {
    spyOn(effects, 'handleErrorWithAlert').and.stub();
    actions = new ReplaySubject(1);
    const emitted: any[] = [];
    const sub = effects.appConfigFetch.subscribe((response) => {
      emitted.push(response);
      if (emitted.length === 2) {
        expect(emitted[0].type).toEqual(RTLActions.VOID);
        expect(emitted[1].type).toEqual(RTLActions.SET_APPLICATION_SETTINGS);
        done();
        setTimeout(() => sub.unsubscribe());
      }
    });
    actions.next({ type: RTLActions.FETCH_APPLICATION_SETTINGS });
    httpTestingController.expectOne(API_END_POINTS.CONF_API).flush({ message: 'failed' }, { status: 500, statusText: 'Internal Server Error' });
    actions.next({ type: RTLActions.FETCH_APPLICATION_SETTINGS });
    httpTestingController.expectOne(API_END_POINTS.CONF_API).flush(twoNodeConfig([1, 2], 1));
  });

  it('should cancel a pending application settings fetch when a newer one starts, and close its spinner', (done) => {
    const storeDispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
    actions = new ReplaySubject(1);
    const emitted: any[] = [];
    const sub = effects.appConfigFetch.subscribe((response) => {
      emitted.push(response);
      const closes = storeDispatchSpy.calls.all().filter((call) => (call.args[0] as any).type === RTLActions.CLOSE_SPINNER && (call.args[0] as any).payload === UI_MESSAGES.GET_RTL_CONFIG);
      // One close for the cancelled request; the answered one closes its own when it completes.
      expect(closes.length).toEqual(1);
      expect(emitted.length).toEqual(1);
      expect(response.type).toEqual(RTLActions.SET_APPLICATION_SETTINGS);
      done();
      setTimeout(() => sub.unsubscribe());
    });
    actions.next({ type: RTLActions.FETCH_APPLICATION_SETTINGS });
    actions.next({ type: RTLActions.FETCH_APPLICATION_SETTINGS });
    const requests = httpTestingController.match(API_END_POINTS.CONF_API);
    expect(requests.length).toEqual(2);
    expect(requests[0].cancelled).toBeTrue();
    requests[1].flush(twoNodeConfig([1, 2], 1));
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
