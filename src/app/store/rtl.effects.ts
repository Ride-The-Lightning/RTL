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
import { RTLConfiguration, Settings, ConfigSettingsNode, GetInfoRoot } from '../shared/models/RTLconfig';
import { RTLActions, APICallStatusEnum, AuthenticateWith, CURRENCY_UNITS, ScreenSizeEnum, UI_MESSAGES } from '../shared/services/consts-enums-functions';
import { DialogConfig } from '../shared/models/alertData';
import { FetchFile, Login, OpenSnackBar, ResetPassword, SaveSettings, SetSelectedNode, UpdateServiceSetting, VerifyTwoFA } from '../shared/models/rtlModels';

import { SpinnerDialogComponent } from '../shared/components/data-modal/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from '../shared/components/data-modal/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from '../shared/components/data-modal/confirmation-message/confirmation-message.component';
import { ErrorMessageComponent } from '../shared/components/data-modal/error-message/error-message.component';
import { ShowPubkeyComponent } from '../shared/components/data-modal/show-pubkey/show-pubkey.component';

import { RTLState } from './rtl.state';
import { resetRootStore, setNodeData, setSelectedNode, updateRootAPICallStatus, closeSpinner, openAlert, openSpinner, openSnackBar, fetchRTLConfig, closeAllDialogs, logout, updateRootNodeSettings, setRTLConfig } from './rtl.actions';
import { fetchInfoLND, resetLNDStore } from '../lnd/store/lnd.actions';
import { fetchInfoCL, resetCLStore } from '../cln/store/cln.actions';
import { fetchInfoECL, resetECLStore } from '../eclair/store/ecl.actions';
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
          this.dialogRef = this.dialog.open(SpinnerDialogComponent, { data: { titleMessage: action.payload } });
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
      map((action: { type: string, payload: boolean }) => {
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
          this.alertWidth = '45%';
          this.confirmWidth = '50%';
        }
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.GET_RTL_CONFIG }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'FetchRTLConfig', status: APICallStatusEnum.INITIATED } }));
        if (this.sessionService.getItem('token')) {
          return this.httpClient.get<RTLConfiguration>(environment.CONF_API + '/rtlconf');
        } else {
          return this.httpClient.get<RTLConfiguration>(environment.CONF_API + '/rtlconfinit');
        }
      }),
      map((rtlConfig: RTLConfiguration) => {
        this.logger.info(rtlConfig);
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.GET_RTL_CONFIG }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'FetchRTLConfig', status: APICallStatusEnum.COMPLETED } }));
        let searchNode: ConfigSettingsNode;
        rtlConfig.nodes.forEach((node) => {
          node.settings.currencyUnits = [...CURRENCY_UNITS, node.settings.currencyUnit];
          if (+node.index === rtlConfig.selectedNodeIndex) {
            searchNode = node;
          }
        });
        if (searchNode) {
          this.store.dispatch(setSelectedNode({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, prevLnNodeIndex: -1, currentLnNode: searchNode, isInitialSetup: true } }));
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
      mergeMap((action: { type: string, payload: SaveSettings }) => {
        this.store.dispatch(openSpinner({ payload: action.payload.uiMessage }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'UpdateSettings', status: APICallStatusEnum.INITIATED } }));
        let updateSettingReq = new Observable();
        if (action.payload.settings && action.payload.defaultNodeIndex) {
          const settingsRes = this.httpClient.post<Settings>(environment.CONF_API, { updatedSettings: action.payload.settings });
          const defaultNodeRes = this.httpClient.post(environment.CONF_API + '/updateDefaultNode', { defaultNodeIndex: action.payload.defaultNodeIndex });
          updateSettingReq = forkJoin([settingsRes, defaultNodeRes]);
        } else if (action.payload.settings && !action.payload.defaultNodeIndex) {
          updateSettingReq = this.httpClient.post(environment.CONF_API, { updatedSettings: action.payload.settings });
        } else if (!action.payload.settings && action.payload.defaultNodeIndex) {
          updateSettingReq = this.httpClient.post(environment.CONF_API + '/updateDefaultNode', { defaultNodeIndex: action.payload.defaultNodeIndex });
        }
        return updateSettingReq.pipe(map((updateStatus: any) => {
          this.logger.info(updateStatus);
          this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'UpdateSettings', status: APICallStatusEnum.COMPLETED } }));
          this.store.dispatch(closeSpinner({ payload: action.payload.uiMessage }));
          return {
            type: RTLActions.OPEN_SNACK_BAR,
            payload: (!updateStatus.length) ? updateStatus.message + '.' : updateStatus[0].message + '.'
          };
        }), catchError((err) => {
          this.handleErrorWithAlert('UpdateSettings', action.payload.uiMessage, 'Update Settings Failed!', environment.CONF_API, (!err.length) ? err : err[0]);
          return of({ type: RTLActions.VOID });
        }));
      }))
  );

  updateServicesettings = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.UPDATE_SERVICE_SETTINGS),
      mergeMap((action: { type: string, payload: UpdateServiceSetting }) => {
        this.store.dispatch(openSpinner({ payload: action.payload.uiMessage }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'UpdateServiceSettings', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.CONF_API + '/updateServiceSettings', action.payload).pipe(
          map((updateStatus: any) => {
            this.logger.info(updateStatus);
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'UpdateServiceSettings', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: action.payload.uiMessage }));
            this.store.dispatch(updateRootNodeSettings({ payload: action.payload }));
            return {
              type: RTLActions.OPEN_SNACK_BAR,
              payload: updateStatus.message + '.'
            };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('UpdateServiceSettings', action.payload.uiMessage, 'Update Service Settings Failed!', environment.CONF_API, err);
            return of({ type: RTLActions.VOID });
          })
        );
      }))
  );

  twoFASettingSave = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.TWO_FA_SAVE_SETTINGS),
      mergeMap((action: { type: string, payload: { secret2fa: string } }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.UPDATE_UI_SETTINGS }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'Update2FASettings', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.CONF_API + '/update2FA', { secret2fa: action.payload.secret2fa });
      }),
      withLatestFrom(this.store.select(rootAppConfig)),
      map(([updateStatus, appConfig]: [any, RTLConfiguration]) => {
        this.logger.info(updateStatus);
        appConfig.enable2FA = !appConfig.enable2FA;
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'Update2FASettings', status: APICallStatusEnum.COMPLETED } }));
        this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.UPDATE_UI_SETTINGS }));
        this.store.dispatch(setRTLConfig({ payload: appConfig }));
      }),
      catchError((err) => {
        this.handleErrorWithAlert('Update2FASettings', UI_MESSAGES.UPDATE_UI_SETTINGS, 'Update 2FA Settings Failed!', environment.CONF_API, err);
        return of({ type: RTLActions.VOID });
      })),
    { dispatch: false }
  );

  configFetch = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.FETCH_CONFIG),
      mergeMap((action: { type: string, payload: string }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.OPEN_CONFIG_FILE }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'fetchConfig', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.get(environment.CONF_API + '/config/' + action.payload).
          pipe(map((configFile: any) => {
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'fetchConfig', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.OPEN_CONFIG_FILE }));
            return {
              type: RTLActions.SHOW_CONFIG,
              payload: configFile
            };
          }), catchError((err: any) => {
            this.handleErrorWithAlert('fetchConfig', UI_MESSAGES.OPEN_CONFIG_FILE, 'Fetch Config Failed!', environment.CONF_API + '/config/' + action.payload, err);
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
        return this.httpClient.post(environment.AUTHENTICATE_API, {
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
      map((action: { type: string, payload: any }) => action.payload)),
    { dispatch: false }
  );

  authLogin = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.LOGIN),
      withLatestFrom(this.store.select(rootAppConfig)),
      mergeMap(([action, appConfig]: [{ type: string, payload: Login }, RTLConfiguration]) => {
        this.store.dispatch(resetLNDStore({ payload: null }));
        this.store.dispatch(resetCLStore({ payload: null }));
        this.store.dispatch(resetECLStore({ payload: null }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'Login', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.AUTHENTICATE_API, {
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
            if (+appConfig.sso.rtlSSO) {
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
      mergeMap((action: { type: string, payload: VerifyTwoFA }) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.VERIFY_TOKEN }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'VerifyToken', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.AUTHENTICATE_API + '/token', { authentication2FA: action.payload.token }).
          pipe(
            map((postRes: any) => {
              this.logger.info(postRes);
              this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.VERIFY_TOKEN }));
              this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'VerifyToken', status: APICallStatusEnum.COMPLETED } }));
              this.logger.info('Token Successfully Verified!');
              this.setLoggedInDetails(false, action.payload.authResponse);
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
      withLatestFrom(this.store.select(rootAppConfig)),
      mergeMap(([action, appConfig]) => {
        this.store.dispatch(openSpinner({ payload: UI_MESSAGES.LOG_OUT }));
        return this.httpClient.get(environment.AUTHENTICATE_API + '/logout').
          pipe(map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(closeSpinner({ payload: UI_MESSAGES.LOG_OUT }));
            if (+appConfig.sso.rtlSSO) {
              window.location.href = appConfig.sso.logoutRedirectLink;
            } else {
              this.router.navigate(['./login']);
            }
            this.sessionService.clearAll();
            this.store.dispatch(setNodeData({ payload: {} }));
            this.logger.warn('LOGGED OUT');
          }));
      })),
    { dispatch: false }
  );

  resetPassword = createEffect(
    () => this.actions.pipe(takeUntil(this.unSubs[1]),
      ofType(RTLActions.RESET_PASSWORD),
      mergeMap((action: { type: string, payload: ResetPassword }) => {
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'ResetPassword', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.post(environment.AUTHENTICATE_API + '/reset', { currPassword: action.payload.currPassword, newPassword: action.payload.newPassword }).pipe(
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
            this.handleErrorWithAlert('ResetPassword', UI_MESSAGES.NO_SPINNER, 'Password Reset Failed!', environment.AUTHENTICATE_API + '/reset', err);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  setSelectedNode = createEffect(
    () => this.actions.pipe(
      ofType(RTLActions.SET_SELECTED_NODE),
      mergeMap((action: { type: string, payload: SetSelectedNode }) => {
        this.store.dispatch(openSpinner({ payload: action.payload.uiMessage }));
        this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.INITIATED } }));
        return this.httpClient.get(environment.CONF_API + '/updateSelNode/' + action.payload.currentLnNode.index + '/' + action.payload.prevLnNodeIndex).pipe(
          map((postRes: any) => {
            this.logger.info(postRes);
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'UpdateSelNode', status: APICallStatusEnum.COMPLETED } }));
            this.store.dispatch(closeSpinner({ payload: action.payload.uiMessage }));
            this.initializeNode(action.payload.currentLnNode, action.payload.isInitialSetup);
            return { type: RTLActions.VOID };
          }),
          catchError((err: any) => {
            this.handleErrorWithAlert('UpdateSelNode', action.payload.uiMessage, 'Update Selected Node Failed!', environment.CONF_API + '/updateSelNode', err);
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
        return this.httpClient.get(environment.CONF_API + '/file' + query).pipe(
          map((fetchedFile: any) => {
            this.store.dispatch(updateRootAPICallStatus({ payload: { action: 'FetchFile', status: APICallStatusEnum.COMPLETED } }));
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
      map((action: { type: string, payload: any }) => action.payload)),
    { dispatch: false }
  );

  initializeNode(node: ConfigSettingsNode, isInitialSetup: boolean) {
    this.logger.info('Initializing node from RTL Effects.');
    const landingPage = isInitialSetup ? '' : 'HOME';
    let selNode = {};
    if (node.settings.fiatConversion && node.settings.currencyUnit) {
      selNode = { userPersona: node.settings.userPersona, channelBackupPath: node.settings.channelBackupPath, selCurrencyUnit: node.settings.currencyUnit, currencyUnits: [...CURRENCY_UNITS, node.settings.currencyUnit], fiatConversion: node.settings.fiatConversion, lnImplementation: node.lnImplementation, swapServerUrl: node.settings.swapServerUrl, boltzServerUrl: node.settings.boltzServerUrl, enableOffers: node.settings.enableOffers };
    } else {
      selNode = { userPersona: node.settings.userPersona, channelBackupPath: node.settings.channelBackupPath, selCurrencyUnit: node.settings.currencyUnit, currencyUnits: CURRENCY_UNITS, fiatConversion: node.settings.fiatConversion, lnImplementation: node.lnImplementation, swapServerUrl: node.settings.swapServerUrl, boltzServerUrl: node.settings.boltzServerUrl, enableOffers: node.settings.enableOffers };
    }
    this.sessionService.removeItem('lndUnlocked');
    this.sessionService.removeItem('clUnlocked');
    this.sessionService.removeItem('eclUnlocked');
    this.store.dispatch(resetRootStore({ payload: node }));
    this.store.dispatch(resetLNDStore({ payload: selNode }));
    this.store.dispatch(resetCLStore({ payload: selNode }));
    this.store.dispatch(resetECLStore({ payload: selNode }));
    if (this.sessionService.getItem('token')) {
      const nodeLnImplementation = node.lnImplementation ? node.lnImplementation.toUpperCase() : 'LND';
      this.dataService.setLnImplementation(nodeLnImplementation);
      const apiUrl = (environment.production && window.location.origin) ? (window.location.origin + '/rtl/api') : API_URL;
      this.wsService.connectWebSocket(apiUrl.replace(/^http/, 'ws') + environment.Web_SOCKET_API, node.index.toString());
      switch (nodeLnImplementation) {
        case 'CLN':
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
      this.store.dispatch(logout());
      this.store.dispatch(openSnackBar({ payload: 'Authentication Failed. Redirecting to Login.' }));
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
      this.store.dispatch(updateRootAPICallStatus({ payload: { action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status ? err.status.toString() : '', message: errMsg, URL: errURL } }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
