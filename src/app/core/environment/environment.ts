/**
 * Application environment settings.
 *
 * Change `apiUrl` to point the app at a different HealthLink API.
 */
export const environment = {
  /** Base URL of the HealthLink REST API (no trailing slash). */
  apiUrl: 'http://127.0.0.1:8000/api',

  /** IANA time zone used by the API and for every date shown in the UI. */
  timeZone: 'Asia/Kuala_Lumpur',

  features: {
    /**
     * `PATCH /consultations/{id}/cancel` is not in /docs/api.json yet.
     * Turn this on once the API supports cancelling consultations.
     */
    cancelConsultation: false,
  },
} as const;
