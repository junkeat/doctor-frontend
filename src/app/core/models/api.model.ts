import { ConsultationStatus, ConsultationType } from './consultation.model';
import { User } from './user.model';

/** Laravel resource wrapper: `{ "data": ... }`. */
export interface DataResponse<T> {
  data: T;
}

/** `LoginRequest` from /docs/api.json. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** `RegisterRequest` from /docs/api.json. */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/** `POST /login` (200) and `POST /register` (201) response. */
export interface LoginResponse {
  user: User;
  token: string;
}

/** `POST /logout` 200 response. */
export interface LogoutResponse {
  message: string;
}

/** `StoreConsultationRequest` from /docs/api.json. */
export interface StoreConsultationRequest {
  doctor_id: number;
  type: ConsultationType;
  /** ISO 8601 date-time with offset, e.g. `2026-10-23T15:30:00+08:00`. */
  scheduled_at: string;
  /** Max 500 characters. */
  reason: string;
}

/** Query parameters of `GET /consultations`. */
export interface ConsultationListQuery {
  status?: ConsultationStatus | null;
}
