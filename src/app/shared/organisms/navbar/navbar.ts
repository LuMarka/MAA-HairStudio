import { Component, HostListener, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavItem } from '../../../core/models/interfaces/NavItem.interface';
import { Logo } from "../../molecules/logo/logo";
import { NavMenu } from "../../molecules/nav-menu/nav-menu";
import { MenuToggle } from "../../molecules/menu-toggle/menu-toggle";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [Logo, NavMenu, MenuToggle],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Navbar {
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);

  navItems = signal<NavItem[]>([
    { label: 'Inicio', route: '/' },
    { label: 'Tienda', route: '/products' },
    { label: 'Beauty Scan', route: '/services' },
    { label: 'Mi historia', route: '/about' },
    { label: 'Galería', route: '/gallery' },
    { label: 'Contacto', route: '/contact' }
  ]);

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    if (window.innerWidth >= 768) {
      this.isMobileMenuOpen.set(false);
    }
  }

  onMobileMenuToggle(isOpen: boolean): void {
    this.isMobileMenuOpen.set(isOpen);
  }

  onNavLinkClick(): void {
    this.isMobileMenuOpen.set(false);
  }
}
