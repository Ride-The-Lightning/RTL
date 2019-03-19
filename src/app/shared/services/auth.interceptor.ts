import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (sessionStorage.getItem('token')) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + sessionStorage.getItem('token'))
      });
      return next.handle(cloned);
    } else {
      return next.handle(req);
    }
  }

}
