import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { environment } from '../environment/environment';
import { authInterceptor, SESSION_ENDED_MESSAGE } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  const token = signal<string | null>(null);
  const clearSession = vi.fn(() => token.set(null));
  const navigate = vi.fn().mockResolvedValue(true);
  const add = vi.fn();
  let router: { url: string; navigate: typeof navigate };
  let http: HttpClient;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    token.set('3|abc');
    clearSession.mockClear();
    navigate.mockClear();
    add.mockClear();
    router = { url: '/', navigate };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token, clearSession } },
        { provide: Router, useValue: router },
        { provide: MessageService, useValue: { add } },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('adds the Bearer token to API requests', () => {
    http.get(`${environment.apiUrl}/consultations`).subscribe();
    const req = ctrl.expectOne(`${environment.apiUrl}/consultations`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer 3|abc');
    req.flush({ data: [] });
  });

  it('does not add the token to the login request', () => {
    http.post(`${environment.apiUrl}/login`, {}).subscribe();
    const req = ctrl.expectOne(`${environment.apiUrl}/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does not add the token to other websites', () => {
    http.get('https://example.com/data').subscribe();
    const req = ctrl.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('sends no header when there is no token', () => {
    token.set(null);
    http.get(`${environment.apiUrl}/doctors`).subscribe();
    const req = ctrl.expectOne(`${environment.apiUrl}/doctors`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ data: [] });
  });

  it('on 401: clears the session, shows a toast, redirects to /login and still errors', () => {
    router.url = '/';
    let status = 0;
    http.get(`${environment.apiUrl}/consultations`).subscribe({ error: (e) => (status = e.status) });
    ctrl
      .expectOne(`${environment.apiUrl}/consultations`)
      .flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', detail: SESSION_ENDED_MESSAGE }),
    );
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: {} });
  });

  it('on 401 shows only one toast when several requests fail', () => {
    http.get(`${environment.apiUrl}/consultations`).subscribe({ error: () => undefined });
    http.post(`${environment.apiUrl}/consultations`, {}).subscribe({ error: () => undefined });
    for (const r of ctrl.match(() => true)) {
      r.flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });
    }
    expect(add).toHaveBeenCalledTimes(1);
  });

  it('does not treat a wrong-password 401 on /login as an expired session', () => {
    http.post(`${environment.apiUrl}/login`, {}).subscribe({ error: () => undefined });
    ctrl
      .expectOne(`${environment.apiUrl}/login`)
      .flush({ message: 'The provided credentials are incorrect.' }, { status: 401, statusText: 'Unauthorized' });

    expect(clearSession).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not touch the session on 422', () => {
    http.post(`${environment.apiUrl}/consultations`, {}).subscribe({ error: () => undefined });
    ctrl
      .expectOne(`${environment.apiUrl}/consultations`)
      .flush({ message: 'bad', errors: {} }, { status: 422, statusText: 'Unprocessable' });
    expect(clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
