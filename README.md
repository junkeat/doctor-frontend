# HealthLink – Doctor Consultation Frontend

Angular 22 + PrimeNG 21 patient portal for the HealthLink Laravel API.

## Requirements

- Node.js **24.15+** (Angular 22 requirement). Check with `node -v`.
- The HealthLink Laravel API (`doctor-backend`) running locally.

## Setup

```bash
# 1. Install
npm install

# 2. Set the API URL (default: http://127.0.0.1:8000/api)
#    Edit src/app/core/environment/environment.ts -> apiUrl

# 3. Run the API (in the doctor-backend folder)
php artisan migrate --seed
php artisan serve          # http://127.0.0.1:8000

# 4. Run the app
npx ng serve               # http://localhost:4200

# 5. Run the tests / build
npx ng test --watch=false
npx ng build
```

## Test login

The seeded user (`database/seeders/UserSeeder.php` in the backend):

| Email              | Password   |
| ------------------ | ---------- |
| `john@example.com` | `password` |

If you seeded before this password was set, run `php artisan db:seed --class=UserSeeder` again.

## API notes

The app follows `http://127.0.0.1:8000/docs/api.json`. Differences from the original brief:

- Logout calls `POST /logout`, then clears the token and user on the client (even if the request fails).
- The user from `POST /login` is saved in `localStorage` with the token and restored on app start.
  An expired token is caught by the first `401` (the app clears the session and goes to `/login`).
- The **Cancel Consultation** button is behind `environment.features.cancelConsultation`
  (default `false`). Set it to `true` once the cancel endpoint exists.
- Statuses in the API are `scheduled` and `completed`. The UI also supports `cancelled`.
- `scheduled_at` is sent as ISO 8601 with `+08:00` (Asia/Kuala_Lumpur). The API returns UTC; the UI shows Kuala Lumpur time.

## Structure

```
src/app
  core/      api (ApiService), auth (AuthService, guards, interceptor), models, environment, theme
  features/  login, doctors, consultations, booking-drawer
  shared/    header, status-pill, avatar, logo, utils (Kuala Lumpur time helpers)
```
