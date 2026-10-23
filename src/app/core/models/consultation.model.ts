import { User } from './user.model';

/** `ConsultationType` enum from /docs/api.json. */
export type ConsultationType = 'chat' | 'video';

/**
 * `ConsultationStatus` enum from /docs/api.json is `scheduled | completed`.
 * `cancelled` is not in the API yet; it is kept here so the UI is ready for it.
 */
export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled';

/** Doctor summary embedded in a `ConsultationResource`. */
export interface ConsultationDoctor {
  id: number;
  name: string;
  specialty: string;
}

/** `ConsultationResource` from /docs/api.json. */
export interface Consultation {
  id: number;
  type: ConsultationType;
  /** ISO 8601 date-time, returned by the API in UTC (e.g. `2026-10-23T07:30:00.000000Z`). */
  scheduled_at: string;
  reason: string;
  status: ConsultationStatus;
  user?: User;
  doctor: ConsultationDoctor;
}
