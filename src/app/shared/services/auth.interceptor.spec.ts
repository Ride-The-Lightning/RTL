import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthInterceptor } from './auth.interceptor';
import { SessionService } from './session.service';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;
  let sessionService: SessionService;
  const unauthorized = { status: 401, statusText: 'Unauthorized' };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SessionService, { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }]
    });
    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    sessionService.setItem('token', 'old-token');
  });

  afterEach(() => {
    httpTestingController.verify();
    sessionStorage.clear();
  });

  it('sends the tab\'s token', () => {
    http.get('/api/conf').subscribe();
    const req = httpTestingController.expectOne('/api/conf');
    expect(req.request.headers.get('Authorization')).toBe('Bearer old-token');
    req.flush({});
  });

  it('retries a request refused for a token the tab has since replaced, with the new token', () => {
    let result: any = null;
    http.get('/api/conf').subscribe({ next: (res) => { result = res; } });
    const first = httpTestingController.expectOne('/api/conf');
    sessionService.setItem('token', 'new-token');
    first.flush({}, unauthorized);
    const retry = httpTestingController.expectOne('/api/conf');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({ ok: true });
    expect(result).toEqual({ ok: true });
  });

  it('retries with a token that arrives shortly after the refusal', fakeAsync(() => {
    let result: any = null;
    http.get('/api/conf').subscribe({ next: (res) => { result = res; } });
    httpTestingController.expectOne('/api/conf').flush({}, unauthorized);
    tick(500);
    sessionService.setItem('token', 'new-token');
    const retry = httpTestingController.expectOne('/api/conf');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({ ok: true });
    expect(result).toEqual({ ok: true });
  }));

  it('passes the refusal on when no new token arrives', fakeAsync(() => {
    let error: HttpErrorResponse | null = null;
    http.get('/api/conf').subscribe({ error: (err) => { error = err; } });
    httpTestingController.expectOne('/api/conf').flush({}, unauthorized);
    tick(999);
    expect(error).toBeNull();
    tick(1);
    expect(error!.status).toBe(401);
    httpTestingController.expectNone('/api/conf');
  }));

  it('passes other errors on at once, without a retry', () => {
    let error: HttpErrorResponse | null = null;
    http.get('/api/conf').subscribe({ error: (err) => { error = err; } });
    sessionService.setItem('token', 'new-token');
    httpTestingController.expectOne('/api/conf').flush({}, { status: 500, statusText: 'Server Error' });
    expect(error!.status).toBe(500);
    httpTestingController.expectNone('/api/conf');
  });
});
