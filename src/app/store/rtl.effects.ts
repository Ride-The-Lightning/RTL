import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, Subject, forkJoin, Observable } from 'rxjs';
import { map, mergeMap, catchError, take, withLatestFrom, takeUntil } from 'rxjs/operators';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { environment, API_URL } from '../../environments/environment';
import { WebSocketClientService } from '../shared/services/web-socket.service';
import { LoggerService } from '../shared/services/logger.service';
import { SessionService } from '../shared/services/session.service';
import { CommonService } from '../shared/services/common.service';
import { DataService } from '../shared/services/data.service';
import { RTLConfiguration, Settings, ConfigSettingsNode } from '../shared/models/RTLconfig';
import { RTLActions, APICallStatusEnum, AuthenticateWith, CURRENCY_UNITS, ScreenSizeEnum, UI_MESSAGES } from '../shared/services/consts-enums-functions';
import { DialogConfig } from '../shared/models/alertData';
import { FetchFile, Login, OpenSnackBar, ResetPassword, SaveSettings, SetSelectedNode, UpdateServiceSetting, VerifyTwoFA } from '../shared/models/rtlModels';

import { SpinnerDialogComponent } from '../shared/components/data-modal/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from '../shared/components/data-modal/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from '../shared/components/data-modal/confirmation-message/confirmation-message.component';
import { ErrorMessageComponent } from '../shared/components/data-modal/error-message/error-message.component';
import { ShowPubkeyComponent } from '../shared/components/data-modal/show-pubkey/show-pubkey.component';

import { RootState, RTLState } from './rtl.state';
import { resetRootStore, setNodeData, setSelectedNode, updateAPICallStatus, closeSpinner, openAlert, openSpinner, openSnackBar, fetchRTLConfig, closeAllDialogs, logout } from './rtl.actions';
import { fetchInfoLND, resetLNDStore } from '../lnd/store/lnd.actions';
import { fetchInfoCL, resetCLStore } from '../clightning/store/cl.actions';
import { fetchInfoECL, resetECLStore } from '../eclair/store/ecl.actions';

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
      map((payload: string | OpenSnackBar) => {
        if (typeof payload === 'string') {
          this.snackBar.open(payload);
        } else {
          if (payload.type === 'ERROR') {
            this.snackBar.open(payload.message, '', { duration: payload.duration ? payload.duration : 2000, panelClass: 'rtl-warn-snack-bar' });
          } else if (payload.type === 'WARN') {
            this.snackBar.open(payload.message, '', { duration: payload.duration ? payload.duration : 2000, panelClass: 'rtl-accent-snack-bar' });
          } else {
            this.snackBar.open(payload.message, '', { duration: payload.duration ? payload.duration : 2000, panelClass: 'rtl-snack-bar' });
          }
        }
      })),
    { dispatch: false }
  );

  openSpinner = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.OPEN_SPINNER),
      map((payload: string) => {
        if (payload !== UI_MESSAGES.NO_SPINNER) {
          this.dialogRef = this.dialog.open(SpinnerDialogComponent, { data: { titleMessage: payload } });
        }
      })),
    { dispatch: false }
  );

  closeSpinner = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.CLOSE_SPINNER),
      map((payload: string) => {
        if (payload !== UI_MESSAGES.NO_SPINNER) {
          try {
            if (this.dialogRef && (this.dialogRef.componentInstance && this.dialogRef.componentInstance.data && this.dialogRef.componentInstance.data.titleMessage && this.dialogRef.componentInstance.data.titleMessage === payload)) {
              this.dialogRef.close();
            } else {
              this.dialog.openDialogs.forEach((localDialog) => {
                if (localDialog.componentInstance && localDialog.componentInstance.data && localDialog.componentInstance.data.titleMessage && localDialog.componentInstance.data.titleMessage === payload) {
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
      map((payload: DialogConfig) => {
        payload.width = this.alertWidth;
        if (payload.data.component) {
          this.dialogRef = this.dialog.open(payload.data.component, payload);
        } else {
          this.dialogRef = this.dialog.open(AlertMessageComponent, payload);
        }
      })),
    { dispatch: false }
  );

  closeAlert = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.CLOSE_ALERT),
      map((payload: any) => {
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        return payload;
      })),
    { dispatch: false }
  );

  openConfirm = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.OPEN_CONFIRMATION),
      map((payload: DialogConfig) => {
        payload.width = this.confirmWidth;
        this.dialogRef = this.dialog.open(ConfirmationMessageComponent, payload);
      })),
    { dispatch: false }
  );

  closeConfirm = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.CLOSE_CONFIRMATION),
      take(1),
      map((payload: boolean) => {
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.logger.info(payload);
        return payload;
      })),
    { dispatch: false }
  );

  showNodePubkey = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SHOW_PUBKEY),
      withLatestFrom(this.store.select('root')),
      mergeMap(([payload, rootData]: [any, RootState]) => {
        if (!this.sessionService.getItem('token') || !rootData.nodeData.identity_pubkey) {
          this.snackBar.open('Node Pubkey does not exist.');
        } else {
          this.store.dispatch(openAlert({
            payload: {
              width: '70%', data: {
                information: rootData.nodeData,
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
      ofType(RTLActions.FETCH_RTL_CONFIG),
      mergeMap(() => {
        this.screenSize = this.commonService.getScreenSize();
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.alertWidth = '95%';
          this.confirmWidth = '95%';
        } else if (this.screenSize === ScreenSizeEnum.MD) {
          this.alertWidth = '80%';
          this.confirmWidth = '80%';
        } else {
          this.alertWidth = '55%';
          this.confirmWidth = '60%';
        }
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_RTL_CONFIG }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchRTLConfig', status: APICallStatusEnum.INITIATED } }));
        if (this.sessionService.getItem('token')) {
          return this.httpClient.get<RTLConfiguration>(environment.CONF_API + '/rtlconf');
        } else {
          return this.httpClient.get<RTLConfiguration>(environment.CONF_API + '/rtlconfinit');
        }
      }),
      map((rtlConfig: RTLConfiguration) => {
        this.logger.info(rtlConfig);
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_RTL_CONFIG }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'FetchRTLConfig', status: APICallStatusEnum.COMPLETED } }));
        let searchNode: ConfigSettingsNode;
        rtlConfig.nodes.forEach((node) => {
          node.settings.currencyUnits = [...CURRENCY_UNITS, node.settings.currencyUnit];
          if (+node.index === rtlConfig.selectedNodeIndex) {
            searchNode = node;
          }
        });
        if (searchNode) {
          this.store.dispatch(setSelectedNode({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, lnNode: searchNode, isInitialSetup: true } }));
          return {
            type: RTLActions.SET_RTL_CONFIG,
            payload: rtlConfig
          };
        } else {
          return {
            type: RTLActions.VOID
          };
        }
      }),
      catchError((err) => {
        this.handleErrorWithAlert('FetchRTLConfig', UI_MESSAGES.GET_RTL_CONFIG, 'Fetch RTL Config Failed!', environment.CONF_API, err);
        return of({ type: RTLActions.VOID });
      }))
  );

  settingSave = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SAVE_SETTINGS),
      mergeMap((payload: SaveSettings) => {
        this.store.dispatch(openSpinner({ payload: payload.uiMessage }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'UpdateSettings', status: APICallStatusEnum.INITIATED } }));
        let updateSettingReq = new Observable();
        if (payload.settings && payload.defaultNodeIndex) {
          const settingsRes = this.httpClient.post<Settings>(environment.CONF_API, { updatedSettings: payload.settings });
          const defaultNodeRes = this.httpClient.post(environment.CONF_API + '/updateDefaultNode', { defaultNodeIndex: payload.defaultNodeIndex });
          updateSettingReq = forkJoin([settingsRes, defaultNodeRes]);
        } else if (payload.settings && !payload.defaultNodeIndex) {
          updateSettingReq = this.httpClient.post(environment.CONF_API, { updatedSettings: payload.settings });
        } else if (!payload.settings && payload.defaultNodeIndex) {
          updateSettingReq = this.httpClient.post(environment.CONF_API + '/updateDefaultNode', { defaultNodeIndex: payload.defaultNodeIndex });
        }
        return updateSettingReq.pipe(map((updateStatus: any) => {
          this.logger.info(updateStatus);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'UpdateSettings', status: APICallStatusEnum.COMPLETED } }));
          this.store.dispatch(closeSpinner({ payload: payload.uiMessage }));
          return {
            type: RTLActions.OPEN_SNACK_BAR,
            payload: (!updateStatus.length) ? updateStatus.message + '.' : updateStatus[0].message + '.'
          };
        }), catchError((err) => {
          this.handleErrorWithAlert('UpdateSettings', payload.uiMessage, 'Update Settings Failed!', environment.CONF_API, (!err.length) ? err : err[0]);
          return of({ type: RTLActions.VOID });
        }));
      }))
  );

  updateServicesettings = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.UPDATE_SERVICE_SETTINGS),
      mergeMap((payload: UpdateServiceSetting) => {
        this.store.dispatch(openSpinner({ payload: payload.uiMessage }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'UpdateServiceSettings', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.CONF_API + '/updateServiceSettings', payload).pipe(
          map((updateStatus: any) => {
            this.logger.info(updateStatus);
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'UpdateServiceSettings', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: payload.uiMessage }));
            return {
              type: RTLActions.OPEN_SNACK_BAR,
              payload: updateStatus.message + '.'
            };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('UpdateServiceSettings', payload.uiMessage, 'Update Service Settings Failed!', environment.CONF_API, err);
            return of({ type: RTLActions.VOID });
          })
        );
      }))
  );

  twoFASettingSave = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.TWO_FA_SAVE_SETTINGS),
      mergeMap((payload: { secret2fa: string }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.UPDATE_UI_SETTINGS }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'Update2FASettings', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.CONF_API + '/update2FA', { secret2fa: payload.secret2fa });
      }),
      map((updateStatus: any) => {
        this.logger.info(updateStatus);
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'Update2FASettings', status: APICallStatusEnum.COMPLETED } }));
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.UPDATE_UI_SETTINGS }));
        return { type: RTLActions.VOID };
      }),
      catchError((err) => {
        this.handleErrorWithAlert('Update2FASettings', UI_MESSAGES.UPDATE_UI_SETTINGS, 'Update 2FA Settings Failed!', environment.CONF_API, err);
        return of({ type: RTLActions.VOID });
      }))
  );

  configFetch = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.FETCH_CONFIG),
      mergeMap((payload: string) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.OPEN_CONFIG_FILE }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'fetchConfig', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.get(environment.CONF_API + '/config/' + payload).
          pipe(map((configFile: any) => {
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'fetchConfig', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.OPEN_CONFIG_FILE }));
            return {
              type: RTLActions.SHOW_CONFIG,
              payload: configFile
            };
          }), catchError((err: any) => {
            this.handleErrorWithAlert('fetchConfig', UI_MESSAGES.OPEN_CONFIG_FILE, 'Fetch Config Failed!', environment.CONF_API + '/config/' + payload, err);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  showLnConfig = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SHOW_CONFIG),
      map((payload: any) => payload)),
    { dispatch: false }
  );

  isAuthorized = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.IS_AUTHORIZED),
      mergeMap((payload: string) => {
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'IsAuthorized', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.AUTHENTICATE_API, {
          authenticateWith: (!payload || payload.trim() === '') ? AuthenticateWith.JWT : AuthenticateWith.PASSWORD,
          authenticationValue: (!payload || payload.trim() === '') ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : payload
        }).pipe(map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(updateAPICallStatus({ payload: { action: 'IsAuthorized', status: APICallStatusEnum.COMPLETED } }));
          this.logger.info('Successfully Authorized!');
          return {
            type: RTLActions.IS_AUTHORIZED_RES,
            payload: postRes
          };
        }), catchError((err) => {
          this.handleErrorWithAlert('IsAuthorized', UI_MESSAGES.NO_SPINNER, 'Authorization Failed', environment.AUTHENTICATE_API, err);
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
      map((payload: any) => payload)),
    { dispatch: false }
  );

  authLogin = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.LOGIN),
      withLatestFrom(this.store.select('root')),
      mergeMap(([payload, rootStore]: [Login, RootState]) => {
        this.store.dispatch(resetLNDStore({ payload: null }));
        this.store.dispatch(resetCLStore({ payload: null }));
        this.store.dispatch(resetECLStore({ payload: null }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'Login', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.AUTHENTICATE_API, {
          authenticateWith: (!payload.password) ? AuthenticateWith.JWT : AuthenticateWith.PASSWORD,
          authenticationValue: (!payload.password) ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : payload.password,
          twoFAToken: (payload.twoFAToken) ? payload.twoFAToken : ''
        }).pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'Login', status: APICallStatusEnum.COMPLETED } }));
            this.setLoggedInDetails(payload.defaultPassword, postRes, rootStore);
          }),
          catchError((err) => {
            this.logger.info('Redirecting to Login Error Page');
            this.handleErrorWithoutAlert('Login', UI_MESSAGES.NO_SPINNER, err);
            if (+rootStore.appConfig.sso.rtlSSO) {
              this.router.navigate(['/error'], { state: { errorCode: '406', errorMessage: err.error && err.error.error ? err.error.error : 'Single Sign On Failed!' } });
            } else {
              this.router.navigate(['./login']);
            }
            return of({ type: RTLActions.VOID });
          }));
      })),
    { dispatch: false }
  );

  tokenVerify = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.VERIFY_TWO_FA),
      withLatestFrom(this.store.select('root')),
      mergeMap(([payload, rootStore]: [VerifyTwoFA, RootState]) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.VERIFY_TOKEN }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'VerifyToken', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.AUTHENTICATE_API + '/token', { authentication2FA: payload.token }).
          pipe(
            map((postRes: any) => {
              this.logger.info(postRes);
              this.store.dispatch(openSpinner({ payload: UI_MESSAGES.VERIFY_TOKEN }));
              this.store.dispatch(updateAPICallStatus({ payload: { action: 'VerifyToken', status: APICallStatusEnum.COMPLETED } }));
              this.logger.info('Token Successfully Verified!');
              this.setLoggedInDetails(false, payload.authResponse, rootStore);
            }),
            catchError((err) => {
              this.handleErrorWithAlert('VerifyToken', UI_MESSAGES.VERIFY_TOKEN, 'Authorization Failed!', environment.AUTHENTICATE_API + '/token', err);
              return of({ type: RTLActions.VOID });
            })
          );
      })),
    { dispatch: false }
  );

  logOut = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.LOGOUT),
      withLatestFrom(this.store.select('root')),
      mergeMap(([payload, store]) => {
        if (+store.appConfig.sso.rtlSSO) {
          window.location.href = store.appConfig.sso.logoutRedirectLink;
        } else {
          this.router.navigate(['./login']);
        }
        this.sessionService.clearAll();
        this.store.dispatch(setNodeData(null));
        return this.httpClient.get(environment.AUTHENTICATE_API + '/logout').
          pipe(map((postRes: any) => {
            this.logger.info(postRes);
            this.logger.warn('LOGGED OUT');
          }));
      })),
    { dispatch: false }
  );

  resetPassword = createEffect(
    () => this.actions.pipe(takeUntil(this.unSubs[1]),
      ofType(RTLActions.RESET_PASSWORD),
      mergeMap((payload: ResetPassword) => {
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'ResetPassword', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.AUTHENTICATE_API + '/reset', { currPassword: payload.currPassword, newPassword: payload.newPassword }).pipe(
          takeUntil(this.unSubs[0]),
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'ResetPassword', status: APICallStatusEnum.COMPLETED } }));
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
            this.handleErrorWithAlert('ResetPassword', UI_MESSAGES.NO_SPINNER, 'Password Reset Failed!', environment.AUTHENTICATE_API + '/reset', err);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  setSelectedNode = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SET_SELECTED_NODE),
      mergeMap((payload: SetSelectedNode) => {
        this.store.dispatch(openSpinner({ payload: payload.uiMessage }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.CONF_API + '/updateSelNode', { selNodeIndex: payload.lnNode.index }).pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: payload.uiMessage }));
            this.initializeNode(payload.lnNode, payload.isInitialSetup);
            return { type: RTLActions.VOID };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('UpdateSelNode', payload.uiMessage, 'Update Selected Node Failed!', environment.CONF_API + '/updateSelNode', err);
            return of({ type: RTLActions.VOID });
          })
        );
      }))
  );

  fetchFile = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.FETCH_FILE),
      mergeMap((payload: FetchFile) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.DOWNLOAD_BACKUP_FILE }));
        this.store.dispatch(updateAPICallStatus({ payload: { action: 'fetchFile', status: APICallStatusEnum.INITIATED } }));
        const query = '?channel=' + payload.channelPoint + (payload.path ? '&path=' + payload.path : '');
        return this.httpClient.get(environment.CONF_API + '/file' + query).pipe(
          map((fetchedFile: any) => {
            this.store.dispatch(updateAPICallStatus({ payload: { action: 'fetchFile', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.DOWNLOAD_BACKUP_FILE }));
            return {
              type: RTLActions.SHOW_FILE,
              payload: fetchedFile
            };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('fetchFile', UI_MESSAGES.DOWNLOAD_BACKUP_FILE, 'Download Backup File Failed!', environment.CONF_API + '/file' + query, { status: this.commonService.extractErrorNumber(err), error: { error: this.commonService.extractErrorCode(err) } });
            return of({ type: RTLActions.VOID });
          })
        );
      }))
  );

  showFile = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SHOW_FILE),
      map((payload: any) => payload)),
    { dispatch: false }
  );

  initializeNode(node: any, isInitialSetup: boolean) {
    this.logger.info('Initializing node from RTL Effects.');
    const landingPage = isInitialSetup ? '' : 'HOME';
    let selNode = {};
    if (node.settings.fiatConversion && node.settings.currencyUnit) {
      selNode = { userPersona: node.settings.userPersona, channelBackupPath: node.settings.channelBackupPath, selCurrencyUnit: node.settings.currencyUnit, currencyUnits: [...CURRENCY_UNITS, node.settings.currencyUnit], fiatConversion: node.settings.fiatConversion, lnImplementation: node.lnImplementation, swapServerUrl: node.settings.swapServerUrl, boltzServerUrl: node.settings.boltzServerUrl };
    } else {
      selNode = { userPersona: node.settings.userPersona, channelBackupPath: node.settings.channelBackupPath, selCurrencyUnit: node.settings.currencyUnit, currencyUnits: CURRENCY_UNITS, fiatConversion: node.settings.fiatConversion, lnImplementation: node.lnImplementation, swapServerUrl: node.settings.swapServerUrl, boltzServerUrl: node.settings.boltzServerUrl };
    }
    this.sessionService.removeItem('lndUnlocked');
    this.sessionService.removeItem('clUnlocked');
    this.sessionService.removeItem('eclUnlocked');
    this.store.dispatch(resetRootStore(node));
    this.store.dispatch(resetLNDStore({ payload: selNode }));
    this.store.dispatch(resetCLStore({ payload: selNode }));
    this.store.dispatch(resetECLStore({ payload: selNode }));
    if (this.sessionService.getItem('token')) {
      const apiUrl = (environment.production && window.location.origin) ? (window.location.origin + '/rtl/api') : API_URL;
      this.wsService.connectWebSocket(apiUrl.replace(/^http/, 'ws') + environment.Web_SOCKET_API);
      node.lnImplementation = node.lnImplementation.toUpperCase();
      this.dataService.setChildAPIUrl(node.lnImplementation);
      switch (node.lnImplementation) {
        case 'CLT':
          this.store.dispatch(fetchInfoCL({ payload: { loadPage: landingPage } }));
          break;

        case 'ECL':
          this.store.dispatch(fetchInfoECL({ payload: { loadPage: landingPage } }));
          break;

        default:
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

  setLoggedInDetails(defaultPassword: boolean, postRes: any, rootStore: any) {
    this.logger.info('Successfully Authorized!');
    this.SetToken(postRes.token);
    this.store.dispatch(fetchRTLConfig());
    rootStore.selNode.settings.currencyUnits = [...CURRENCY_UNITS, rootStore.selNode.settings.currencyUnit];
    this.sessionService.setItem('defaultPassword', defaultPassword);
    if (defaultPassword) {
      this.sessionService.setItem('defaultPassword', 'true');
      this.store.dispatch(openSnackBar({ payload: 'Reset your password.' }));
      this.router.navigate(['/settings/auth']);
    }
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401 && actionName !== 'Login') {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(closeAllDialogs());
      this.store.dispatch(logout());
      this.store.dispatch(openSnackBar({ payload: 'Authentication Failed. Redirecting to Login.' }));
    } else {
      this.store.dispatch(closeSpinner({ payload: uiMessage }));
      this.store.dispatch(updateAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: this.commonService.extractErrorMessage(err) } }));
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
      this.store.dispatch(logout());
      this.store.dispatch(openSnackBar({ payload: 'Authentication Failed. Redirecting to Login.' }));
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
      this.store.dispatch(updateAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: errMsg, URL: errURL } }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
