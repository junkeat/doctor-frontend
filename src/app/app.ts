import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // PrimeNG Toast renders each message with role="alert" and aria-live="assertive".
  template: `
    <p-toast position="top-right" [life]="5000" />
    <router-outlet />
  `,
})
export class App {}
