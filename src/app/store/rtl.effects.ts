import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, Subject, forkJoin, Observable } from 'rxjs';
import { map, mergeMap, catchError, take, withLatestFrom, takeUntil } from 'rxjs/operators';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { environment } from '../../environments/environment';
import { LoggerService } from '../shared/services/logger.service';
import { SessionService } from '../shared/services/session.service';
import { CommonService } from '../shared/services/common.service';
import { DataService } from '../shared/services/data.service';
import { Settings, RTLConfiguration, ConfigSettingsNode } from '../shared/models/RTLconfig';
import { APICallStatusEnum, AuthenticateWith, CURRENCY_UNITS, ScreenSizeEnum, UI_MESSAGES } from '../shared/services/consts-enums-functions';

import { SpinnerDialogComponent } from '../shared/components/data-modal/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from '../shared/components/data-modal/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from '../shared/components/data-modal/confirmation-message/confirmation-message.component';
import { ErrorMessageComponent } from '../shared/components/data-modal/error-message/error-message.component';
import { ShowPubkeyComponent } from '../shared/components/data-modal/show-pubkey/show-pubkey.component';

import * as ECLActions from '../eclair/store/ecl.actions';
import * as CLActions from '../clightning/store/cl.actions';
import * as LNDActions from '../lnd/store/lnd.actions';
import * as RTLActions from './rtl.actions';
import * as fromRTLReducer from './rtl.reducers';

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
    private store: Store<fromRTLReducer.RTLState>,
    private logger: LoggerService,
    private sessionService: SessionService,
    private commonService: CommonService,
    private dataService: DataService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router) {}

  closeAllDialogs = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.CLOSE_ALL_DIALOGS),
    map((action: RTLActions.CloseAllDialogs) => {
      this.dialog.closeAll();
    })),
    { dispatch: false }
  );
  
  openSnackBar = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.OPEN_SNACK_BAR),
    map((action: RTLActions.OpenSnackBar) => {
      if (typeof action.payload === 'string') {
        this.snackBar.open(action.payload);
      } else {
        this.snackBar.open(action.payload.message, '', {duration: action.payload.duration});
      }
    })),
    { dispatch: false }
  );

  openSpinner = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.OPEN_SPINNER),
    map((action: RTLActions.OpenSpinner) => {
      if (action.payload !== UI_MESSAGES.NO_SPINNER) {
        this.dialogRef = this.dialog.open(SpinnerDialogComponent, { data: { titleMessage: action.payload}});
      }
    })),
    { dispatch: false }
  );

  closeSpinner = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.CLOSE_SPINNER),
    map((action: RTLActions.CloseSpinner) => {
      if(action.payload !== UI_MESSAGES.NO_SPINNER) {
        try {
          if (this.dialogRef && (this.dialogRef.componentInstance && this.dialogRef.componentInstance.data && this.dialogRef.componentInstance.data.titleMessage && this.dialogRef.componentInstance.data.titleMessage === action.payload)) { 
            this.dialogRef.close();
          } else {
            this.dialog.openDialogs.forEach(localDialog => {
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

  openAlert = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.OPEN_ALERT),
    map((action: RTLActions.OpenAlert) => {
      action.payload.width = this.alertWidth;
      if(action.payload.data.component) {
        this.dialogRef = this.dialog.open(action.payload.data.component, action.payload);
      } else {
        this.dialogRef = this.dialog.open(AlertMessageComponent, action.payload);
      }
    })),
    { dispatch: false }
  );

  closeAlert = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.CLOSE_ALERT),
    map((action: RTLActions.CloseAlert) => {
      if (this.dialogRef) { this.dialogRef.close(); }
      return action.payload;
    })),
    { dispatch: false }
  );

  openConfirm = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.OPEN_CONFIRMATION),
    map((action: RTLActions.OpenConfirmation) => {
      action.payload.width = this.confirmWidth;
      this.dialogRef = this.dialog.open(ConfirmationMessageComponent, action.payload);
    })),
    { dispatch: false }
  );

  closeConfirm = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.CLOSE_CONFIRMATION),
    take(1),
    map((action: RTLActions.CloseConfirmation) => {
      if (this.dialogRef) { this.dialogRef.close(); }
      this.logger.info(action.payload);
      return action.payload;
    })),
    { dispatch: false }
  );

  showNodePubkey = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.SHOW_PUBKEY),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, rootData]: [RTLActions.ShowPubkey, fromRTLReducer.RootState]) => {
      if (!this.sessionService.getItem('token') || !rootData.nodeData.identity_pubkey) {
        this.snackBar.open('Node Pubkey does not exist.');
      } else {
        this.store.dispatch(new RTLActions.OpenAlert({width: '70%', data: {
          information: rootData.nodeData,
          component: ShowPubkeyComponent
        }}));
      }
      return of({type: RTLActions.VOID});
    }))
  );

  appConfigFetch = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.FETCH_RTL_CONFIG),
    mergeMap((action: RTLActions.FetchRTLConfig) => {
      this.screenSize = this.commonService.getScreenSize();
      if(this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
        this.alertWidth = '95%';
        this.confirmWidth = '95%';
      } else if(this.screenSize === ScreenSizeEnum.MD) {
        this.alertWidth = '80%';
        this.confirmWidth = '80%';
      } else {
        this.alertWidth = '55%';
        this.confirmWidth = '60%';
      }
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.GET_RTL_CONFIG));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'FetchRTLConfig', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(environment.CONF_API + '/rtlconf');
    }),
    map((rtlConfig: RTLConfiguration) => {
      this.logger.info(rtlConfig);
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.GET_RTL_CONFIG));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'FetchRTLConfig', status: APICallStatusEnum.COMPLETED}));
      let searchNode: ConfigSettingsNode;
      rtlConfig.nodes.forEach(node => {
        node.settings.currencyUnits = [...CURRENCY_UNITS, node.settings.currencyUnit];
        if(+node.index === rtlConfig.selectedNodeIndex) { searchNode = node; }
      });
      if(searchNode) {
        this.store.dispatch(new RTLActions.SetSelelectedNode({uiMessage: UI_MESSAGES.NO_SPINNER, lnNode: searchNode, isInitialSetup: true}))
        return {
          type: RTLActions.SET_RTL_CONFIG,
          payload: rtlConfig
        };
      } else {
        return {
          type: RTLActions.VOID
        }
      }
    },
    catchError((err) => {
      this.handleErrorWithoutAlert('FetchRTLConfig', UI_MESSAGES.GET_RTL_CONFIG, err);
      return of({type: RTLActions.VOID});
    })))
  );

  settingSave = createEffect(() =>
    this.actions.pipe(
      ofType(RTLActions.SAVE_SETTINGS),
      mergeMap((action: RTLActions.SaveSettings) => {
        this.store.dispatch(new RTLActions.OpenSpinner(action.payload.uiMessage));
        this.store.dispatch(new RTLActions.UpdateAPICallStatus({ action: 'UpdateSettings', status: APICallStatusEnum.INITIATED }));
        let updateSettingReq = new Observable();
        if (action.payload.settings && action.payload.defaultNodeIndex) {
          let settingsRes = this.httpClient.post<Settings>(environment.CONF_API, { updatedSettings: action.payload.settings });
          let defaultNodeRes = this.httpClient.post(environment.CONF_API + '/updateDefaultNode', { defaultNodeIndex: action.payload.defaultNodeIndex });
          updateSettingReq = forkJoin([settingsRes, defaultNodeRes])
        } else if (action.payload.settings && !action.payload.defaultNodeIndex) {
          updateSettingReq = this.httpClient.post(environment.CONF_API, { updatedSettings: action.payload.settings })
        } else if (!action.payload.settings && action.payload.defaultNodeIndex) {
          updateSettingReq = this.httpClient.post(environment.CONF_API + '/updateDefaultNode', { defaultNodeIndex: action.payload.defaultNodeIndex })
        }
        return updateSettingReq
          .pipe(map((updateStatus: any) => {
            this.logger.info(updateStatus);
            this.store.dispatch(new RTLActions.UpdateAPICallStatus({ action: 'UpdateSettings', status: APICallStatusEnum.COMPLETED }));
            this.store.dispatch(new RTLActions.CloseSpinner(action.payload.uiMessage));
            return {
              type: RTLActions.OPEN_SNACK_BAR,
              payload: (!updateStatus.length) ? updateStatus.message + '.' : updateStatus[0].message + '.'
            };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('UpdateSettings', action.payload.uiMessage, 'Update Settings Failed!', environment.CONF_API, (!err.length) ? err : err[0]);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  updateServicesettings = createEffect(() =>
    this.actions.pipe(
      ofType(RTLActions.UPDATE_SERVICE_SETTINGS),
      mergeMap((action: RTLActions.UpdateServiceSettings) => {
        this.store.dispatch(new RTLActions.OpenSpinner(action.payload.uiMessage));
        this.store.dispatch(new RTLActions.UpdateAPICallStatus({ action: 'UpdateServiceSettings', status: APICallStatusEnum.INITIATED }));
        return this.httpClient.post(environment.CONF_API + '/updateServiceSettings', action.payload)
          .pipe(map((updateStatus: any) => {
            this.logger.info(updateStatus);
            this.store.dispatch(new RTLActions.UpdateAPICallStatus({ action: 'UpdateServiceSettings', status: APICallStatusEnum.COMPLETED }));
            this.store.dispatch(new RTLActions.CloseSpinner(action.payload.uiMessage));
            return {
              type: RTLActions.OPEN_SNACK_BAR,
              payload: updateStatus.message + '.'
            };
          }),
          catchError((err) => {
            this.handleErrorWithAlert('UpdateServiceSettings', action.payload.uiMessage, 'Update Service Settings Failed!', environment.CONF_API, err);
            return of({ type: RTLActions.VOID });
          }));
      }))
  );

  twoFASettingSave = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.TWO_FA_SAVE_SETTINGS),
    mergeMap((action: RTLActions.TwoFASaveSettings) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.UPDATE_UI_SETTINGS));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'Update2FASettings', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.post(environment.CONF_API + '/update2FA', { secret2fa: action.payload.secret2fa });
    }),
    map((updateStatus: any) => {
      this.logger.info(updateStatus);
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'Update2FASettings', status: APICallStatusEnum.COMPLETED}));
      this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.UPDATE_UI_SETTINGS));
      return { type: RTLActions.VOID };
    },
    catchError((err) => {
      this.handleErrorWithAlert('Update2FASettings', UI_MESSAGES.UPDATE_UI_SETTINGS, 'Update 2FA Settings Failed!', environment.CONF_API, err);
      return of({type: RTLActions.VOID});
    })))
  );

  configFetch = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.FETCH_CONFIG),
    mergeMap((action: RTLActions.FetchConfig) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.OPEN_CONFIG_FILE));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'fetchConfig', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.get(environment.CONF_API + '/config/' + action.payload)
      .pipe(
        map((configFile: any) => {
          this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'fetchConfig', status: APICallStatusEnum.COMPLETED}));
          this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.OPEN_CONFIG_FILE));
          return {
            type: RTLActions.SHOW_CONFIG,
            payload: configFile
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('fetchConfig', UI_MESSAGES.OPEN_CONFIG_FILE, 'Fetch Config Failed!', environment.CONF_API + '/config/' + action.payload, err);
          return of({type: RTLActions.VOID});
        }
      ));
    }))
  );
  
  showLnConfig = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.SHOW_CONFIG),
    map((action: RTLActions.ShowConfig) => {
      return action.payload;
    })),
    { dispatch: false }
  );

  isAuthorized = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.IS_AUTHORIZED),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [RTLActions.IsAuthorized, any]) => {
    this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'IsAuthorized', status: APICallStatusEnum.INITIATED}));
    return this.httpClient.post(environment.AUTHENTICATE_API, { 
      authenticateWith: (!action.payload || action.payload.trim() === '') ? AuthenticateWith.JWT : AuthenticateWith.PASSWORD,
      authenticationValue: (!action.payload || action.payload.trim() === '') ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : action.payload 
    })
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'IsAuthorized', status: APICallStatusEnum.COMPLETED}));
        this.logger.info('Successfully Authorized!');
        return {
          type: RTLActions.IS_AUTHORIZED_RES,
          payload: postRes
        };
      }),
      catchError((err) => {
        this.handleErrorWithAlert('IsAuthorized', UI_MESSAGES.NO_SPINNER, 'Authorization Failed', environment.AUTHENTICATE_API, err);
        return of({
          type: RTLActions.IS_AUTHORIZED_RES,
          payload: 'ERROR'
        });
      }));
    }))
  );
  
  isAuthorizedRes = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.IS_AUTHORIZED_RES),
    map((action: RTLActions.IsAuthorizedRes) => {
      return action.payload;
    })),
    { dispatch: false }
  );

  authLogin = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.LOGIN),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, rootStore]: [RTLActions.Login, fromRTLReducer.RootState]) => {
      this.store.dispatch(new LNDActions.ResetLNDStore({}));
      this.store.dispatch(new CLActions.ResetCLStore({}));
      this.store.dispatch(new ECLActions.ResetECLStore({}));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'Login', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.post(environment.AUTHENTICATE_API, { 
        authenticateWith: (!action.payload.password) ? AuthenticateWith.JWT : AuthenticateWith.PASSWORD,
        authenticationValue: (!action.payload.password) ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : action.payload.password,
        twoFAToken: (action.payload.twoFAToken) ? action.payload.twoFAToken : '',
      })
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'Login', status: APICallStatusEnum.COMPLETED}));
          this.setLoggedInDetails(action.payload.defaultPassword, postRes, rootStore);
        }),
        catchError((err) => {
          this.logger.info('Redirecting to Login Error Page');
          if (err.status === 0 && err.statusText && err.statusText === 'Unknown Error') {
            err.status = '400';
            err.error.error = 'Origin Not Allowed';
          }
          this.handleErrorWithoutAlert('Login', UI_MESSAGES.NO_SPINNER, err);
          if (+rootStore.appConfig.sso.rtlSSO) {
            this.router.navigate(['/error'], { state: { errorCode: '406', errorMessage: err.error && err.error.error ? err.error.error : 'Single Sign On Failed!' }});
          } else {
            this.router.navigate(['./login']);
          }
          return of({type: RTLActions.VOID});
        })
      );
    })),
    { dispatch: false }
  );
  
  tokenVerify = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.VERIFY_TWO_FA),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, rootStore]: [RTLActions.VerifyTwoFA, fromRTLReducer.RootState]) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.VERIFY_TOKEN));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'VerifyToken', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.post(environment.AUTHENTICATE_API + '/token', {authentication2FA: action.payload.token})
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.VERIFY_TOKEN));
          this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'VerifyToken', status: APICallStatusEnum.COMPLETED}));
          this.logger.info('Token Successfully Verified!');
          this.setLoggedInDetails(false, action.payload.authResponse, rootStore);        
        }),
        catchError((err) => {
          this.handleErrorWithAlert('VerifyToken', UI_MESSAGES.VERIFY_TOKEN, 'Authorization Failed!', environment.AUTHENTICATE_API + '/token', err);
          return of({type: RTLActions.VOID});
        })
      );
    })),
    { dispatch: false }
  );
  
  logOut = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.LOGOUT),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]) => {
      if (+store.appConfig.sso.rtlSSO) {
        window.location.href = store.appConfig.sso.logoutRedirectLink;
      } else {
        this.router.navigate(['./login']);
      }
      this.sessionService.clearAll();
      this.store.dispatch(new RTLActions.SetNodeData({}));
      this.logger.warn('LOGGED OUT');
      return of();
    })),
    { dispatch: false }
  );

  resetPassword = createEffect(() =>
    this.actions.pipe(takeUntil(this.unSubs[1]),
    ofType(RTLActions.RESET_PASSWORD),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, rootStore]: [RTLActions.ResetPassword, fromRTLReducer.RootState]) => {
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'ResetPassword', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.post(environment.AUTHENTICATE_API + '/reset', {currPassword: action.payload.currPassword, newPassword: action.payload.newPassword})
      .pipe(takeUntil(this.unSubs[0]), map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'ResetPassword', status: APICallStatusEnum.COMPLETED}));
        this.sessionService.setItem('defaultPassword', false);
        this.logger.info('Password Reset Successful!');
        this.store.dispatch(new RTLActions.OpenSnackBar('Password Reset Successful!'));
        this.SetToken(postRes.token);
        return {
          type: RTLActions.RESET_PASSWORD_RES,
          payload: postRes.token
        };
      }),
      catchError((err) => {
        this.handleErrorWithAlert('ResetPassword', UI_MESSAGES.NO_SPINNER, 'Password Reset Failed!', environment.AUTHENTICATE_API + '/reset', err);
        return of({type: RTLActions.VOID});
      }));
    }))
  );

  setSelectedNode = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.SET_SELECTED_NODE),
    mergeMap((action: RTLActions.SetSelelectedNode) => {
      this.store.dispatch(new RTLActions.OpenSpinner(action.payload.uiMessage));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'UpdateSelNode', status: APICallStatusEnum.INITIATED}));
      return this.httpClient.post(environment.CONF_API + '/updateSelNode', { selNodeIndex: action.payload.lnNode.index })
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'UpdateSelNode', status: APICallStatusEnum.COMPLETED}));
          this.store.dispatch(new RTLActions.CloseSpinner(action.payload.uiMessage));
          this.initializeNode(action.payload.lnNode, action.payload.isInitialSetup);
          return { type: RTLActions.VOID };
        }),
        catchError((err: any) => {
          if (err.status === 0 && err.statusText && err.statusText === 'Unknown Error') {
            err.status = '400';
            err.error.message = 'Origin Not Allowed';
          }
          this.handleErrorWithAlert('UpdateSelNode', action.payload.uiMessage, 'Update Selected Node Failed!', environment.CONF_API + '/updateSelNode', err);
          return of({type: RTLActions.VOID});
        })
      );
    }))
  );

  fetchFile = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.FETCH_FILE),
    mergeMap((action: RTLActions.FetchFile) => {
      this.store.dispatch(new RTLActions.OpenSpinner(UI_MESSAGES.DOWNLOAD_BACKUP_FILE));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'fetchFile', status: APICallStatusEnum.INITIATED}));
      let query = '?channel=' + action.payload.channelPoint + (action.payload.path ? '&path=' + action.payload.path : '');
      return this.httpClient.get(environment.CONF_API + '/file' + query)
      .pipe(
        map((fetchedFile: any) => {
          this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: 'fetchFile', status: APICallStatusEnum.COMPLETED}));
          this.store.dispatch(new RTLActions.CloseSpinner(UI_MESSAGES.DOWNLOAD_BACKUP_FILE));
          return {
            type: RTLActions.SHOW_FILE,
            payload: fetchedFile
          };
        }),
        catchError((err: any) => {
          this.handleErrorWithAlert('fetchFile', UI_MESSAGES.DOWNLOAD_BACKUP_FILE, 'Download Backup File Failed!', environment.CONF_API + '/file' + query, { status: this.commonService.extractErrorNumber(err), error: { error: this.commonService.extractErrorCode(err) }});
          return of({type: RTLActions.VOID});
        }
      ));
    }))
  );
  
  showFile = createEffect(() => 
    this.actions.pipe(
    ofType(RTLActions.SHOW_FILE),
    map((action: RTLActions.ShowFile) => {
      return action.payload;
    })),
    { dispatch: false }
  );

  initializeNode(node: any, isInitialSetup: boolean) {
    const landingPage = isInitialSetup ? '' : 'HOME';
    let selNode = {};
    if(node.settings.fiatConversion && node.settings.currencyUnit) {
      selNode = { userPersona: node.settings.userPersona, channelBackupPath: node.settings.channelBackupPath, selCurrencyUnit: node.settings.currencyUnit, currencyUnits: [...CURRENCY_UNITS, node.settings.currencyUnit], fiatConversion: node.settings.fiatConversion, lnImplementation: node.lnImplementation, swapServerUrl: node.settings.swapServerUrl, boltzServerUrl: node.settings.boltzServerUrl };
    } else {
      selNode = { userPersona: node.settings.userPersona, channelBackupPath: node.settings.channelBackupPath, selCurrencyUnit: node.settings.currencyUnit, currencyUnits: CURRENCY_UNITS, fiatConversion: node.settings.fiatConversion, lnImplementation: node.lnImplementation, swapServerUrl: node.settings.swapServerUrl, boltzServerUrl: node.settings.boltzServerUrl };
    }
    this.sessionService.removeItem('lndUnlocked');
    this.sessionService.removeItem('clUnlocked');
    this.sessionService.removeItem('eclUnlocked');
    this.store.dispatch(new RTLActions.ResetRootStore(node));
    this.store.dispatch(new LNDActions.ResetLNDStore(selNode));
    this.store.dispatch(new CLActions.ResetCLStore(selNode));
    this.store.dispatch(new ECLActions.ResetECLStore(selNode));
    if(this.sessionService.getItem('token')) {
      node.lnImplementation = node.lnImplementation.toUpperCase();
      this.dataService.setChildAPIUrl(node.lnImplementation);
      switch (node.lnImplementation) {
        case 'CLT':
          this.router.navigate(['/cl/' + landingPage.toLowerCase()]);
          this.store.dispatch(new CLActions.FetchInfo({loadPage: landingPage}));
          break;

        case 'ECL':
          this.router.navigate(['/ecl/' + landingPage.toLowerCase()]);
          this.store.dispatch(new ECLActions.FetchInfo({loadPage: landingPage}));
          break;
            
        default:
          this.router.navigate(['/lnd/' + landingPage.toLowerCase()]);
          this.store.dispatch(new LNDActions.FetchInfo({loadPage: landingPage}));
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
    rootStore.selNode.settings.currencyUnits = [...CURRENCY_UNITS, rootStore.selNode.settings.currencyUnit];
    this.sessionService.setItem('defaultPassword', defaultPassword);
    if (defaultPassword) {
      this.sessionService.setItem('defaultPassword', 'true');
      this.store.dispatch(new RTLActions.OpenSnackBar('Reset your password.'));
      this.router.navigate(['/settings/auth']);
    } else {
      this.store.dispatch(new RTLActions.SetSelelectedNode({ uiMessage: UI_MESSAGES.NO_SPINNER, lnNode: rootStore.selNode, isInitialSetup: true}));
    }
  }

  handleErrorWithoutAlert(actionName: string, uiMessage: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401 && actionName !== 'Login') {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner(uiMessage));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: this.commonService.extractErrorMessage(err)}));
    }
  }

  handleErrorWithAlert(actionName: string, uiMessage: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {
    this.logger.error(err);
    if (err.status === 401 && actionName !== 'Login') {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner(uiMessage));
      const errMsg = this.commonService.extractErrorMessage(err);
      this.store.dispatch(new RTLActions.OpenAlert({data: {
          type: 'ERROR',
          alertTitle: alertTitle,
          message: { code: err.status ? err.status : 'Unknown Error', message: errMsg, URL: errURL },
          component: ErrorMessageComponent
        }
      }));
      this.store.dispatch(new RTLActions.UpdateAPICallStatus({action: actionName, status: APICallStatusEnum.ERROR, statusCode: err.status.toString(), message: errMsg, URL: errURL}));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
