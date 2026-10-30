import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '../environment/environment';
import { AuthService, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './auth.service';

const user = { id: 1, name: 'John', email: 'john@example.com' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  function setup(): void {
    router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts logged out', () => {
    setup();
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('login() stores token and user in signals and localStorage', () => {
    setup();
    let result: unknown;
    service.login({ email: 'john@example.com', password: 'password' }).subscribe((u) => (result = u));

    const req = http.expectOne(`${environment.apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'john@example.com', password: 'password' });
    req.flush({ user, token: '3|abc' });

    expect(result).toEqual(user);
    expect(service.token()).toBe('3|abc');
    expect(service.currentUser()).toEqual(user);
    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('3|abc');
    expect(JSON.parse(localStorage.getItem(USER_STORAGE_KEY)!)).toEqual(user);
  });

  it('register() POSTs payload and stores token and user', () => {
    setup();
    let result: unknown;
    const payload = {
      name: 'John',
      email: 'john@example.com',
      password: 'password',
      password_confirmation: 'password',
    };
    service.register(payload).subscribe((u) => (result = u));

    const req = http.expectOne(`${environment.apiUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ user, token: '4|xyz' }, { status: 201, statusText: 'Created' });

    expect(result).toEqual(user);
    expect(service.token()).toBe('4|xyz');
    expect(service.currentUser()).toEqual(user);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('login() leaves the session empty when credentials are wrong', () => {
    setup();
    let status = 0;
    service.login({ email: 'a@b.c', password: 'x' }).subscribe({
      error: (e) => (status = e.status),
    });
    http
      .expectOne(`${environment.apiUrl}/login`)
      .flush({ message: 'The provided credentials are incorrect.' }, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('loadCurrentUser() restores the session from localStorage', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setup();

    expect(service.loadCurrentUser()).toEqual(user);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.token()).toBe('tok');
  });

  it('loadCurrentUser() clears a token that has no valid saved user', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    localStorage.setItem(USER_STORAGE_KEY, '{not json');
    setup();

    expect(service.loadCurrentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
  });

  it('loadCurrentUser() does nothing without a token', () => {
    setup();
    expect(service.loadCurrentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('logout() calls POST /logout, clears everything and goes to /login', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setup();
    service.loadCurrentUser();

    const promise = service.logout();
    const req = http.expectOne(`${environment.apiUrl}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Logged out successfully.' });
    await promise;

    expect(service.isLoggedIn()).toBe(false);
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('logout() clears the session and goes to /login even if POST /logout fails', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setup();
    service.loadCurrentUser();

    const promise = service.logout();
    http
      .expectOne(`${environment.apiUrl}/logout`)
      .flush({ message: 'Server error' }, { status: 500, statusText: 'Error' });
    await promise;

    expect(service.isLoggedIn()).toBe(false);
    expect(service.token()).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
