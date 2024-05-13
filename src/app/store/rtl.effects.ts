import { Injectable, OnDestroy, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { map, mergeMap, catchError, take, withLatestFrom, takeUntil } from 'rxjs/operators';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { WebSocketClientService } from '../shared/services/web-socket.service';
import { LoggerService } from '../shared/services/logger.service';
import { SessionService } from '../shared/services/session.service';
import { CommonService } from '../shared/services/common.service';
import { DataService } from '../shared/services/data.service';
import { RTLConfiguration, Node, GetInfoRoot } from '../shared/models/RTLconfig';
import { API_URL, API_END_POINTS, RTLActions, APICallStatusEnum, AuthenticateWith, CURRENCY_UNITS, ScreenSizeEnum, UI_MESSAGES } from '../shared/services/consts-enums-functions';
import { DialogConfig } from '../shared/models/alertData';
import { FetchFile, Login, OpenSnackBar, ResetPassword, UpdateSelectedNode, VerifyTwoFA } from '../shared/models/rtlModels';

import { SpinnerDialogComponent } from '../shared/components/data-modal/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from '../shared/components/data-modal/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from '../shared/components/data-modal/confirmation-message/confirmation-message.component';
import { ErrorMessageComponent } from '../shared/components/data-modal/error-message/error-message.component';
import { ShowPubkeyComponent } from '../shared/components/data-modal/show-pubkey/show-pubkey.component';

import { RTLState } from './rtl.state';
import { resetRootStore, setNodeData, setSelectedNode, updateRootAPICallStatus, closeSpinner, openAlert, openSpinner, openSnackBar, fetchRTLConfig, closeAllDialogs, logout, setSelectedNodeSettings } from './rtl.actions';
import { fetchInfoLND, resetLNDStore, fetchPageSettings as fetchPageSettingsLND } from '../lnd/store/lnd.actions';
import { fetchInfoCLN, resetCLNStore, fetchPageSettings as fetchPageSettingsCLN } from '../cln/store/cln.actions';
import { fetchInfoECL, resetECLStore, fetchPageSettings as fetchPageSettingsECL } from '../eclair/store/ecl.actions';
import { rootAppConfig, rootNodeData } from './rtl.selector';

@Injectable()
export class RTLEffects implements OnDestroy {

  dialogRef: any;
  screenSize = '';
  alertWidth = '55%';
  confirmWidth = '70%';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions: Actions,
    private httpClient: HttpClient,
    private store: Store<RTLState>,
    private logger: LoggerService,
    private wsService: WebSocketClientService,
    private sessionService: SessionService,
    private commonService: CommonService,
    private dataService: DataService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  closeAllDialogs = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.CLOSE_ALL_DIALOGS),
      map(() => {
        this.dialog.closeAll();
      })),
    { dispatch: false }
  );

  openSnackBar = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.OPEN_SNACK_BAR),
      map((action: { type: string, payload: string | OpenSnackBar }) => {
        if (typeof action.payload === 'string') {
          this.snackBar.open(action.payload);
        } else {
          if (action.payload.type === 'ERROR') {
            this.snackBar.open(action.payload.message, '', { duration: action.payload.duration ? action.payload.duration : 2000, panelClass: 'rtl-warn-snack-bar' });
          } else if (action.payload.type === 'WARN') {
            this.snackBar.open(action.payload.message, '', { duration: action.payload.duration ? action.payload.duration : 2000, panelClass: 'rtl-accent-snack-bar' });
          } else {
            this.snackBar.open(action.payload.message, '', { duration: action.payload.duration ? action.payload.duration : 2000, panelClass: 'rtl-snack-bar' });
          }
        }
      })),
    { dispatch: false }
  );

  openSpinner = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.OPEN_SPINNER),
      map((action: { type: string, payload: string }) => {
        if (action.payload !== UI_MESSAGES.NO_SPINNER) {
          this.dialogRef = this.dialog.open(SpinnerDialogComponent, { panelClass: 'spinner-dialog-panel', data: { titleMessage: action.payload } });
        }
      })),
    { dispatch: false }
  );

  closeSpinner = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.CLOSE_SPINNER),
      map((action: { type: string, payload: string }) => {
        if (action.payload !== UI_MESSAGES.NO_SPINNER) {
          try {
            if (this.dialogRef && (this.dialogRef.componentInstance && this.dialogRef.componentInstance.data && this.dialogRef.componentInstance.data.titleMessage && this.dialogRef.componentInstance.data.titleMessage === action.payload)) {
              this.dialogRef.close();
            } else {
              this.dialog.openDialogs.forEach((localDialog) => {
                if (localDialog.componentInstance && localDialog.componentInstance.data && localDialog.componentInstance.data.titleMessage && localDialog.componentInstance.data.titleMessage === action.payload) {
                  localDialog.close();
                }
              });
            }
          } catch (err) {
            this.logger.error(err);
          }
        }
      })),
    { dispatch: false }
  );

  openAlert = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.OPEN_ALERT),
      map((action: { type: string, payload: DialogConfig }) => {
        const updatedPayload = JSON.parse(JSON.stringify(action.payload));
        if (!updatedPayload.width) {
          updatedPayload.width = this.alertWidth;
        }
        if (action.payload.data.component) {
          this.dialogRef = this.dialog.open(action.payload.data.component, updatedPayload);
        } else {
          this.dialogRef = this.dialog.open(AlertMessageComponent, updatedPayload);
        }
      })),
    { dispatch: false }
  );

  closeAlert = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.CLOSE_ALERT),
      map((action: { type: string, payload: any }) => {
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.logger.info(action.payload);
        return action.payload;
      })),
    { dispatch: false }
  );

  openConfirm = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.OPEN_CONFIRMATION),
      map((action: { type: string, payload: DialogConfig }) => {
        const updatedPayload = JSON.parse(JSON.stringify(action.payload));
        if (!updatedPayload.width) {
          updatedPayload.width = this.confirmWidth;
        }
        this.dialogRef = this.dialog.open(ConfirmationMessageComponent, updatedPayload);
      })),
    { dispatch: false }
  );

  closeConfirm = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.CLOSE_CONFIRMATION),
      take(1),
      map((action: { type: string, payload: boolean | any[] }) => {
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.logger.info(action.payload);
        return action.payload;
      })),
    { dispatch: false }
  );

  showNodePubkey = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SHOW_PUBKEY),
      withLatestFrom(this.store.select(rootNodeData)),
      mergeMap(([action, nodeData]: [{ type: string, payload: any }, GetInfoRoot]) => {
        if (!this.sessionService.getItem('token') || !nodeData.identity_pubkey) {
          this.snackBar.open('Node Pubkey does not exist.');
        } else {
          this.store.dispatch(openAlert({
            payload: {
              data: {
                information: nodeData,
                component: ShowPubkeyComponent
              }
            }
          }));
        }
        return of({ type: RTLActions.VOID });
      }))
  );

  appConfigFetch = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.FETCH_APPLICATION_SETTINGS),
      mergeMap(() => {
        this.screenSize = this.commonService.getScreenSize();
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.alertWidth = '95%';
          this.confirmWidth = '95%';
        } else if (this.screenSize === ScreenSizeEnum.MD) {
          this.alertWidth = '80%';
          this.confirmWidth = '80%';
        } else {
          this.alertWidth = '50%';
          this.confirmWidth = '53%';
        }
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_RTL_CONFIG }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'FetchRTLConfig', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.get<RTLConfiguration>(API_END_POINTS.CONF_API);
      }),
      map((rtlConfig: RTLConfiguration) => {
        this.logger.info(rtlConfig);
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_RTL_CONFIG }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'FetchRTLConfig', status: APICallStatusEnum.COMPLETED } }));
        let searchNode: Node | null = null;
        rtlConfig.nodes.forEach((node) => {
          node.settings.currencyUnits = [...CURRENCY_UNITS, (node.settings?.currencyUnit ? node.settings?.currencyUnit : '')];
          if (+(node.index || -1) === rtlConfig.selectedNodeIndex) {
            searchNode = node;
          }
        });
        if (searchNode) {
          this.store.dispatch(setSelectedNode({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, prevLnNodeIndex: -1, currentLnNode: searchNode, isInitialSetup: true } }));
          return {
            type: RTLActions.SET_APPLICATION_SETTINGS,
            payload: rtlConfig
          };
        } else {
          return {
            type: RTLActions.VOID
          };
        }
      }),
      catchError((err) => {
        this.handleErrorWithAlert('FetchRTLConfig', UI_MESSAGES.GET_RTL_CONFIG, 'Fetch RTL Config Failed!', API_END_POINTS.CONF_API, err);
        return of({ type: RTLActions.VOID });
      }))
  );

  updateNodeSettings = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.UPDATE_NODE_SETTINGS),
      mergeMap((action: { type: string, payload: Node }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.UPDATE_NODE_SETTINGS }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'updateNodeSettings', status: APICallStatusEnum.INITIATED } }));
        if (!action.payload.settings.fiatConversion) {
          delete action.payload.settings.currencyUnit;
        }
        delete action.payload.settings.currencyUnits;
        return this.httpClient.post(API_END_POINTS.CONF_API + '/node', action.payload).
          pipe(map((updatedNode: Node) => {
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'updateNodeSettings', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.UPDATE_NODE_SETTINGS }));
            updatedNode.settings.currencyUnits = [...CURRENCY_UNITS, (updatedNode.settings?.currencyUnit ? updatedNode.settings?.currencyUnit : '')];
            this.store.dispatch(setSelectedNodeSettings({ payload: updatedNode }));
            return {
              type: RTLActions.OPEN_SNACK_BAR,
              payload: 'Node settings updated successfully!'
            };
          }), catchError((err: any) => {
            this.handleErrorWithAlert('updateNodeSettings', UI_MESSAGES.UPDATE_NODE_SETTINGS, 'Update Node Settings Failed!', API_END_POINTS.CONF_API + '/node', err);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  updateApplicationSettings = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.UPDATE_APPLICATION_SETTINGS),
      mergeMap((action: { type: string, payload: { showSnackBar: boolean, message: string, config: RTLConfiguration } }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.UPDATE_APPLICATION_SETTINGS }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'updateApplicationSettings', status: APICallStatusEnum.INITIATED } }));
        action.payload.config.nodes.forEach((node) => {
          delete node.settings.currencyUnits;
        });
        return this.httpClient.post(API_END_POINTS.CONF_API + '/application', action.payload.config).
          pipe(map((appConfig: RTLConfiguration) => {
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'updateApplicationSettings', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.UPDATE_APPLICATION_SETTINGS }));
            if (action.payload.showSnackBar) {
              this.store.dispatch(openSnackBar({ payload: action.payload.message }));
            }
            return {
              type: RTLActions.SET_APPLICATION_SETTINGS,
              payload: appConfig
            };
          }), catchError((err: any) => {
            this.handleErrorWithAlert('updateApplicationSettings', UI_MESSAGES.UPDATE_APPLICATION_SETTINGS, 'Update Application Settings Failed!', API_END_POINTS.CONF_API + '/application', err);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  configFetch = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.FETCH_CONFIG),
      mergeMap((action: { type: string, payload: string }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.OPEN_CONFIG_FILE }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'fetchConfig', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.get(API_END_POINTS.CONF_API + '/config/' + action.payload).
          pipe(map((configFile: any) => {
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'fetchConfig', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.OPEN_CONFIG_FILE }));
            return {
              type: RTLActions.SHOW_CONFIG,
              payload: configFile
            };
          }), catchError((err: any) => {
            this.handleErrorWithAlert('fetchConfig', UI_MESSAGES.OPEN_CONFIG_FILE, 'Fetch Config Failed!', API_END_POINTS.CONF_API + '/config/' + action.payload, err);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  showLnConfig = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SHOW_CONFIG),
      map((action: { type: string, payload: any }) => action.payload)),
    { dispatch: false }
  );

  isAuthorized = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.IS_AUTHORIZED),
      mergeMap((action: { type: string, payload: string }) => {
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'IsAuthorized', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(API_END_POINTS.AUTHENTICATE_API, {
          authenticateWith: (!action.payload || action.payload.trim() === '') ? AuthenticateWith.JWT : AuthenticateWith.PASSWORD,
          authenticationValue: (!action.payload || action.payload.trim() === '') ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : action.payload
        }).pipe(map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'IsAuthorized', status: APICallStatusEnum.COMPLETED } }));
          this.logger.info('Successfully Authorized!');
          return {
            type: RTLActions.IS_AUTHORIZED_RES,
            payload: postRes
          };
        }), catchError((err) => {
          this.handleErrorWithAlert('IsAuthorized', UI_MESSAGES.NO_SPINNER, 'Authorization Failed', API_END_POINTS.AUTHENTICATE_API, err);
          return of({
            type: RTLActions.IS_AUTHORIZED_RES,
            payload: 'ERROR'
          });
        }));
      }))
  );

  isAuthorizedRes = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.IS_AUTHORIZED_RES),
      map((action: { type: string, payload: any }) => action.payload)),
    { dispatch: false }
  );

  authLogin = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.LOGIN),
      withLatestFrom(this.store.select(rootAppConfig)),
      mergeMap(([action, appConfig]: [{ type: string, payload: Login }, RTLConfiguration]) => {
        this.store.dispatch(resetLNDStore());
        this.store.dispatch(resetCLNStore());
        this.store.dispatch(resetECLStore());
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'Login', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(API_END_POINTS.AUTHENTICATE_API, {
          authenticateWith: (!action.payload.password) ? AuthenticateWith.JWT : AuthenticateWith.PASSWORD,
          authenticationValue: (!action.payload.password) ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : action.payload.password,
          twoFAToken: (action.payload.twoFAToken) ? action.payload.twoFAToken : ''
        }).pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'Login', status: APICallStatusEnum.COMPLETED } }));
            this.setLoggedInDetails(action.payload.defaultPassword, postRes);
          }),
          catchError((err) => {
            this.logger.info('Redirecting to Login Error Page');
            this.handleErrorWithoutAlert('Login', UI_MESSAGES.NO_SPINNER, err);
            if (+appConfig.SSO.rtlSSO) {
              this.router.navigate(['/error'], { state: { errorCode: '406', errorMessage: err.error && err.error.error ? err.error.error : 'Single Sign On Failed!' } });
            } else {
              this.router.navigate(['./login'], { state: { logoutReason: err.error && err.error.error ? err.error.error : 'Single Sign On Failed!' } });
            }
            return of({ type: RTLActions.VOID });
          }));
      })),
    { dispatch: false }
  );

  tokenVerify = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.VERIFY_TWO_FA),
      mergeMap((action: { type: string, payload: VerifyTwoFA }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.VERIFY_TOKEN }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'VerifyToken', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(API_END_POINTS.AUTHENTICATE_API + '/token', { authentication2FA: action.payload.token }).
          pipe(
            map((postRes: any) => {
              this.logger.info(postRes);
              this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.VERIFY_TOKEN }));
              this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'VerifyToken', status: APICallStatusEnum.COMPLETED } }));
              this.logger.info('Token Successfully Verified!');
              this.setLoggedInDetails(false, action.payload.authResponse);
            }),
            catchError((err) => {
              this.handleErrorWithAlert('VerifyToken', UI_MESSAGES.VERIFY_TOKEN, 'Authorization Failed!', API_END_POINTS.AUTHENTICATE_API + '/token', err);
              return of({ type: RTLActions.VOID });
            })
          );
      })),
    { dispatch: false }
  );

  logOut = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.LOGOUT),
      withLatestFrom(this.store.select(rootAppConfig)),
      mergeMap(([action, appConfig]: [{ type: string, payload: string }, RTLConfiguration]) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.LOG_OUT }));
        if (appConfig.SSO && +appConfig.SSO.rtlSSO) {
          window.location.href = appConfig.SSO.logoutRedirectLink;
        } else {
          this.router.navigate(['./login'], { state: { logoutReason: action.payload } });
        }
        this.sessionService.clearAll();
        this.store.dispatch(setNodeData({ payload: {} }));
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.LOG_OUT }));
        this.logger.info('Logged out from browser');
        return this.httpClient.get(API_END_POINTS.AUTHENTICATE_API + '/logout').
          pipe(map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.LOG_OUT }));
            this.logger.info('Logged out from server');
          }));
      })),
    { dispatch: false }
  );

  resetPassword = createEffect(
    () => this.actions.pipe(takeUntil(this.unSubs[1]),
      ofType(RTLActions.RESET_PASSWORD),
      mergeMap((action: { type: string, payload: ResetPassword }) => {
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'ResetPassword', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(API_END_POINTS.AUTHENTICATE_API + '/reset', { currPassword: action.payload.currPassword, newPassword: action.payload.newPassword }).pipe(
          takeUntil(this.unSubs[0]),
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'ResetPassword', status: APICallStatusEnum.COMPLETED } }));
            this.sessionService.setItem('defaultPassword', false);
            this.logger.info('Password Reset Successful!');
            this.store.dispatch(openSnackBar({ payload: 'Password Reset Successful!' }));
            this.SetToken(postRes.token);
            return {
              type: RTLActions.RESET_PASSWORD_RES,
              payload: postRes.token
            };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('ResetPassword', UI_MESSAGES.NO_SPINNER, 'Password Reset Failed!', API_END_POINTS.AUTHENTICATE_API + '/reset', err);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  setSelectedNode = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SET_SELECTED_NODE),
      mergeMap((action: { type: string, payload: UpdateSelectedNode }) => {
        this.store.dispatch(openSpinner({ payload: action.payload.uiMessage }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.get(API_END_POINTS.CONF_API + '/updateSelNode/' + action.payload.currentLnNode?.index + '/' + action.payload.prevLnNodeIndex).pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: action.payload.uiMessage }));
            this.initializeNode(postRes, action.payload.isInitialSetup);
            return { type: RTLActions.VOID };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('UpdateSelNode', action.payload.uiMessage, 'Update Selected Node Failed!', API_END_POINTS.CONF_API + '/updateSelNode', err);
            return of({ type: RTLActions.VOID });
          })
        );
      }))
  );

  fetchFile = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.FETCH_FILE),
      mergeMap((action: { type: string, payload: FetchFile }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.DOWNLOAD_BACKUP_FILE }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'FetchFile', status: APICallStatusEnum.INITIATED } }));
        const query = '?channel=' + action.payload.channelPoint + (action.payload.path ? '&path=' + action.payload.path : '');
        return this.httpClient.get(API_END_POINTS.CONF_API + '/file' + query).pipe(
          map((fetchedFile: any) => {
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'FetchFile', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.DOWNLOAD_BACKUP_FILE }));
            return {
              type: RTLActions.SHOW_FILE,
              payload: fetchedFile
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('fetchFile', UI_MESSAGES.DOWNLOAD_BACKUP_FILE, 'Download Backup File Failed!', API_END_POINTS.CONF_API + '/file' + query, { status: this.commonService.extractErrorNumber(err), error: { error: this.commonService.extractErrorCode(err) } });
            return of({ type: RTLActions.VOID });
          })
        );
      }))
  );

  showFile = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SHOW_FILE),
      map((action: { type: string, payload: any }) => action.payload)),
    { dispatch: false }
  );

  initializeNode(node: Node, isInitialSetup: boolean) {
    this.logger.info('Initializing node from RTL Effects.');
    const landingPage = isInitialSetup ? '' : 'HOME';
    this.sessionService.removeItem('lndUnlocked');
    this.sessionService.removeItem('clnUnlocked');
    this.sessionService.removeItem('eclUnlocked');
    node.settings.currencyUnits = [...CURRENCY_UNITS, (node.settings?.currencyUnit ? node.settings?.currencyUnit : '')];
    this.store.dispatch(resetRootStore({ payload: node }));
    this.store.dispatch(resetLNDStore());
    this.store.dispatch(resetCLNStore());
    this.store.dispatch(resetECLStore());
    if (this.sessionService.getItem('token')) {
      const nodeLnImplementation = node.lnImplementation ? node.lnImplementation.toUpperCase() : 'LND';
      this.dataService.setLnImplementation(nodeLnImplementation);
      const apiUrl = (!isDevMode() && window.location.origin) ? (window.location.origin + '/rtl/api') : API_URL;
      this.wsService.connectWebSocket(apiUrl?.replace(/^http/, 'ws') + API_END_POINTS.Web_SOCKET_API, (node.index ? node.index.toString() : '-1'));
      switch (nodeLnImplementation) {
        case 'CLN':
          this.store.dispatch(fetchPageSettingsCLN());
          this.store.dispatch(fetchInfoCLN({ payload: { loadPage: landingPage } }));
          break;

        case 'ECL':
          this.store.dispatch(fetchPageSettingsECL());
          this.store.dispatch(fetchInfoECL({ payload: { loadPage: landingPage } }));
          break;

        default:
          this.store.dispatch(fetchPageSettingsLND());
          this.store.dispatch(fetchInfoLND({ payload: { loadPage: landingPage } }));
          break;
      }
    }
  }

  SetToken(token: string) {
    if (token) {
      this.sessionService.setItem('lndUnlocked', 'true');
      this.sessionService.setItem('token', token);
    } else {
      this.sessionService.removeItem('lndUnlocked');
      this.sessionService.removeItem('token');
    }
  }

  setLoggedInDetails(defaultPassword: boolean, postRes: any) {
    this.logger.info('Successfully Authorized!');
    this.SetToken(postRes.token);
    this.sessionService.setItem('defaultPassword', defaultPassword);
    if (defaultPassword) {
      this.store.dispatch(openSnackBar({ payload: 'Reset your password.' }));
      this.router.navigate(['/settings/auth']);
    } else {
      this.store.dispatch(fetchRTLConfig());
    }
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401 && actionName !== 'Login') {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(closeAllDialogs());
      this.store.dispatch(logout({ payload: 'Authentication Failed: ' + JSON.stringify(err.error) }));
    } else {
      this.store.dispatch(closeSpinner({ payload: uiMessage }));
      this.store.dispatch(updateRootAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status ? err.status.toString() : '', message: this.commonService.extractErrorMessage(err) } }));
    }
  }

  handleErrorWithAlert(actionName: string, uiMessage: string, alertTitle: string, errURL: string, err: { status: number, error: any, statusText?: string }) {
    this.logger.error(err);
    if (err.status === 0 && err.statusText && err.statusText === 'Unknown Error') {
      err = { status: 400, error: { message: 'Unknown Error / CORS Origin Not Allowed' } };
    }
    if (err.status === 401 && actionName !== 'Login') {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(closeAllDialogs());
      this.store.dispatch(logout({ payload: 'Authentication Failed: ' + JSON.stringify(err.error) }));
    } else {
      this.store.dispatch(closeSpinner({ payload: uiMessage }));
      const errMsg = this.commonService.extractErrorMessage(err);
      this.store.dispatch(openAlert({
        payload: {
          data: {
            type: 'ERROR',
            alertTitle: alertTitle,
            message: { code: err.status ? err.status : 'Unknown Error', message: errMsg, URL: errURL },
            component: ErrorMessageComponent
          }
        }
      }));
      this.store.dispatch(updateRootAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status ? err.status.toString() : '', message: errMsg, URL: errURL } }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
