import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { AppAvatar } from '../avatar/avatar';
import { Logo } from '../logo/logo';
import { USER_ROLE_LABEL } from './header.constants';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Menu, AppAvatar, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  readonly userName = input.required<string>();
  readonly logout = output<void>();

  protected readonly roleLabel = USER_ROLE_LABEL;
  protected readonly menuOpen = signal(false);

  protected readonly menuItems: MenuItem[] = [
    {
      label: 'Log out',
      icon: 'pi pi-sign-out',
      command: () => this.logout.emit(),
    },
  ];
}
