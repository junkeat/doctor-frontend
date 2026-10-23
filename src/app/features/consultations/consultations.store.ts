import { Injectable, inject, signal } from '@angular/core';
import { parseApiError } from '../../core/api/api-error';
import { ApiService } from '../../core/api/api.service';
import { Consultation, Doctor } from '../../core/models';

/**
 * Page state for "/". It is provided by `ConsultationPage` (not root), so it is destroyed,
 * and all data is dropped from memory, when the user logs out and the page closes.
 */
@Injectable()
export class ConsultationsStore {
  private readonly api = inject(ApiService);

  readonly doctors = signal<Doctor[]>([]);
  readonly doctorsLoading = signal(true);
  readonly doctorsError = signal<string | null>(null);

  readonly consultations = signal<Consultation[]>([]);
  readonly consultationsLoading = signal(true);
  readonly consultationsError = signal<string | null>(null);

  loadAll(): void {
    this.loadDoctors();
    this.loadConsultations();
  }

  loadDoctors(): void {
    this.doctorsLoading.set(true);
    this.doctorsError.set(null);
    this.api.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.doctorsLoading.set(false);
      },
      error: (error: unknown) => {
        this.doctorsError.set(parseApiError(error).message);
        this.doctorsLoading.set(false);
      },
    });
  }

  /** `silent` keeps the current list on screen while refreshing. */
  loadConsultations(silent = false): void {
    if (!silent) {
      this.consultationsLoading.set(true);
    }
    this.consultationsError.set(null);
    this.api.getConsultations().subscribe({
      next: (items) => {
        this.consultations.set(items);
        this.consultationsLoading.set(false);
      },
      error: (error: unknown) => {
        this.consultationsError.set(parseApiError(error).message);
        this.consultationsLoading.set(false);
      },
    });
  }

  clear(): void {
    this.doctors.set([]);
    this.consultations.set([]);
    this.doctorsError.set(null);
    this.consultationsError.set(null);
  }
}
