import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: number;
  pendingOrders: number;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-admin-category-template',
  imports: [CommonModule],
  templateUrl: './admin-category-template.html',
  styleUrl: './admin-category-template.scss'
})
export class AdminCategoryTemplate {
// Dashboard statistics
  stats = signal<DashboardStats>({
    totalProducts: 156,
    totalOrders: 89,
    totalUsers: 234,
    totalRevenue: 125000,
    recentOrders: 12,
    pendingOrders: 5
  });

  // Quick actions for the dashboard
  quickActions = signal<QuickAction[]>([
    {
      id: 'manage-products',
      title: 'Gestión de Productos',
      description: 'Administrar catálogo de productos',
      icon: '🛍️',
      route: '/admin/products',
      color: 'primary'
    },
    {
      id: 'manage-orders',
      title: 'Gestionar Pedidos',
      description: 'Ver y administrar pedidos',
      icon: '📦',
      route: '/admin/sales',
      color: 'secondary'
    },
    {
      id: 'view-users',
      title: 'Ver Usuarios',
      description: 'Administrar usuarios registrados',
      icon: '👥',
      route: '/admin/users',
      color: 'success'
    },
    {
      id: 'analytics',
      title: 'Analíticas',
      description: 'Ver reportes y estadísticas',
      icon: '📊',
      route: '/admin/category',
      color: 'warning'
    }
  ]);

  // Loading states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Computed values
  revenueFormatted = computed(() => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(this.stats().totalRevenue);
  });

  pendingOrdersAlert = computed(() => {
    return this.stats().pendingOrders > 0;
  });

  constructor(private router: Router) {
    this.loadDashboardData();
  }

  // Navigation methods
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  onQuickAction(action: QuickAction): void {
    this.navigateTo(action.route);
  }

  // Data loading
  private async loadDashboardData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // TODO: Replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - replace with real API calls
      const mockStats: DashboardStats = {
        totalProducts: 156,
        totalOrders: 89,
        totalUsers: 234,
        totalRevenue: 125000,
        recentOrders: 12,
        pendingOrders: 5
      };

      this.stats.set(mockStats);
    } catch (error) {
      this.error.set('Error al cargar datos del dashboard');
      console.error('Dashboard data loading error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Refresh dashboard
  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
