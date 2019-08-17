import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { map, mergeMap, catchError, take, withLatestFrom } from 'rxjs/operators';

import { MatDialog } from '@angular/material';
import { environment } from '../../environments/environment';
import { LoggerService } from '../shared/services/logger.service';
import { Settings } from '../shared/models/RTLconfig';

import { SpinnerDialogComponent } from '../shared/components/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from '../shared/components/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from '../shared/components/confirmation-message/confirmation-message.component';

import * as CLActions from '../c-lightning/store/cl.actions';
import * as LNDActions from '../lnd/store/lnd.actions';
import * as RTLActions from './rtl.actions';
import * as fromApp from './rtl.reducers';

@Injectable()
export class RTLEffects implements OnDestroy {
  dialogRef: any;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<fromApp.AppState>,
    private logger: LoggerService,
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
      this.store.dispatch(new RTLActions.ClearEffectError('FetchRTLConfig'));
      return this.httpClient.get(environment.CONF_API + '/rtlconf');
    }),
    map((rtlConfig: any) => {
      this.logger.info(rtlConfig);
      if (+rtlConfig.sso.rtlSSO) { this.store.dispatch(new RTLActions.Signout()); }
      return {
        type: RTLActions.SET_RTL_CONFIG,
        payload: rtlConfig
      };
    },
    catchError((err) => {
      this.logger.error(err);
      this.store.dispatch(new RTLActions.EffectError({ action: 'FetchRTLConfig', code: err.status, message: err.error.error }));
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
  isAuthorized = this.actions$.pipe(
    ofType(RTLActions.IS_AUTHORIZED),
    withLatestFrom(this.store.select('rtlRoot')),
    mergeMap(([action, store]: [RTLActions.IsAuthorized, fromApp.RootState]) => {
      this.store.dispatch(new RTLActions.ClearEffectError('IsAuthorized'));
    return this.httpClient.post(environment.AUTHENTICATE_API, { password: action.payload })
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
        this.store.dispatch(new RTLActions.EffectError({ action: 'IsAuthorized', code: err.status, message: err.error.message }));
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
  withLatestFrom(this.store.select('rtlRoot')),
  mergeMap(([action, store]: [RTLActions.Signin, fromApp.RootState]) => {
    this.store.dispatch(new RTLActions.ClearEffectError('Signin'));
    return this.httpClient.post(environment.AUTHENTICATE_API, { password: action.payload })
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.logger.info('Successfully Authorized!');
        this.SetToken(postRes.token);
        this.router.navigate(['/']);
      }),
      catchError((err) => {
        this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'ERROR', message: JSON.stringify(err.error)}}));
        this.store.dispatch(new RTLActions.EffectError({ action: 'Signin', code: err.status, message: err.error.message }));
        this.logger.error(err.error);
        this.logger.info('Redirecting to Signin Error Page');
        if (+store.appConfig.sso.rtlSSO) {
          this.router.navigate(['/ssoerror']);
        } else {
          this.router.navigate([store.appConfig.sso.logoutRedirectLink]);
        }
        return of();
      })
    );
  }));

  @Effect({ dispatch: false })
  signOut = this.actions$.pipe(
  ofType(RTLActions.SIGNOUT),
  withLatestFrom(this.store.select('rtlRoot')),
  mergeMap(([action, store]: [RTLActions.Signout, fromApp.RootState]) => {
    if (+store.appConfig.sso.rtlSSO) {
      window.location.href = store.appConfig.sso.logoutRedirectLink;
    } else {
      this.router.navigate([store.appConfig.sso.logoutRedirectLink]);
    }
    sessionStorage.removeItem('lndUnlocked');
    sessionStorage.removeItem('token');
    this.logger.warn('LOGGED OUT');
    return of();
  }));

 @Effect()
 setSelectedNode = this.actions$.pipe(
   ofType(RTLActions.SET_SELECTED_NODE),
   mergeMap((action: RTLActions.SetSelelectedNode) => {
    this.store.dispatch(new RTLActions.ClearEffectError('UpdateSelNode'));
     return this.httpClient.post(environment.CONF_API + '/updateSelNode', { selNodeIndex: action.payload.index })
     .pipe(
       map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.CloseSpinner());
        if (sessionStorage.getItem('token')) {
          this.store.dispatch(new RTLActions.ResetStore(action.payload));
          if (action.payload.lnImplementation === 'CLightning') {
            this.router.navigate(['./cl']);
            return { type: CLActions.FETCH_CL_INFO };
          } else {
            this.router.navigate(['./lnd']);
            return { type: LNDActions.FETCH_INFO };
          }
        } else {
          return {
            type: RTLActions.OPEN_ALERT,
            payload: { width: '70%', data: {type: 'WARN', titleMessage: 'Authorization required to get the data from the node!' }}
          };
        }
       }),
       catchError((err: any) => {
         this.store.dispatch(new RTLActions.CloseSpinner());
         this.store.dispatch(new RTLActions.EffectError({ action: 'UpdateSelNode', code: err.status, message: err.error.message }));
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
