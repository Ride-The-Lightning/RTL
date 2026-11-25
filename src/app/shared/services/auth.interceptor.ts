import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { SessionService } from './session.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private sessionService: SessionService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.sessionService.getItem('token');
    if (token) {
      return next.handle(this.withToken(req, token)).pipe(
        catchError((err) => {
          if (!(err instanceof HttpErrorResponse) || err.status !== 401) { return throwError(() => err); }
          // A password change in another tab of this browser ends this tab's token and hands it
          // the new one. A request refused for the old token is sent again with the new one,
          // instead of the 401 logging out the session the tabs share.
          return this.sessionService.tokenReplacing(token).pipe(
            switchMap((newToken) => (newToken ? next.handle(this.withToken(req, newToken)) : throwError(() => err))));
        }));
    } else {
      // The login itself needs the session cookie too: the token it returns belongs to that
      // session. Same-origin requests send it anyway; the dev server on another port needs this.
      return next.handle(req.clone({ withCredentials: true }));
    }
  }

  private withToken(req: HttpRequest<any>, token: string) {
    return req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + token),
      withCredentials: true
    });
  }

}
