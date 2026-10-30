/**
 * Application environment settings.
 *
 * Change `apiUrl` to point the app at a different HealthLink API.
 */
export const environment = {
  /** Base URL of the HealthLink REST API (no trailing slash). */
  apiUrl: 'http://127.0.0.1:8000/api',
} as const;
