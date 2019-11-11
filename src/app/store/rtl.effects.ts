import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { map, mergeMap, catchError, take, withLatestFrom } from 'rxjs/operators';

import { MatDialog } from '@angular/material';

import { environment, API_URL } from '../../environments/environment';
import { LoggerService } from '../shared/services/logger.service';
import { SessionService } from '../shared/services/session.service';
import { Settings, RTLConfiguration, AuthenticateWith } from '../shared/models/RTLconfig';

import { SpinnerDialogComponent } from '../shared/components/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from '../shared/components/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from '../shared/components/confirmation-message/confirmation-message.component';

import * as RTLActions from './rtl.actions';
import * as fromRTLReducer from './rtl.reducers';

@Injectable()
export class RTLEffects implements OnDestroy {
  dialogRef: any;
  CHILD_API_URL = API_URL + '/lnd';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<fromRTLReducer.RTLState>,
    private logger: LoggerService,
    private sessionService: SessionService,
    public dialog: MatDialog,
    private router: Router) { }

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
      if (this.dialogRef) { this.dialogRef.close(); }
    }
  ));

  @Effect({ dispatch: false })
  openAlert = this.actions$.pipe(
    ofType(RTLActions.OPEN_ALERT),
    map((action: RTLActions.OpenAlert) => {
      this.dialogRef = this.dialog.open(AlertMessageComponent, action.payload);
    }
  ));

  @Effect({ dispatch: false })
  closeAlert = this.actions$.pipe(
    ofType(RTLActions.CLOSE_ALERT),
    map((action: RTLActions.CloseAlert) => {
      if (this.dialogRef) { this.dialogRef.close(); }
    }
  ));

  @Effect({ dispatch: false })
  openConfirm = this.actions$.pipe(
    ofType(RTLActions.OPEN_CONFIRMATION),
    map((action: RTLActions.OpenConfirmation) => {
      this.dialogRef = this.dialog.open(ConfirmationMessageComponent, action.payload);
    })
  );

  @Effect({ dispatch: false })
  closeConfirm = this.actions$.pipe(
    ofType(RTLActions.CLOSE_CONFIRMATION),
    take(1),
    map((action: RTLActions.CloseConfirmation) => {
      this.dialogRef.close();
      this.logger.info(action.payload);
      return action.payload;
    }
  ));

  @Effect()
  appConfigFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_RTL_CONFIG),
    mergeMap((action: RTLActions.FetchRTLConfig) => {
      this.store.dispatch(new RTLActions.ClearEffectErrorRoot('FetchRTLConfig'));
      return this.httpClient.get(environment.CONF_API + '/rtlconf');
    }),
    map((rtlConfig: RTLConfiguration) => {
      this.logger.info(rtlConfig);
      this.store.dispatch(new RTLActions.SetSelelectedNode({lnNode: rtlConfig.nodes.find(node => +node.index === rtlConfig.selectedNodeIndex), isInitialSetup: true}))
      return {
        type: RTLActions.SET_RTL_CONFIG,
        payload: rtlConfig
      };
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
      return this.httpClient.post<Settings>(environment.CONF_API, { updatedSettings: action.payload });
    }),
    map((updateStatus: any) => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.logger.info(updateStatus);
      return {
        type: RTLActions.OPEN_ALERT,
        payload: { data: { type: 'SUCCESS', titleMessage: updateStatus.message } }
      };
    },
    catchError((err) => {
      this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'UpdateSettings', code: err.status, message: err.error.error }));
      this.handleErrorWithAlert('ERROR', 'Update Settings Failed!', environment.CONF_API, err);
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
      authenticateWith: (undefined === action.payload || action.payload == null || action.payload === '') ? AuthenticateWith.TOKEN : AuthenticateWith.PASSWORD,
      authenticationValue: (undefined === action.payload || action.payload == null || action.payload === '') ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : action.payload 
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

  @Effect({ dispatch: false })
  authSignin = this.actions$.pipe(
  ofType(RTLActions.SIGNIN),
  withLatestFrom(this.store.select('root')),
  mergeMap(([action, rootStore]: [RTLActions.Signin, fromRTLReducer.RootState]) => {
    this.store.dispatch(new RTLActions.ClearEffectErrorRoot('Signin'));
    return this.httpClient.post(environment.AUTHENTICATE_API, { 
      authenticateWith: (undefined === action.payload || action.payload == null || action.payload === '') ? AuthenticateWith.TOKEN : AuthenticateWith.PASSWORD,
      authenticationValue: (undefined === action.payload || action.payload == null || action.payload === '') ? (this.sessionService.getItem('token') ? this.sessionService.getItem('token') : '') : action.payload 
    })
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.logger.info('Successfully Authorized!');
        this.SetToken(postRes.token);
        this.store.dispatch(new RTLActions.SetSelelectedNode({lnNode: rootStore.selNode, isInitialSetup: true}))
      }),
      catchError((err) => {
        this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'Signin', code: err.status, message: err.error.message }));
        this.handleErrorWithAlert('ERROR', 'Authorization Failed!', environment.AUTHENTICATE_API, err.error);
        this.logger.info('Redirecting to Signin Error Page');
        if (+rootStore.appConfig.sso.rtlSSO) {
          this.router.navigate(['/error'], { state: { errorCode: '401', errorMessage: 'Single Sign On Failed!' }});
        } else {
          this.router.navigate([rootStore.appConfig.sso.logoutRedirectLink]);
        }
        return of({type: RTLActions.VOID});
      })
    );
  }));

  @Effect({ dispatch: false })
  signOut = this.actions$.pipe(
  ofType(RTLActions.SIGNOUT),
  withLatestFrom(this.store.select('root')),
  mergeMap(([action, store]) => {
    if (+store.appConfig.sso.rtlSSO) {
      window.location.href = store.appConfig.sso.logoutRedirectLink;
    } else {
      this.router.navigate([store.appConfig.sso.logoutRedirectLink]);
    }
    this.sessionService.removeItem('clUnlocked');
    this.sessionService.removeItem('lndUnlocked');
    this.sessionService.removeItem('token');
    this.logger.warn('LOGGED OUT');
    return of();
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

  initializeNode(node: any, isInitialSetup: boolean) {
    const landingPage = isInitialSetup ? '' : 'HOME';
    let selNode = { channelBackupPath: node.settings.channelBackupPath, satsToBTC: node.settings.satsToBTC };
    this.store.dispatch(new RTLActions.ResetRootStore(node));
    this.store.dispatch(new RTLActions.ResetLNDStore(selNode));
    this.store.dispatch(new RTLActions.ResetCLStore(selNode));
    if(this.sessionService.getItem('token')) {
      if(node.lnImplementation.toUpperCase() === 'CLT') {
        this.CHILD_API_URL = API_URL + '/cl';
        this.store.dispatch(new RTLActions.FetchInfoCL({loadPage: landingPage}));
      } else {
        this.CHILD_API_URL = API_URL + '/lnd';
        this.store.dispatch(new RTLActions.FetchInfo({loadPage: landingPage}));
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
      this.logger.info('Redirecting to Signin');
      this.store.dispatch(new RTLActions.Signout());
    } else {
      this.store.dispatch(new RTLActions.EffectErrorRoot({ action: actionName, code: err.status.toString(), message: err.error.error }));
    }
  }

  handleErrorWithAlert(alertType: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {
    this.logger.error(err);
    if (err.status === 401) {
      this.logger.info('Redirecting to Signin');
      this.store.dispatch(new RTLActions.Signout());
    } else {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.OpenAlert({
        width: '70%', data: {
          type: alertType, titleMessage: alertTitle,
          message: JSON.stringify({ code: err.status, Message: err.error.error, URL: errURL })
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
