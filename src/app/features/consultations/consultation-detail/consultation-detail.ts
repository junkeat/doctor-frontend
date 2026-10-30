import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Consultation } from '../../../core/models';
import { StatusPill } from '../../../shared/status-pill/status-pill';
import { KlDateTimePipe } from '../../../shared/utils/kl-date-time.pipe';

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

  readonly closed = output<void>();
}
