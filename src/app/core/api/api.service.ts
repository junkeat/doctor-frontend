import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../environment/environment';
import {
  Consultation,
  ConsultationListQuery,
  DataResponse,
  Doctor,
  LoginRequest,
  LoginResponse,
  StoreConsultationRequest,
} from '../models';

/** Paths that must never receive the Authorization header. */
export const PUBLIC_AUTH_PATHS = ['/login', '/register'] as const;

/** Typed wrapper around every HealthLink API endpoint. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** `POST /login` */
  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, body);
  }

  /** `GET /doctors` */
  getDoctors(): Observable<Doctor[]> {
    return this.http
      .get<DataResponse<Doctor[]>>(`${this.baseUrl}/doctors`)
      .pipe(map((res) => res.data));
  }

  /** `GET /consultations?status=` (newest first, as returned by the API). */
  getConsultations(query: ConsultationListQuery = {}): Observable<Consultation[]> {
    let params = new HttpParams();
    if (query.status) {
      params = params.set('status', query.status);
    }
    return this.http
      .get<DataResponse<Consultation[]>>(`${this.baseUrl}/consultations`, { params })
      .pipe(map((res) => res.data));
  }

  /** `POST /consultations` -> 201 */
  createConsultation(body: StoreConsultationRequest): Observable<Consultation> {
    return this.http
      .post<DataResponse<Consultation>>(`${this.baseUrl}/consultations`, body)
      .pipe(map((res) => res.data));
  }

  /**
   * `PATCH /consultations/{id}/cancel`
   *
   * Not in /docs/api.json yet. Only used when `environment.features.cancelConsultation` is on.
   */
  cancelConsultation(id: number): Observable<Consultation> {
    return this.http
      .patch<DataResponse<Consultation>>(`${this.baseUrl}/consultations/${id}/cancel`, {})
      .pipe(map((res) => res.data));
  }
}
