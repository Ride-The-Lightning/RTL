import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom } from 'rxjs/operators';

import { MatDialog } from '@angular/material';

import { environment } from '../../../environments/environment';
import { LoggerService } from '../../shared/services/logger.service';
import { GetInfo } from '../../shared/models/clModels';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';
import * as CLActions from './cl.actions';
import * as fromCLReducer from './cl.reducers';

@Injectable()
export class CLEffects implements OnDestroy {
  dialogRef: any;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<fromCLReducer.CLState>,
    private logger: LoggerService,
    public dialog: MatDialog,
    private router: Router) { }

  @Effect()
  infoFetch = this.actions$.pipe(
    ofType(CLActions.FETCH_CL_INFO),
    withLatestFrom(this.store.select('rtlRoot')),
    mergeMap(([action, store]: [CLActions.FetchCLInfo, fromRTLReducer.State]) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchInfo'));
      return this.httpClient.get<GetInfo>(environment.GETINFO_API)
      .pipe(
        map((info) => {
          this.logger.info(info);
          if (undefined === info.identity_pubkey) {
            this.store.dispatch(new RTLActions.SetSelNodeInfo({}));            
            sessionStorage.removeItem('clUnlocked');
            return {
              type: CLActions.SET_CL_INFO,
              payload: {}
            };
          } else {
            this.store.dispatch(new RTLActions.SetSelNodeInfo(info));
            sessionStorage.setItem('clUnlocked', 'true');
            return {
              type: CLActions.SET_CL_INFO,
              payload: (undefined !== info) ? info : {}
            };
          }
        }),
        catchError((err) => {
          this.logger.error(err);
          this.store.dispatch(new RTLActions.EffectError({ action: 'FetchInfo', code: err.status, message: err.error.error }));
          if (+store.appConfig.sso.rtlSSO) {
            this.router.navigate(['/ssoerror']);
          } else {
            if (err.status === 401) {
              this.logger.info('Redirecting to Signin');
              this.router.navigate([store.appConfig.sso.logoutRedirectLink]);
              return of();
            }
          }
        })
      );
    }
  ));

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
