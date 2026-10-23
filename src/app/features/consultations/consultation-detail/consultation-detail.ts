import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Consultation } from '../../../core/models';
import { environment } from '../../../core/environment/environment';
import { StatusPill } from '../../../shared/status-pill/status-pill';
import { KlDateTimePipe } from '../../../shared/utils/kl-date-time.pipe';
import { consultationTypeLabel } from '../consultation-labels';

/** True when the consultation can be cancelled: scheduled and still in the future. */
export function canCancelConsultation(c: Consultation | null, now: Date = new Date()): boolean {
  return !!c && c.status === 'scheduled' && new Date(c.scheduled_at).getTime() > now.getTime();
}

@Component({
  selector: 'app-consultation-detail',
  imports: [Dialog, Button, StatusPill, KlDateTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultation-detail.html',
  styleUrl: './consultation-detail.scss',
})
export class ConsultationDetail {
  readonly consultation = input<Consultation | null>(null);
  readonly visible = model(false);
  readonly cancelling = input(false);

  readonly cancelRequested = output<Consultation>();
  readonly closed = output<void>();

  protected readonly typeLabel = consultationTypeLabel;

  /** The cancel endpoint is not in /docs/api.json yet, so the button is behind a flag. */
  protected readonly showCancel = computed(
    () => environment.features.cancelConsultation && canCancelConsultation(this.consultation()),
  );
}
