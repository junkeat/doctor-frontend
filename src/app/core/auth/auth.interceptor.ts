import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { PUBLIC_AUTH_PATHS } from '../api/api.service';
import { environment } from '../environment/environment';
import { AuthService } from './auth.service';

export const SESSION_ENDED_MESSAGE = 'Your session has ended. Please log in again.';

/**
 * - Adds `Authorization: Bearer <token>` to every API request except login/register.
 * - On a 401 from any other API request: clears the session, shows a toast and goes to `/login`.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const messages = inject(MessageService);

  if (!isApiUrl(req.url) || isPublicAuthUrl(req.url)) {
    return next(req);
  }

  const token = auth.token();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Several requests can fail at once; only react to the first one.
        if (auth.token()) {
          auth.clearSession();
          messages.add({
            severity: 'warn',
            summary: 'Signed out',
            detail: SESSION_ENDED_MESSAGE,
          });
        }
        if (!router.url.startsWith('/login')) {
          const returnUrl = router.url && router.url !== '/' ? router.url : undefined;
          void router.navigate(['/login'], { queryParams: returnUrl ? { returnUrl } : {} });
        }
      }
      return throwError(() => error);
    }),
  );
};

function isApiUrl(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}

function isPublicAuthUrl(url: string): boolean {
  const path = url.slice(environment.apiUrl.length).split('?')[0];
  return (PUBLIC_AUTH_PATHS as readonly string[]).includes(path);
}
