import { Component, input, output, signal } from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
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

  showMegaMenu = signal(false);

  // Solo mostrar el mega menú si la ruta es '/products'
  private router = inject(Router);
  get isProductsRoute(): boolean {
    return this.router.url.startsWith('/products');
  }
}

