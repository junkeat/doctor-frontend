import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { getInitials } from '../utils/initials';

/** Round avatar: the photo when there is one (and it loads), otherwise the initials. */
@Component({
  selector: 'app-avatar',
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showImage()) {
      <p-avatar
        [image]="imageUrl()!"
        shape="circle"
        [size]="primeSize()"
        [ariaLabel]="name()"
        (onImageError)="imageFailed.set(true)"
        [class]="'app-avatar app-avatar--' + size()"
      />
    } @else {
      <p-avatar
        [label]="initials()"
        shape="circle"
        [size]="primeSize()"
        [ariaLabel]="name()"
        [class]="'app-avatar app-avatar--initials app-avatar--' + size()"
      />
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    .app-avatar--initials {
      background: var(--hl-primary-soft);
      color: var(--hl-primary);
      font-weight: 600;
    }
    .app-avatar--small {
      width: 2.25rem;
      height: 2.25rem;
      font-size: 0.875rem;
    }
    .app-avatar--medium {
      width: 3.25rem;
      height: 3.25rem;
      font-size: 1.05rem;
    }
    .app-avatar--large {
      width: 4rem;
      height: 4rem;
      font-size: 1.25rem;
    }
  `,
})
export class AppAvatar {
  readonly name = input.required<string>();
  readonly imageUrl = input<string | null | undefined>(null);
  readonly size = input<'small' | 'medium' | 'large'>('medium');

  /** Reset the error flag whenever the URL changes. */
  protected readonly imageFailed = linkedSignal({
    source: this.imageUrl,
    computation: () => false,
  });

  protected readonly initials = computed(() => getInitials(this.name()));
  protected readonly showImage = computed(() => !!this.imageUrl() && !this.imageFailed());
  protected readonly primeSize = computed(() => (this.size() === 'large' ? 'xlarge' : 'large'));
}
