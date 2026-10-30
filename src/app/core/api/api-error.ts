import { HttpErrorResponse } from '@angular/common/http';
import { WritableSignal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';

export interface ParsedApiError {
  status: number;
  message: string;
  /** Laravel validation errors keyed by API field name (e.g. `scheduled_at`). */
  fieldErrors: Record<string, string[]>;
}

const NETWORK_MESSAGE = 'Cannot reach the server. Please check your connection and try again.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';
const THROTTLE_MESSAGE = 'Too many attempts. Please wait a minute and try again.';

/** Turns any HTTP error into a message (and field errors) that can be shown to the user. */
export function parseApiError(error: unknown): ParsedApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: -1, message: GENERIC_MESSAGE, fieldErrors: {} };
  }

  if (error.status === 0) {
    return { status: 0, message: NETWORK_MESSAGE, fieldErrors: {} };
  }

  if (error.status === 429) {
    return { status: 429, message: THROTTLE_MESSAGE, fieldErrors: {} };
  }

  const body: unknown = error.error;
  let message = GENERIC_MESSAGE;
  let fieldErrors: Record<string, string[]> = {};

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record['errors'] === 'object' && record['errors'] !== null) {
      fieldErrors = record['errors'] as Record<string, string[]>;
    }
    const firstFieldError = Object.values(fieldErrors).flat()[0];
    if (typeof record['message'] === 'string' && record['message']) {
      // Laravel adds "(and N more errors)" to the message; the first field error reads better.
      message = firstFieldError && /\(and \d+ more errors?\)$/.test(record['message'])
        ? firstFieldError
        : record['message'];
    } else if (firstFieldError) {
      message = firstFieldError;
    }
  }

  return { status: error.status, message, fieldErrors };
}

/** Signal of server-side field errors that clears each field's error when the user edits it. */
export function trackServerErrors<K extends string>(
  controls: Record<K, AbstractControl>,
): WritableSignal<Partial<Record<K, string>>> {
  const errors = signal<Partial<Record<K, string>>>({});
  for (const [key, control] of Object.entries<AbstractControl>(controls)) {
    control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (errors()[key as K]) {
        errors.update(({ [key as K]: _removed, ...rest }) => rest as Partial<Record<K, string>>);
      }
    });
  }
  return errors;
}
