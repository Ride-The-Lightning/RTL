import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { map, mergeMap, catchError, take, withLatestFrom } from 'rxjs/operators';
import { Location } from '@angular/common';

import { MatDialog } from '@angular/material';

import { environment, API_URL } from '../../environments/environment';
import { LoggerService } from '../shared/services/logger.service';
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
    public dialog: MatDialog,
    private router: Router,
    private location: Location) { }

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
      this.logger.error(err);
      this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'FetchRTLConfig', code: err.status, message: err.error.error }));
      return of();
    })
  ));

  @Effect({ dispatch: false })
  settingSave = this.actions$.pipe(
    ofType(RTLActions.SAVE_SETTINGS),
    mergeMap((action: RTLActions.SaveSettings) => {
      return this.httpClient.post<Settings>(environment.CONF_API, { updatedSettings: action.payload });
    }
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
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.logger.error(err);
          this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'fetchConfig', code: err.status, message: err.error.error }));
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Fetch Config Failed!',
              message: JSON.stringify({Code: err.status, Message: err.error.error})}}
            }
          );
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
      authenticationValue: (undefined === action.payload || action.payload == null || action.payload === '') ? (sessionStorage.getItem('token') ? sessionStorage.getItem('token') : '') : action.payload 
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
        this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'ERROR', titleMessage: 'Authorization Failed',
         message: JSON.stringify({Code: err.status, Message: err.error.error})}}));
        this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'IsAuthorized', code: err.status, message: err.error.message }));
        this.logger.error(err.error);
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
      authenticationValue: (undefined === action.payload || action.payload == null || action.payload === '') ? (sessionStorage.getItem('token') ? sessionStorage.getItem('token') : '') : action.payload 
    })
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.logger.info('Successfully Authorized!');
        this.SetToken(postRes.token);
        if(rootStore.selNode.lnImplementation.toUpperCase() === 'CLT') {
          this.router.navigate(['/cl/home']);
        } else {
          this.router.navigate(['/lnd/home']);
        }
      }),
      catchError((err) => {
        this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'ERROR', message: JSON.stringify(err.error)}}));
        this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'Signin', code: err.status, message: err.error.message }));
        this.logger.error(err.error);
        this.logger.info('Redirecting to Signin Error Page');
        if (+rootStore.appConfig.sso.rtlSSO) {
          this.router.navigate(['/ssoerror']);
        } else {
          this.router.navigate([rootStore.appConfig.sso.logoutRedirectLink]);
        }
        return of();
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
    sessionStorage.removeItem('clUnlocked');
    sessionStorage.removeItem('lndUnlocked');
    sessionStorage.removeItem('token');
    this.logger.warn('LOGGED OUT');
    return of();
  }));

 @Effect()
 setSelectedNode = this.actions$.pipe(
   ofType(RTLActions.SET_SELECTED_NODE),
   mergeMap((action: RTLActions.SetSelelectedNode) => {
    sessionStorage.setItem('lndUnlocked', 'true');     
    this.store.dispatch(new RTLActions.ClearEffectErrorRoot('UpdateSelNode'));
     return this.httpClient.post(environment.CONF_API + '/updateSelNode', { selNodeIndex: action.payload.lnNode.index })
     .pipe(
       map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.CloseSpinner());
        let selNode = { channelBackupPath: action.payload.lnNode.settings.channelBackupPath, satsToBTC: action.payload.lnNode.settings.satsToBTC };
        this.store.dispatch(new RTLActions.ResetRootStore(action.payload.lnNode));
        this.store.dispatch(new RTLActions.ResetLNDStore(selNode));
        this.store.dispatch(new RTLActions.ResetCLStore(selNode));
        if (sessionStorage.getItem('token')) {
          let newRoute = this.location.path();
          if(action.payload.lnNode.lnImplementation.toUpperCase() === 'CLT') {
            newRoute = '/cl/home';
            this.router.routeReuseStrategy.shouldReuseRoute = () => false;
            this.router.onSameUrlNavigation = 'reload';              
            this.router.navigate([newRoute]);
            this.CHILD_API_URL = API_URL + '/cl';
            return { type: RTLActions.VOID };
          } else {
            newRoute = '/lnd/home';
            this.router.routeReuseStrategy.shouldReuseRoute = () => false;
            this.router.onSameUrlNavigation = 'reload';              
            this.router.navigate([newRoute]);
            this.CHILD_API_URL = API_URL + '/lnd';
            return { type: RTLActions.VOID };
          }
        } else {
          if (!action.payload.isInitialSetup) {
            return {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'WARN', titleMessage: 'Authorization required to get the data from the node!' }}
            };
          } else {
            return { type: RTLActions.VOID };
          }
        }
       }),
       catchError((err: any) => {
         this.store.dispatch(new RTLActions.CloseSpinner());
         this.store.dispatch(new RTLActions.EffectErrorRoot({ action: 'UpdateSelNode', code: err.status, message: err.error.message }));
         this.logger.error(err);
         return of(
           {
             type: RTLActions.OPEN_ALERT,
             payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Update Selected Node Failed!',
               message: JSON.stringify({code: err.status, Message: err.error.error})
             }}
           }
         );
       })
     );
   }
 ));

 SetToken(token: string) {
    if (token) {
      sessionStorage.setItem('lndUnlocked', 'true');
      sessionStorage.setItem('token', token);
      this.store.dispatch(new RTLActions.InitAppData());
    } else {
      sessionStorage.removeItem('lndUnlocked');
      sessionStorage.removeItem('token');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
