import { Component, computed, signal, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface NavigationRoute {
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-layout-dash',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './layout-dash.html',
  styleUrl: './layout-dash.scss'
})
export class LayoutDash {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSidebarOpen = signal(false);

  protected readonly navigationRoutes = signal<NavigationRoute[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin',
      icon: '📊',
      description: 'Panel de control principal'
    },
    {
      id: 'orders',
      label: 'Pedidos',
      path: '/admin/cart',
      icon: '🛒',
      description: 'Gestión de pedidos y ventas'
    },
    {
      id: 'categories',
      label: 'Categorías',
      path: '/admin/category',
      icon: '📂',
      description: 'Administrar categorías'
    },
    {
      id: 'products',
      label: 'Productos',
      path: '/admin/products',
      icon: '🛍️',
      description: 'Gestión de productos'
    },
    {
      id: 'users',
      label: 'Usuarios',
      path: '/admin/users',
      icon: '👥',
      description: 'Administrar usuarios'
    },
    {
      id: 'sales',
      label: 'Ventas',
      path: '/admin/sales',
      icon: '💰',
      description: 'Estadísticas de ventas'
    },
    {
      id: 'wishlist',
      label: 'Lista de Deseos',
      path: '/admin/wishlist',
      icon: '❤️',
      description: 'Estadísticas de wishlist'
    }
  ]);

  protected readonly activeRoute = computed(() => {
    return this.router.url;
  });

  protected toggleSidebar(): void {
    this.isSidebarOpen.update(value => !value);
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  protected navigateTo(path: string): void {
    this.router.navigate([path]);
    this.closeSidebar();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

