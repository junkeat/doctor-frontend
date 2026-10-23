import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth.guards';
import { AuthService } from './auth.service';

describe('route guards', () => {
  const loggedIn = signal(false);
  const createUrlTree = vi.fn((commands: unknown[], extras?: unknown) => ({ commands, extras }) as unknown as UrlTree);

  beforeEach(() => {
    loggedIn.set(false);
    createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: loggedIn } },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
  });

  const run = (guard: typeof authGuard, url = '/') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  describe('authGuard', () => {
    it('allows logged-in users', () => {
      loggedIn.set(true);
      expect(run(authGuard)).toBe(true);
    });

    it('redirects guests to /login', () => {
      run(authGuard);
      expect(createUrlTree).toHaveBeenCalledWith(['/login'], { queryParams: {} });
    });

    it('keeps the return URL', () => {
      run(authGuard, '/some/page?x=1');
      expect(createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/some/page?x=1' },
      });
    });
  });

  describe('guestGuard', () => {
    it('allows guests', () => {
      expect(run(guestGuard, '/login')).toBe(true);
    });

    it('redirects logged-in users to /', () => {
      loggedIn.set(true);
      run(guestGuard, '/login');
      expect(createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });
});
