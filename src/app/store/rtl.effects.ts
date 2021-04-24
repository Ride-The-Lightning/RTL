import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, Subject, forkJoin, Observable } from 'rxjs';
import { map, mergeMap, catchError, take, withLatestFrom } from 'rxjs/operators';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { environment, API_URL } from '../../environments/environment';
import { LoggerService } from '../shared/services/logger.service';
import { SessionService } from '../shared/services/session.service';
import { CommonService } from '../shared/services/common.service';
import { DataService } from '../shared/services/data.service';
import { Settings, RTLConfiguration, ConfigSettingsNode } from '../shared/models/RTLconfig';
import { AuthenticateWith, CURRENCY_UNITS, ScreenSizeEnum } from '../shared/services/consts-enums-functions';

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
  CHILD_API_URL = API_URL + '/lnd';
  screenSize = '';
  alertWidth = '55%';
  confirmWidth = '70%';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<fromRTLReducer.RTLState>,
    private logger: LoggerService,
    private sessionService: SessionService,
    private commonService: CommonService,
    private dataService: DataService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router) {}

  @Effect({ dispatch: false })
  closeAllDialogs = this.actions$.pipe(
    ofType(RTLActions.CLOSE_ALL_DIALOGS),
    map((action: RTLActions.CloseAllDialogs) => {
      this.dialog.closeAll();
    }
  ));

  @Effect({ dispatch: false })
  openSnackBar = this.actions$.pipe(
    ofType(RTLActions.OPEN_SNACK_BAR),
    map((action: RTLActions.OpenSnackBar) => {
      if (typeof action.payload === 'string') {
        this.snackBar.open(action.payload);
      } else {
        this.snackBar.open(action.payload.message, '', {duration: action.payload.duration});
      }
    }
  ));

  @Effect({ dispatch: false })
  openSpinner = this.actions$.pipe(
    ofType(RTLActions.OPEN_SPINNER),
    map((action: RTLActions.OpenSpinner) => {
      this.dialogRef = this.dialog.open(SpinnerDialogComponent, { data: { titleMessage: action.payload}});
    }
  ));

  @Effect({ dispatch: false })
  closeSpinner = this.actions$.pipe(
    ofType(RTLActions.CLOSE_SPINNER),
    map((action: RTLActions.CloseSpinner) => {
      if (this.dialogRef && (this.dialogRef.componentInstance && this.dialogRef.componentInstance.data && this.dialogRef.componentInstance.data.titleMessage && this.dialogRef.componentInstance.data.titleMessage.includes('...'))) { this.dialogRef.close(); }
      try {
        this.dialog.openDialogs.forEach(localDialog => {
          if (localDialog.componentInstance && localDialog.componentInstance.data && localDialog.componentInstance.data.titleMessage && localDialog.componentInstance.data.titleMessage.includes('...')) {
            localDialog.close();
          }
        });
      } catch (err) {
        this.logger.error(err);
      }
    }
  ));

  @Effect({ dispatch: false })
  openAlert = this.actions$.pipe(
    ofType(RTLActions.OPEN_ALERT),
    map((action: RTLActions.OpenAlert) => {
      action.payload.width = this.alertWidth;
      if(action.payload.data.component) {
        this.dialogRef = this.dialog.open(action.payload.data.component, action.payload);
      } else {
        this.dialogRef = this.dialog.open(AlertMessageComponent, action.payload);
      }
    }
  ));

  @Effect({ dispatch: false })
  closeAlert = this.actions$.pipe(
    ofType(RTLActions.CLOSE_ALERT),
    map((action: RTLActions.CloseAlert) => {
      if (this.dialogRef) { this.dialogRef.close(); }
      return action.payload;
    }
  ));

  @Effect({ dispatch: false })
  openConfirm = this.actions$.pipe(
    ofType(RTLActions.OPEN_CONFIRMATION),
    map((action: RTLActions.OpenConfirmation) => {
      action.payload.width = this.confirmWidth;
      this.dialogRef = this.dialog.open(ConfirmationMessageComponent, action.payload);
    })
  );

  @Effect({ dispatch: false })
  closeConfirm = this.actions$.pipe(
    ofType(RTLActions.CLOSE_CONFIRMATION),
    take(1),
    map((action: RTLActions.CloseConfirmation) => {
      if (this.dialogRef) { this.dialogRef.close(); }
      this.logger.info(action.payload);
      return action.payload;
    }
  ));

  @Effect()
  showNodePubkey = this.actions$.pipe(
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
  }));

  @Effect()
  appConfigFetch = this.actions$.pipe(
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
      this.store.dispatch(new RTLActions.ClearEffectErrorRoot('FetchRTLConfig'));
      return this.httpClient.get(environment.CONF_API + '/rtlconf');
    }),
    map((rtlConfig: RTLConfiguration) => {
      this.logger.info(rtlConfig);
      let searchNode: ConfigSettingsNode;
      rtlConfig.nodes.forEach(node => {
        node.settings.currencyUnits = [...CURRENCY_UNITS, node.settings.currencyUnit];
        if(+node.index === rtlConfig.selectedNodeIndex) { searchNode = node; }
      });
      if(searchNode) {
        this.store.dispatch(new RTLActions.SetSelelectedNode({lnNode: searchNode, isInitialSetup: true}))
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
      this.handleErrorWithoutAlert('FetchRTLConfig', err);
      return of({type: RTLActions.VOID});
    })
  ));

  @Effect()
  settingSave = this.actions$.pipe(
    ofType(RTLActions.SAVE_SETTINGS),
    mergeMap((action: RTLActions.SaveSettings) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorRoot('UpdateSettings'));
      if(action.payload.settings && action.payload.defaultNodeIndex) {
        let settingsRes = this.httpClient.post<Settings>(environment.CONF_API, { updatedSettings: action.payload.settings });
        let defaultNodeRes = this.httpClient.post(environment.CONF_API + '/updateDefaultNode', { defaultNodeIndex: action.payload.defaultNodeIndex });
        return forkJoin([settingsRes, defaultNodeRes]);      
      } else if(action.payload.settings && !action.payload.defaultNodeIndex) {
        return this.httpClient.post(environment.CONF_API, { updatedSettings: action.payload.settings });
      } else if(!action.payload.settings && action.payload.defaultNodeIndex) {
        return this.httpClient.post(environment.CONF_API + '/updateDefaultNode', { defaultNodeIndex: action.payload.defaultNodeIndex });
      }
      return of({type: RTLActions.VOID});
    }),
    map((updateStatus: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.logger.info(updateStatus);
      return {
        type: RTLActions.OPEN_SNACK_BAR,
        payload: (!updateStatus.length) ? updateStatus.message + '.' : updateStatus[0].message + '.'
      };
    },
    catchError((err) => {
      this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'UpdateSettings', code: (!err.length) ? err.status : err[0].status, message: (!err.length) ? err.error.error : err[0].error.error }));
      this.handleErrorWithAlert('ERROR', 'Update Settings Failed!', environment.CONF_API, (!err.length) ? err : err[0]);
      return of({type: RTLActions.VOID});
    })
  ));

  @Effect()
  updateServicesettings = this.actions$.pipe(
    ofType(RTLActions.UPDATE_SERVICE_SETTINGS),
    mergeMap((action: RTLActions.UpdateServiceSettings) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorRoot('UpdateServiceSettings'));
      return this.httpClient.post(environment.CONF_API + '/updateServiceSettings', action.payload);
    }),
    map((updateStatus: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.logger.info(updateStatus);
      return {
        type: RTLActions.OPEN_SNACK_BAR,
        payload: updateStatus.message + '.'
      };
    },
    catchError((err) => {
      this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'UpdateServiceSettings', code: err.status, message: err.error.error }));
      this.handleErrorWithAlert('ERROR', 'Update Service Settings Failed!', environment.CONF_API, err);
      return of({type: RTLActions.VOID});
    })
  ));

  @Effect()
  ssoSave = this.actions$.pipe(
    ofType(RTLActions.SAVE_SSO),
    mergeMap((action: RTLActions.SaveSSO) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorRoot('UpdateSSO'));
      return this.httpClient.post(environment.CONF_API + '/updateSSO', { SSO: action.payload });
    }),
    map((updateStatus: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.logger.info(updateStatus);
      return {
        type: RTLActions.OPEN_SNACK_BAR,
        payload:updateStatus.message + '.'
      };
    },
    catchError((err) => {
      this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'UpdateSSO', code: err.status, message: err.error.error }));
      this.handleErrorWithAlert('ERROR', 'Update SSO Failed!', environment.CONF_API, err);
      return of({type: RTLActions.VOID});
    })
  ));

  @Effect()
  twoFASettingSave = this.actions$.pipe(
    ofType(RTLActions.TWO_FA_SAVE_SETTINGS),
    mergeMap((action: RTLActions.TwoFASaveSettings) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorRoot('Update2FASettings'));
      return this.httpClient.post(environment.CONF_API + '/update2FA', { secret2fa: action.payload.secret2fa });
    }),
    map((updateStatus: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.logger.info(updateStatus);
      return { type: RTLActions.VOID };
    },
    catchError((err) => {
      this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'Update2FASettings', code: err.status, message: err.error.error }));
      this.handleErrorWithAlert('ERROR', 'Update 2FA Settings Failed!', environment.CONF_API, err);
      return of({type: RTLActions.VOID});
    })
  ));

  @Effect()
  configFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_CONFIG),
    mergeMap((action: RTLActions.FetchConfig) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorRoot('fetchConfig'));
      return this.httpClient.get(environment.CONF_API + '/config/' + action.payload)
      .pipe(
        map((configFile: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SHOW_CONFIG,
            payload: configFile
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'fetchConfig', code: err.status, message: err.error.error }));
          this.handleErrorWithAlert('ERROR', 'Fetch Config Failed!', environment.CONF_API + '/config/' + action.payload, err);
          return of({type: RTLActions.VOID});
        }
      ));
    })
  );

  @Effect({ dispatch: false })
  showLnConfig = this.actions$.pipe(
    ofType(RTLActions.SHOW_CONFIG),
    map((action: RTLActions.ShowConfig) => {
      return action.payload;
    })
  );

  @Effect()
  isAuthorized = this.actions$.pipe(
    ofType(RTLActions.IS_AUTHORIZED),
    withLatestFrom(this.store.select('root')),
    mergeMap(([action, store]: [RTLActions.IsAuthorized, any]) => {
    this.store.dispatch(new RTLActions.ClearEffectErrorRoot('IsAuthorized'));
    return this.httpClient.post(environment.AUTHENTICATE_API, { 
      authenticateWith: (!action.payload || action.payload.trim() === '') ? AuthenticateWith.JWT : AuthenticateWith.PASSWORD,
      authenticationValue: (!action.payload || action.payload.trim() === '') ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : action.payload 
    })
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.logger.info('Successfully Authorized!');
        return {
          type: RTLActions.IS_AUTHORIZED_RES,
          payload: postRes
        };
      }),
      catchError((err) => {
        this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'IsAuthorized', code: err.status, message: err.error.message }));
        this.handleErrorWithAlert('ERROR', 'Authorization Failed', environment.AUTHENTICATE_API, err);
        return of({
          type: RTLActions.IS_AUTHORIZED_RES,
          payload: 'ERROR'
        });
      })
    );
  }));

  @Effect({ dispatch: false })
  isAuthorizedRes = this.actions$.pipe(
   ofType(RTLActions.IS_AUTHORIZED_RES),
   map((action: RTLActions.IsAuthorizedRes) => {
     return action.payload;
   })
  );

  setLoggedInDetails(defaultPassword: boolean, postRes: any, rootStore: any) {
    this.logger.info('Successfully Authorized!');
    this.SetToken(postRes.token);
    rootStore.selNode.settings.currencyUnits = [...CURRENCY_UNITS, rootStore.selNode.settings.currencyUnit];
    if (defaultPassword) {
      this.store.dispatch(new RTLActions.OpenSnackBar('Reset your password.'));
      this.router.navigate(['/settings/auth'], {state: { initial: true }});
    } else {
      this.store.dispatch(new RTLActions.SetSelelectedNode({lnNode: rootStore.selNode, isInitialSetup: true}));
    }
  }

  @Effect({ dispatch: false })
  authLogin = this.actions$.pipe(
  ofType(RTLActions.LOGIN),
  withLatestFrom(this.store.select('root')),
  mergeMap(([action, rootStore]: [RTLActions.Login, fromRTLReducer.RootState]) => {
    this.store.dispatch(new LNDActions.ClearEffectError('FetchInfo'));
    this.store.dispatch(new CLActions.ClearEffectError('FetchInfo'));    
    this.store.dispatch(new ECLActions.ClearEffectError('FetchInfo'));    
    this.store.dispatch(new RTLActions.ClearEffectErrorRoot('Login'));
    return this.httpClient.post(environment.AUTHENTICATE_API, { 
      authenticateWith: (!action.payload.password) ? AuthenticateWith.JWT : AuthenticateWith.PASSWORD,
      authenticationValue: (!action.payload.password) ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : action.payload.password,
      twoFAToken: (action.payload.twoFAToken) ? action.payload.twoFAToken : '',
    })
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.setLoggedInDetails(action.payload.defaultPassword, postRes, rootStore);
      }),
      catchError((err) => {
        this.logger.info('Redirecting to Login Error Page');
        this.handleErrorWithoutAlert('ERROR', err);
        this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'Login', code: err.status, message: err.error.error }));
        if (+rootStore.appConfig.sso.rtlSSO) {
          this.router.navigate(['/error'], { state: { errorCode: '406', errorMessage: err.error && err.error.error ? err.error.error : 'Single Sign On Failed!' }});
        } else {
          this.router.navigate(['./login']);
        }
        return of({type: RTLActions.VOID});
      })
    );
  }));

  @Effect({ dispatch: false })
  tokenVerify = this.actions$.pipe(
  ofType(RTLActions.VERIFY_TWO_FA),
  withLatestFrom(this.store.select('root')),
  mergeMap(([action, rootStore]: [RTLActions.VerifyTwoFA, fromRTLReducer.RootState]) => {
    this.store.dispatch(new RTLActions.ClearEffectErrorRoot('VerifyToken'));
    return this.httpClient.post(environment.AUTHENTICATE_API + '/token', {authentication2FA: action.payload.token})
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.logger.info('Token Successfully Verified!');
        this.setLoggedInDetails(false, action.payload.authResponse, rootStore);        
      }),
      catchError((err) => {
        this.handleErrorWithAlert('ERROR', 'Authorization Failed!', environment.AUTHENTICATE_API + '/token', err);
        this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'VerifyToken', code: err.status, message: err.error.error }));
        return of({type: RTLActions.VOID});
      })
    );
  }));

  @Effect({ dispatch: false })
  logOut = this.actions$.pipe(
  ofType(RTLActions.LOGOUT),
  withLatestFrom(this.store.select('root')),
  mergeMap(([action, store]) => {
    if (+store.appConfig.sso.rtlSSO) {
      window.location.href = store.appConfig.sso.logoutRedirectLink;
    } else {
      this.router.navigate(['./login']);
    }
    this.sessionService.removeItem('eclUnlocked');
    this.sessionService.removeItem('clUnlocked');
    this.sessionService.removeItem('lndUnlocked');
    this.sessionService.removeItem('token');
    this.store.dispatch(new RTLActions.SetNodeData({}));
    this.logger.warn('LOGGED OUT');
    return of();
  }));


  @Effect()
  resetPassword = this.actions$.pipe(
  ofType(RTLActions.RESET_PASSWORD),
  withLatestFrom(this.store.select('root')),
  mergeMap(([action, rootStore]: [RTLActions.ResetPassword, fromRTLReducer.RootState]) => {
    this.store.dispatch(new RTLActions.ClearEffectErrorRoot('ResetPassword'));
    return this.httpClient.post(environment.AUTHENTICATE_API + '/reset', {currPassword: action.payload.currPassword, newPassword: action.payload.newPassword})
    .pipe(map((postRes: any) => {
      this.logger.info(postRes);
      this.logger.info('Password Reset Successful!');
      this.store.dispatch(new RTLActions.OpenSnackBar('Password Reset Successful!'));
      this.SetToken(postRes.token);
      return {
        type: RTLActions.RESET_PASSWORD_RES,
        payload: postRes.token
      };
    }),
    catchError((err) => {
      this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'ResetPassword', code: err.status, message: err.error.message }));
      this.handleErrorWithAlert('ERROR', 'Password Reset Failed!', environment.AUTHENTICATE_API + '/reset', err);
      return of({type: RTLActions.VOID});
    }));
  }));

  @Effect()
  setSelectedNode = this.actions$.pipe(
   ofType(RTLActions.SET_SELECTED_NODE),
   mergeMap((action: RTLActions.SetSelelectedNode) => {
    this.store.dispatch(new RTLActions.ClearEffectErrorRoot('UpdateSelNode'));
     return this.httpClient.post(environment.CONF_API + '/updateSelNode', { selNodeIndex: action.payload.lnNode.index })
     .pipe(
       map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.initializeNode(action.payload.lnNode, action.payload.isInitialSetup);
        return { type: RTLActions.VOID };
       }),
       catchError((err: any) => {
        this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'UpdateSelNode', code: err.status, message: err.error.message }));
        this.handleErrorWithAlert('ERROR', 'Update Selected Node Failed!', environment.CONF_API + '/updateSelNode', err);
        return of({type: RTLActions.VOID});
       })
     );
   }
  ));

  @Effect()
  fetchFile = this.actions$.pipe(
    ofType(RTLActions.FETCH_FILE),
    mergeMap((action: RTLActions.FetchFile) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorRoot('fetchFile'));
      let query = '?channel=' + action.payload.channelPoint + (action.payload.path ? '&path=' + action.payload.path : '');
      return this.httpClient.get(environment.CONF_API + '/file' + query)
      .pipe(
        map((fetchedFile: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SHOW_FILE,
            payload: fetchedFile
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'fetchFile', code: err.status, message: err.error.error }));
          this.handleErrorWithAlert('ERROR', err.error.message, environment.CONF_API + '/file' + query, {status: err.error.error.errno, error: err.error.error.code});
          return of({type: RTLActions.VOID});          
        }
      ));
    })
  );

  @Effect({ dispatch: false })
  showFile = this.actions$.pipe(
    ofType(RTLActions.SHOW_FILE),
    map((action: RTLActions.ShowFile) => {
      return action.payload;
    })
  );

  initializeNode(node: any, isInitialSetup: boolean) {
    const landingPage = isInitialSetup ? '' : 'HOME';
    let selNode = {};
    if(node.settings.fiatConversion && node.settings.currencyUnit) {
      selNode = { userPersona: node.settings.userPersona, channelBackupPath: node.settings.channelBackupPath, selCurrencyUnit: node.settings.currencyUnit, currencyUnits: [...CURRENCY_UNITS, node.settings.currencyUnit], fiatConversion: node.settings.fiatConversion, lnImplementation: node.lnImplementation, swapServerUrl: node.settings.swapServerUrl, boltzServerUrl: node.settings.boltzServerUrl };
    } else {
      selNode = { userPersona: node.settings.userPersona, channelBackupPath: node.settings.channelBackupPath, selCurrencyUnit: node.settings.currencyUnit, currencyUnits: CURRENCY_UNITS, fiatConversion: node.settings.fiatConversion, lnImplementation: node.lnImplementation, swapServerUrl: node.settings.swapServerUrl, boltzServerUrl: node.settings.boltzServerUrl };
    }
    this.store.dispatch(new RTLActions.ResetRootStore(node));
    this.store.dispatch(new LNDActions.ResetLNDStore(selNode));
    this.store.dispatch(new CLActions.ResetCLStore(selNode));
    this.store.dispatch(new ECLActions.ResetECLStore(selNode));
    if(this.sessionService.getItem('token')) {
      node.lnImplementation = node.lnImplementation.toUpperCase();
      this.dataService.setChildAPIUrl(node.lnImplementation);
      switch (node.lnImplementation) {
        case 'CLT':
          this.CHILD_API_URL = API_URL + '/cl';
          this.store.dispatch(new CLActions.FetchInfo({loadPage: landingPage}));
          break;

        case 'ECL':
          this.CHILD_API_URL = API_URL + '/ecl';
          this.store.dispatch(new ECLActions.FetchInfo({loadPage: landingPage}));
          break;
            
        default:
          this.CHILD_API_URL = API_URL + '/lnd';
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

  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.EffectErrorRoot({ action: actionName, code: err.status.toString(), message: err.error.error }));
    }
  }

  handleErrorWithAlert(alertType: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {
    this.logger.error(err);
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.CloseAllDialogs());
      this.store.dispatch(new RTLActions.Logout());
      this.store.dispatch(new RTLActions.OpenSnackBar('Authentication Failed. Redirecting to Login.'));
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.OpenAlert({data: {
          type: alertType,
          alertTitle: alertTitle,
          message: { code: err.status ? err.status : 'Unknown Error', message: (err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.error && typeof err.error.error.error.error.error === 'string') ? err.error.error.error.error.error : (err.error.error && err.error.error.error && err.error.error.error.error && typeof err.error.error.error.error === 'string') ? err.error.error.error.error : (err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error : (err.error.error && typeof err.error.error === 'string') ? err.error.error : typeof err.error === 'string' ? err.error : 'Unknown Error', URL: errURL },
          component: ErrorMessageComponent
        }
      }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
