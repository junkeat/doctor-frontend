import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { parseApiError } from '../../../core/api/api-error';
import { ApiService } from '../../../core/api/api.service';
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
  imports: [Header, DoctorList, ConsultationList, BookingDrawer, ConsultationDetail, ConfirmDialog],
  providers: [ConsultationsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultation-page.html',
  styleUrl: './consultation-page.scss',
})
export class ConsultationPage {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  protected readonly store = inject(ConsultationsStore);

  protected readonly userName = () => this.auth.currentUser()?.name ?? '';

  protected readonly drawerOpen = signal(false);
  protected readonly drawerDoctor = signal<Doctor | null>(null);
  private drawerTrigger: HTMLElement | null = null;

  protected readonly detailOpen = signal(false);
  protected readonly detailConsultation = signal<Consultation | null>(null);
  protected readonly cancelling = signal(false);
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

  protected confirmCancel(consultation: Consultation): void {
    this.confirmation.confirm({
      header: 'Cancel consultation',
      message: `Cancel your consultation with ${consultation.doctor.name}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, cancel it',
      rejectLabel: 'Keep it',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => this.cancel(consultation),
    });
  }

  private cancel(consultation: Consultation): void {
    this.cancelling.set(true);
    this.api.cancelConsultation(consultation.id).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.detailOpen.set(false);
        this.messages.add({
          severity: 'success',
          summary: 'Consultation cancelled',
          detail: 'Your consultation has been cancelled.',
        });
        this.store.loadConsultations(true);
      },
      error: (error: unknown) => {
        this.cancelling.set(false);
        const parsed = parseApiError(error);
        if (parsed.status === 401) {
          return;
        }
        this.messages.add({ severity: 'error', summary: 'Could not cancel', detail: parsed.message });
      },
    });
  }
}
