import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { parseApiError, trackServerErrors } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { Logo } from '../../shared/logo/logo';

type RegisterField = 'name' | 'email' | 'password' | 'password_confirmation';

/** Cross-field validator ensuring `password` and `password_confirmation` match. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value ?? '';
  const confirm = group.get('password_confirmation')?.value ?? '';
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, Card, InputText, Password, Button, Message, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
    },
    { validators: [passwordsMatch] },
  );

  protected readonly serverErrors = trackServerErrors(this.form.controls);

  protected fieldError(field: RegisterField): string | null {
    const control = this.form.controls[field];
    const touchedOrDirty = control.touched || control.dirty;

    if (control.invalid && touchedOrDirty) {
      if (control.hasError('required')) {
        switch (field) {
          case 'name':
            return 'Name is required.';
          case 'email':
            return 'Email is required.';
          case 'password':
            return 'Password is required.';
          case 'password_confirmation':
            return 'Please confirm your password.';
        }
      }
      if (field === 'email' && control.hasError('email')) {
        return 'Please enter a valid email address.';
      }
      if (field === 'password' && control.hasError('minlength')) {
        return 'Password must be at least 8 characters.';
      }
      if (control.hasError('maxlength')) {
        return 'Must not exceed 255 characters.';
      }
    }

    if (
      field === 'password_confirmation' &&
      touchedOrDirty &&
      this.form.hasError('passwordMismatch')
    ) {
      return 'Passwords do not match.';
    }

    return this.serverErrors()[field] ?? null;
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
    this.serverErrors.set({});

    const raw = this.form.getRawValue();
    this.auth
      .register({
        name: raw.name.trim(),
        email: raw.email.trim(),
        password: raw.password,
        password_confirmation: raw.password_confirmation,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          void this.router.navigateByUrl('/');
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          const parsed = parseApiError(error);
          this.errorMessage.set(parsed.message);
          const fieldErrors: Partial<Record<RegisterField, string>> = {};
          for (const field of ['name', 'email', 'password', 'password_confirmation'] as const) {
            const messages = parsed.fieldErrors[field];
            if (messages?.length) {
              fieldErrors[field] = messages[0];
            }
          }
          this.serverErrors.set(fieldErrors);
        },
      });
  }
}
