import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../../core/models/interfaces/NavItem.interface';

@Component({
  selector: 'app-nav-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.scss'
})
export class NavMenu {
  navItems = input.required<NavItem[]>();
  isMobile = input<boolean>(false);

  linkClicked = output<NavItem>();

  onLinkClick(item: NavItem): void {
    this.linkClicked.emit(item);
  }
}

