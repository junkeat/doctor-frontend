import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { parseApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { Logo } from '../../shared/logo/logo';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, Card, InputText, Password, Button, Message, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** `?returnUrl=` query param (bound by `withComponentInputBinding`). */
  readonly returnUrl = input<string | undefined>();

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  /** Changing this re-creates the password field (see template). */
  protected readonly passwordInstance = signal(0);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected showError(control: 'email' | 'password'): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(parseApiError(error).message);
        // Keep the email, clear the password.
        this.form.controls.password.reset('');
        this.passwordInstance.update((n) => n + 1);
      },
    });
  }
}

/** Only allow in-app paths, to avoid open redirects like `//evil.com`. */
function safeReturnUrl(url: string | undefined): string {
  if (
    !url ||
    !url.startsWith('/') ||
    url.startsWith('//') ||
    url.startsWith('/login') ||
    url.startsWith('/register')
  ) {
    return '/';
  }
  return url;
}
