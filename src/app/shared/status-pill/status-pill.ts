import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { ConsultationStatus } from '../../core/models';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

interface StatusStyle {
  label: string;
  severity: TagSeverity;
  cssClass: string;
}

export const STATUS_STYLES: Record<ConsultationStatus, StatusStyle> = {
  // Purple has no PrimeNG severity, so it uses a custom class.
  scheduled: { label: 'Scheduled', severity: undefined, cssClass: 'status-pill--scheduled' },
  completed: { label: 'Completed', severity: 'success', cssClass: 'status-pill--completed' },
  cancelled: { label: 'Cancelled', severity: 'secondary', cssClass: 'status-pill--cancelled' },
};

/** PrimeNG Tag showing a consultation status. */
@Component({
  selector: 'app-status-pill',
  imports: [Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-tag
      [value]="style().label"
      [severity]="style().severity"
      [rounded]="true"
      [class]="'status-pill ' + style().cssClass"
    />
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .status-pill {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      white-space: nowrap;
    }
    .status-pill--scheduled {
      background: var(--hl-purple-soft);
      color: var(--hl-purple);
    }
  `,
})
export class StatusPill {
  readonly status = input.required<ConsultationStatus>();

  protected readonly style = computed<StatusStyle>(
    () =>
      STATUS_STYLES[this.status()] ?? {
        label: this.status(),
        severity: 'secondary',
        cssClass: 'status-pill--unknown',
      },
  );
}
