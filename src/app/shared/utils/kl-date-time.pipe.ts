import { Pipe, PipeTransform } from '@angular/core';
import { formatKlDateTime } from './kl-time';

/** `{{ consultation.scheduled_at | klDateTime }}` -> `Today, 3:30 PM` / `08 Sep 2026, 10:00 AM` */
@Pipe({ name: 'klDateTime' })
export class KlDateTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : formatKlDateTime(date);
  }
}
