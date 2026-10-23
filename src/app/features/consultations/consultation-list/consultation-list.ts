import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { Consultation } from '../../../core/models';
import { StatusPill } from '../../../shared/status-pill/status-pill';
import { KlDateTimePipe } from '../../../shared/utils/kl-date-time.pipe';
import { consultationTypeLabel } from '../consultation-labels';

@Component({
  selector: 'app-consultation-list',
  imports: [Card, Button, Message, Skeleton, StatusPill, KlDateTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultation-list.html',
  styleUrl: './consultation-list.scss',
})
export class ConsultationList {
  readonly consultations = input.required<Consultation[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly select = output<{ consultation: Consultation; trigger: HTMLElement | null }>();
  readonly retry = output<void>();

  protected readonly skeletonRows = [1, 2, 3];
  protected readonly typeLabel = consultationTypeLabel;

  protected onSelect(consultation: Consultation, event: Event): void {
    this.select.emit({ consultation, trigger: event.currentTarget as HTMLElement | null });
  }
}
