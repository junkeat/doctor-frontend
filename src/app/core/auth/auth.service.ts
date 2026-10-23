import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, map, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { LoginRequest, User } from '../models';

export const TOKEN_STORAGE_KEY = 'healthlink.token';
export const USER_STORAGE_KEY = 'healthlink.user';

/**
 * Holds the Sanctum token and the logged-in user.
 *
 * The API has no `GET /user` (see /docs/api.json), so:
 * - the user returned by `POST /login` is kept in localStorage with the token and
 *   restored on app start;
 * - logout calls `POST /logout`, then clears the token and user (even if the request fails);
 * - an invalid or expired token is caught by the first 401 (see `authInterceptor`).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly tokenState = signal<string | null>(null);
  private readonly userState = signal<User | null>(null);

  readonly token = this.tokenState.asReadonly();
  readonly currentUser = this.userState.asReadonly();
  readonly isLoggedIn = computed(() => !!this.tokenState() && !!this.userState());

  /** Logs in and stores the session. Errors are passed through to the caller. */
  login(credentials: LoginRequest): Observable<User> {
    return this.api.login(credentials).pipe(
      tap((res) => this.setSession(res.token, res.user)),
      map((res) => res.user),
    );
  }

  /**
   * Restores the session from localStorage on app start.
   * If the token exists but the saved user is missing or broken, the token is cleared.
   */
  loadCurrentUser(): User | null {
    const token = readStorage(TOKEN_STORAGE_KEY);
    if (!token) {
      this.clearSession();
      return null;
    }

    const user = parseUser(readStorage(USER_STORAGE_KEY));
    if (!user) {
      this.clearSession();
      return null;
    }

    this.tokenState.set(token);
    this.userState.set(user);
    return user;
  }

  /** Calls `POST /logout`, then clears the session (even on error) and goes to the login page. */
  async logout(): Promise<void> {
    if (this.tokenState()) {
      try {
        await firstValueFrom(this.api.logout());
      } catch {
        // Clear the token even if the logout request fails.
      }
    }
    this.clearSession();
    await this.router.navigateByUrl('/login');
  }

  /** Removes the token and user from memory and localStorage. */
  clearSession(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    removeStorage(TOKEN_STORAGE_KEY);
    removeStorage(USER_STORAGE_KEY);
  }

  private setSession(token: string, user: User): void {
    this.tokenState.set(token);
    this.userState.set(user);
    writeStorage(TOKEN_STORAGE_KEY, token);
    writeStorage(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

function parseUser(raw: string | null): User | null {
  if (!raw) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === 'object' &&
      typeof (value as User).id === 'number' &&
      typeof (value as User).name === 'string' &&
      typeof (value as User).email === 'string'
    ) {
      const { id, name, email } = value as User;
      return { id, name, email };
    }
  } catch {
    // Broken JSON: treat as no user.
  }
  return null;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode); the session then lasts for this tab only.
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}
