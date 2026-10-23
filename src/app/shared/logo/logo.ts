import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** HealthLink logo: heart with a pulse line + wordmark. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo" [class.logo--large]="size() === 'large'">
      <svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          d="M16 28.5s-11.5-7.1-11.5-15.2A6.3 6.3 0 0 1 16 9.6a6.3 6.3 0 0 1 11.5 3.7C27.5 21.4 16 28.5 16 28.5Z"
          fill="currentColor"
        />
        <path
          d="M6.5 16.5h5l2-4 3 7.5 2.5-5 1.5 1.5h5"
          fill="none"
          stroke="#fff"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="logo__text">HealthLink</span>
    </span>
  `,
  styles: `
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--hl-primary);
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: -0.01em;
    }
    .logo__mark {
      width: 2rem;
      height: 2rem;
      flex: none;
    }
    .logo__text {
      color: var(--hl-text);
    }
    .logo--large {
      font-size: 1.5rem;
    }
    .logo--large .logo__mark {
      width: 2.5rem;
      height: 2.5rem;
    }
  `,
})
export class Logo {
  readonly size = input<'normal' | 'large'>('normal');
}
