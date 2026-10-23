import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../environment/environment';
import { Consultation, Doctor } from '../models';
import { parseApiError } from './api-error';
import { ApiService } from './api.service';

const base = environment.apiUrl;

const doctor: Doctor = {
  id: 1,
  name: 'Dr. Sarah Lim',
  specialty: 'General Practitioner',
  photo_url: null,
  available_from: '09:00:00',
  available_to: '22:00:00',
  available_now: true,
};

const consultation: Consultation = {
  id: 9,
  type: 'chat',
  scheduled_at: '2026-10-23T07:30:00.000000Z',
  reason: 'Fever',
  status: 'scheduled',
  doctor: { id: 1, name: 'Dr. Sarah Lim', specialty: 'General Practitioner' },
};

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login() POSTs credentials', () => {
    let res: unknown;
    api.login({ email: 'a@b.c', password: 'pw' }).subscribe((r) => (res = r));
    const req = http.expectOne(`${base}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.c', password: 'pw' });
    req.flush({ user: { id: 1, name: 'J', email: 'a@b.c' }, token: 't' });
    expect(res).toEqual({ user: { id: 1, name: 'J', email: 'a@b.c' }, token: 't' });
  });

  it('getDoctors() unwraps data', () => {
    let res: Doctor[] = [];
    api.getDoctors().subscribe((r) => (res = r));
    const req = http.expectOne(`${base}/doctors`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [doctor] });
    expect(res).toEqual([doctor]);
  });

  it('getConsultations() unwraps data and sends no status by default', () => {
    let res: Consultation[] = [];
    api.getConsultations().subscribe((r) => (res = r));
    const req = http.expectOne(`${base}/consultations`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ data: [consultation] });
    expect(res).toEqual([consultation]);
  });

  it('getConsultations() sends the status filter', () => {
    api.getConsultations({ status: 'completed' }).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/consultations`);
    expect(req.request.params.get('status')).toBe('completed');
    req.flush({ data: [] });
  });

  it('createConsultation() POSTs the body and returns the created consultation (201)', () => {
    const body = {
      doctor_id: 1,
      type: 'video' as const,
      scheduled_at: '2026-10-23T15:30:00+08:00',
      reason: 'Cough',
    };
    let res: Consultation | undefined;
    api.createConsultation(body).subscribe((r) => (res = r));
    const req = http.expectOne(`${base}/consultations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ data: consultation }, { status: 201, statusText: 'Created' });
    expect(res).toEqual(consultation);
  });

  it('createConsultation() passes a 422 through', () => {
    let error: HttpErrorResponse | undefined;
    api
      .createConsultation({ doctor_id: 1, type: 'chat', scheduled_at: 'x', reason: 'r' })
      .subscribe({ error: (e) => (error = e) });
    http.expectOne(`${base}/consultations`).flush(
      { message: 'This doctor is already booked at the selected time.', errors: { scheduled_at: ['This doctor is already booked at the selected time.'] } },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    expect(error?.status).toBe(422);
  });

  it('cancelConsultation() PATCHes the cancel route', () => {
    api.cancelConsultation(9).subscribe();
    const req = http.expectOne(`${base}/consultations/9/cancel`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: { ...consultation, status: 'cancelled' } });
  });
});

describe('parseApiError', () => {
  const err = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

  it('reads message and field errors from a 422', () => {
    const parsed = parseApiError(
      err(422, { message: 'The scheduled time must be in the future.', errors: { scheduled_at: ['The scheduled time must be in the future.'] } }),
    );
    expect(parsed.status).toBe(422);
    expect(parsed.message).toBe('The scheduled time must be in the future.');
    expect(parsed.fieldErrors['scheduled_at']).toEqual(['The scheduled time must be in the future.']);
  });

  it('uses the first field error instead of "(and 1 more error)"', () => {
    const parsed = parseApiError(
      err(422, { message: 'The email field is required. (and 1 more error)', errors: { email: ['The email field is required.'], password: ['The password field is required.'] } }),
    );
    expect(parsed.message).toBe('The email field is required.');
  });

  it('reads the message of a 401', () => {
    expect(parseApiError(err(401, { message: 'The provided credentials are incorrect.' })).message).toBe(
      'The provided credentials are incorrect.',
    );
  });

  it('explains network errors and throttling', () => {
    expect(parseApiError(err(0, null)).message).toMatch(/Cannot reach the server/);
    expect(parseApiError(err(429, null)).message).toMatch(/Too many attempts/);
  });

  it('falls back to a generic message', () => {
    expect(parseApiError(err(500, '<html>')).message).toBe('Something went wrong. Please try again.');
    expect(parseApiError(new Error('x')).message).toBe('Something went wrong. Please try again.');
  });
});
