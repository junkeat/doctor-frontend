import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { environment } from '../../core/environment/environment';
import { Consultation, Doctor } from '../../core/models';
import { BookingDrawer } from './booking-drawer';

const doctor: Doctor = {
  id: 1,
  name: 'Dr. Sarah Lim',
  specialty: 'General Practitioner',
  photo_url: null,
  available_from: '09:00:00',
  available_to: '22:00:00',
  available_now: true,
};

const created: Consultation = {
  id: 10,
  type: 'chat',
  scheduled_at: '2026-10-24T02:00:00.000000Z',
  reason: 'Fever and sore throat for 2 days',
  status: 'scheduled',
  doctor: { id: 1, name: doctor.name, specialty: doctor.specialty },
};

describe('BookingDrawer', () => {
  let fixture: ComponentFixture<BookingDrawer>;
  let http: HttpTestingController;
  let component: BookingDrawer;

  beforeEach(async () => {
    // Fixed "now" so tomorrow's slots always exist.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-23T08:00:00+08:00'));

    await TestBed.configureTestingModule({
      imports: [BookingDrawer],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), providePrimeNG()],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingDrawer);
    http = TestBed.inject(HttpTestingController);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('doctor', doctor);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  /** Test helpers use the protected members through a loose view of the component. */
  const c = () =>
    component as unknown as {
      form: import('@angular/forms').FormGroup;
      canSubmit: () => boolean;
      submit: () => void;
      errorMessage: () => string | null;
    };
  const body = () => document.body;

  it('starts with Chat selected and the confirm button disabled', () => {
    expect(c().form.value.type).toBe('chat');
    expect(c().canSubmit()).toBe(false);
    const confirm = body().querySelector<HTMLButtonElement>('.booking__submit');
    expect(confirm?.disabled).toBe(true);
  });

  it('shows the header, doctor summary and secure note', () => {
    expect(body().textContent).toContain('Book Consultation');
    expect(body().textContent).toContain('Schedule a consultation with Dr. Sarah Lim');
    expect(body().textContent).toContain('General Practitioner');
    expect(body().textContent).toContain('Your information is secure and confidential.');
  });

  it('renders a datetime picker', () => {
    expect(body().querySelector('p-datepicker')).toBeTruthy();
  });

  it('requires a time and a reason (min 1 character)', () => {
    expect(c().form.valid).toBe(false);
    c().form.patchValue({ scheduledAt: new Date('2026-10-23T15:30:00+08:00') });
    expect(c().form.valid).toBe(false);
    c().form.patchValue({ reason: '   ' });
    expect(c().form.controls['reason'].hasError('required')).toBe(true);
    c().form.patchValue({ reason: 'x' });
    expect(c().form.valid).toBe(true);
    expect(c().canSubmit()).toBe(true);
  });

  it('rejects a reason longer than 500 characters', () => {
    c().form.patchValue({ scheduledAt: '2026-10-23T15:30:00+08:00', reason: 'a'.repeat(501) });
    expect(c().form.controls['reason'].hasError('maxlength')).toBe(true);
    expect(c().canSubmit()).toBe(false);
  });

  it('shows error text under the fields after a failed submit attempt', () => {
    c().submit();
    fixture.detectChanges();
    expect(body().textContent).toContain('Please choose a preferred time.');
    expect(body().textContent).toContain('Please tell the doctor the reason for your visit.');
    http.expectNone(`${environment.apiUrl}/consultations`);
  });

  it('updates the reason counter', () => {
    c().form.patchValue({ reason: 'Fever and sore throat for 2 days' });
    fixture.detectChanges();
    expect(body().querySelector('.reason__counter')?.textContent?.trim()).toBe('32/500');
  });

  it('submits the booking, emits it and closes on success (201)', () => {
    const booked = vi.fn();
    component.booked.subscribe(booked);
    c().form.patchValue({
      type: 'video',
      scheduledAt: new Date(2026, 9, 23, 15, 30),
      reason: '  Fever and sore throat for 2 days  ',
    });

    c().submit();
    const req = http.expectOne(`${environment.apiUrl}/consultations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      doctor_id: 1,
      type: 'video',
      scheduled_at: '2026-10-23T15:30:00+08:00',
      reason: 'Fever and sore throat for 2 days',
    });
    req.flush({ data: created }, { status: 201, statusText: 'Created' });

    expect(booked).toHaveBeenCalledWith(created);
    expect(component.visible()).toBe(false);
  });

  it('ignores a second submit while the request is running', () => {
    c().form.patchValue({ scheduledAt: '2026-10-23T15:30:00+08:00', reason: 'x' });
    c().submit();
    c().submit();
    http.expectOne(`${environment.apiUrl}/consultations`).flush({ data: created }, { status: 201, statusText: 'Created' });
  });

  it('on 422 keeps the form data, shows the API message and the field error', () => {
    const booked = vi.fn();
    component.booked.subscribe(booked);
    c().form.patchValue({
      type: 'video',
      scheduledAt: '2026-10-23T15:30:00+08:00',
      reason: 'Cough',
    });

    c().submit();
    http.expectOne(`${environment.apiUrl}/consultations`).flush(
      {
        message: 'This doctor is already booked at the selected time.',
        errors: { scheduled_at: ['This doctor is already booked at the selected time.'] },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    fixture.detectChanges();

    expect(booked).not.toHaveBeenCalled();
    expect(component.visible()).toBe(true);
    expect(c().form.value).toEqual({
      type: 'video',
      scheduledAt: '2026-10-23T15:30:00+08:00',
      reason: 'Cough',
    });
    expect(c().errorMessage()).toBe('This doctor is already booked at the selected time.');
    expect(body().querySelector('p-message')?.textContent).toContain('already booked');
    expect(body().querySelectorAll('.field-error').length).toBeGreaterThan(0);
    expect(c().canSubmit()).toBe(true);
  });
});
