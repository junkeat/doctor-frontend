import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';
import { Consultation, Doctor } from '../../../core/models';
import { Header } from '../../../shared/header/header';
import { BookingDrawer } from '../../booking-drawer/booking-drawer';
import { BookRequest, DoctorList } from '../../doctors/doctor-list';
import { ConsultationDetail } from '../consultation-detail/consultation-detail';
import { ConsultationList } from '../consultation-list/consultation-list';
import { ConsultationsStore } from '../consultations.store';

@Component({
  selector: 'app-consultation-page',
  imports: [Header, DoctorList, ConsultationList, BookingDrawer, ConsultationDetail],
  providers: [ConsultationsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultation-page.html',
  styleUrl: './consultation-page.scss',
})
export class ConsultationPage {
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  protected readonly store = inject(ConsultationsStore);

  protected readonly userName = () => this.auth.currentUser()?.name ?? '';

  protected readonly drawerOpen = signal(false);
  protected readonly drawerDoctor = signal<Doctor | null>(null);
  private drawerTrigger: HTMLElement | null = null;

  protected readonly detailOpen = signal(false);
  protected readonly detailConsultation = signal<Consultation | null>(null);
  private detailTrigger: HTMLElement | null = null;

  constructor() {
    this.store.loadAll();
    inject(DestroyRef).onDestroy(() => this.store.clear());
  }

  protected async logout(): Promise<void> {
    this.store.clear();
    this.drawerOpen.set(false);
    this.detailOpen.set(false);
    await this.auth.logout();
  }

  protected openBooking(request: BookRequest): void {
    this.drawerDoctor.set(request.doctor);
    this.drawerTrigger = request.trigger;
    this.drawerOpen.set(true);
  }

  /** Focus goes back to the button that opened the drawer. */
  protected onDrawerClosed(): void {
    this.drawerTrigger?.focus();
    this.drawerTrigger = null;
  }

  protected onBooked(consultation: Consultation): void {
    this.messages.add({
      severity: 'success',
      summary: 'Booking confirmed',
      detail: `Your consultation with ${consultation.doctor.name} is booked.`,
    });
    this.store.loadConsultations(true);
  }

  protected openDetail(event: { consultation: Consultation; trigger: HTMLElement | null }): void {
    this.detailConsultation.set(event.consultation);
    this.detailTrigger = event.trigger;
    this.detailOpen.set(true);
  }

  protected onDetailClosed(): void {
    this.detailTrigger?.focus();
    this.detailTrigger = null;
  }
}
