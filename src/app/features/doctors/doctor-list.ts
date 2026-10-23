import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { Doctor } from '../../core/models';
import { AppAvatar } from '../../shared/avatar/avatar';

export interface BookRequest {
  doctor: Doctor;
  /** Button that opened the drawer; focus returns to it on close. */
  trigger: HTMLElement | null;
}

@Component({
  selector: 'app-doctor-list',
  imports: [Card, Button, Message, Skeleton, AppAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-list.html',
  styleUrl: './doctor-list.scss',
})
export class DoctorList {
  readonly doctors = input.required<Doctor[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  /** Doctor whose booking drawer is open. */
  readonly activeDoctorId = input<number | null>(null);

  readonly book = output<BookRequest>();
  readonly retry = output<void>();

  protected readonly skeletonRows = [1, 2, 3];

  protected onBook(doctor: Doctor, event: Event): void {
    const target = event.currentTarget as HTMLElement | null;
    // p-button emits the click on its host; the real <button> is inside it.
    const trigger = target?.querySelector?.('button') ?? target;
    this.book.emit({ doctor, trigger: trigger as HTMLElement | null });
  }
}
