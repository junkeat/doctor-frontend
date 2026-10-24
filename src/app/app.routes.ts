import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Log in · HealthLink',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Create account · HealthLink',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    pathMatch: 'full',
    title: 'Consult a Doctor · HealthLink',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consultations/consultation-page/consultation-page').then(
        (m) => m.ConsultationPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
