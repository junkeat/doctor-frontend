import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Drawer } from 'primeng/drawer';
import { Message } from 'primeng/message';
import { RadioButton } from 'primeng/radiobutton';
import { Textarea } from 'primeng/textarea';
import { map } from 'rxjs';
import { parseApiError } from '../../core/api/api-error';
import { ApiService } from '../../core/api/api.service';
import { Consultation, ConsultationType, Doctor, StoreConsultationRequest } from '../../core/models';
import { AppAvatar } from '../../shared/avatar/avatar';
import { formatTimeOfDay, toKlIsoString } from '../../shared/utils/kl-time';

export const REASON_MAX_LENGTH = 500;

type FormField = 'type' | 'scheduledAt' | 'reason';

/** API field name -> form control name. */
const API_FIELD_MAP: Record<string, FormField> = {
  type: 'type',
  scheduled_at: 'scheduledAt',
  reason: 'reason',
};

interface TypeOption {
  value: ConsultationType;
  label: string;
  description: string;
  icon: string;
}

/** `required` that also rejects text made only of spaces. */
function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return (control.value ?? '').trim().length > 0 ? null : { required: true };
}

@Component({
  selector: 'app-booking-drawer',
  imports: [ReactiveFormsModule, Drawer, Button, Message, RadioButton, DatePicker, Textarea, AppAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-drawer.html',
  styleUrl: './booking-drawer.scss',
})
export class BookingDrawer {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly doctor = input<Doctor | null>(null);
  readonly visible = model(false);

  /** Emitted with the new consultation after a 201. The drawer closes itself. */
  readonly booked = output<Consultation>();
  /** Emitted after the drawer has closed (used to return focus to the trigger button). */
  readonly closed = output<void>();

  protected readonly reasonMaxLength = REASON_MAX_LENGTH;
  protected readonly typeOptions: TypeOption[] = [
    {
      value: 'chat',
      label: 'Chat',
      description: 'Text-based consultation (usually faster)',
      icon: 'pi pi-comments',
    },
    {
      value: 'video',
      label: 'Video Call',
      description: 'Face-to-face consultation (via video)',
      icon: 'pi pi-video',
    },
  ];

  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    type: this.fb.nonNullable.control<ConsultationType>('chat', Validators.required),
    scheduledAt: this.fb.control<Date | string | null>(null, Validators.required),
    reason: this.fb.nonNullable.control('', [notBlank, Validators.maxLength(REASON_MAX_LENGTH)]),
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly serverErrors = signal<Partial<Record<FormField, string>>>({});

  /** "now" is refreshed every time the drawer opens, so past times cannot be picked. */
  protected readonly minDate = signal(new Date());

  protected readonly hours = computed(() => {
    const doctor = this.doctor();
    return doctor
      ? `${formatTimeOfDay(doctor.available_from)} – ${formatTimeOfDay(doctor.available_to)}`
      : '';
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  protected readonly selectedType = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });
  protected readonly reasonLength = toSignal(
    this.form.controls.reason.valueChanges.pipe(map((value) => (value ?? '').length)),
    { initialValue: 0 },
  );

  protected readonly canSubmit = computed(
    () => this.formStatus() === 'VALID' && !this.submitting(),
  );

  private readonly titleRef = viewChild<ElementRef<HTMLElement>>('drawerTitle');

  constructor() {
    // Fresh form each time the drawer opens (or the doctor changes while open).
    effect(() => {
      const open = this.visible();
      const doctor = this.doctor();
      if (open && doctor) {
        untracked(() => this.resetForm());
      }
    });

    // Typing in a field removes the API error shown under it.
    for (const field of Object.keys(this.form.controls) as FormField[]) {
      const control: AbstractControl = this.form.controls[field];
      control.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.serverErrors()[field]) {
            this.serverErrors.update(({ [field]: _removed, ...rest }) => rest);
          }
        });
    }
  }

  protected fieldError(field: FormField): string | null {
    const control = this.form.controls[field];
    if (control.invalid && (control.touched || control.dirty)) {
      if (control.hasError('required')) {
        return field === 'scheduledAt'
          ? 'Please choose a preferred time.'
          : field === 'reason'
            ? 'Please tell the doctor the reason for your visit.'
            : 'Please choose a consultation type.';
      }
      if (control.hasError('maxlength')) {
        return `The reason may not be greater than ${REASON_MAX_LENGTH} characters.`;
      }
    }
    return this.serverErrors()[field] ?? null;
  }

  protected submit(): void {
    const doctor = this.doctor();
    if (!doctor || this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const scheduledAt =
      value.scheduledAt instanceof Date
        ? toKlIsoString(value.scheduledAt)
        : (value.scheduledAt ?? '');

    const body: StoreConsultationRequest = {
      doctor_id: doctor.id,
      type: value.type,
      scheduled_at: scheduledAt,
      reason: value.reason.trim(),
    };

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.serverErrors.set({});

    this.api.createConsultation(body).subscribe({
      next: (consultation) => {
        this.submitting.set(false);
        this.booked.emit(consultation);
        this.visible.set(false);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const parsed = parseApiError(error);
        if (parsed.status === 401) {
          return; // The interceptor ends the session and redirects.
        }
        this.errorMessage.set(parsed.message);
        const fieldErrors: Partial<Record<FormField, string>> = {};
        for (const [apiField, messages] of Object.entries(parsed.fieldErrors)) {
          const field = API_FIELD_MAP[apiField];
          if (field && messages?.length) {
            fieldErrors[field] = messages[0];
          }
        }
        this.serverErrors.set(fieldErrors);
      },
    });
  }

  protected onShow(): void {
    this.titleRef()?.nativeElement.focus();
  }

  protected onHide(): void {
    this.closed.emit();
  }

  private resetForm(): void {
    this.minDate.set(new Date());
    this.form.reset({ type: 'chat', scheduledAt: null, reason: '' });
    this.errorMessage.set(null);
    this.serverErrors.set({});
    this.submitting.set(false);
  }
}
