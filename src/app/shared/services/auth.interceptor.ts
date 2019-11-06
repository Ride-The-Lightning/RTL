import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SessionService } from './session.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private sessionService: SessionService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.sessionService.getItem('token')) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + this.sessionService.getItem('token'))
      });
      return next.handle(cloned);
    } else {
      return next.handle(req);
    }
  }

}
