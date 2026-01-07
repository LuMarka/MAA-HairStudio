import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { StatsCard, type StatsCardData } from '../../shared/molecules/stats-card/stats-card';
import { OrderService } from '../../core/services/order.service';
import type { OrderStatisticsResponse, OrderListResponse, OrderData } from '../../core/models/interfaces/order.interface';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatsCard],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  private readonly orderService = inject(OrderService);

  // State signals
  protected readonly isLoadingStats = signal(false);
  protected readonly statistics = signal<OrderStatisticsResponse | null>(null);
  protected readonly allOrders = signal<OrderData[]>([]);

  // Computed stats
  protected readonly statsCards = computed((): StatsCardData[] => {
    const stats = this.statistics();
    const orders = this.allOrders();

    if (!stats || !stats.data) {
      return [
        {
          title: 'Total Pedidos',
          value: 0,
          subtitle: 'Todos los pedidos',
          icon: '📊',
          color: 'info',
          loading: this.isLoadingStats()
        },
        {
          title: 'Pendiente',
          value: 0,
          subtitle: 'Requieren atención',
          icon: '⏳',
          color: 'warning',
          loading: this.isLoadingStats()
        },
        {
          title: 'Completados',
          value: 0,
          subtitle: 'Finalizados exitosamente',
          icon: '✅',
          color: 'success',
          loading: this.isLoadingStats()
        },
        {
          title: 'Entregados',
          value: 0,
          subtitle: 'Entregados exitosamente',
          icon: '🚚',
          color: 'success',
          loading: this.isLoadingStats()
        },
        {
          title: 'Pagados',
          value: 0,
          subtitle: 'Pagos aprobados',
          icon: '💳',
          color: 'success',
          loading: this.isLoadingStats()
        },
        {
          title: 'Ingresos Totales',
          value: '$0,00',
          subtitle: 'Ingresos generados',
          icon: '💰',
          color: 'primary',
          loading: this.isLoadingStats()
        }
      ];
    }

    const statData = stats.data;
    const totalRevenue = statData.revenue?.total ?? 0;
    const ordersByStatus = statData.ordersByStatus || {};

    // Calcular estadísticas de payment status desde las órdenes
    const paymentStats = orders.reduce((acc, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pendingCount = ordersByStatus['pending'] ?? 0;
    const completedCount = ordersByStatus['confirmed'] ?? 0;
    const deliveredCount = ordersByStatus['delivered'] ?? 0;
    const paidCount = paymentStats['approved'] ?? 0;

    // Construir array de cards
    const cards: StatsCardData[] = [
      {
        title: 'Total Pedidos',
        value: statData.totalOrders || 0,
        subtitle: 'Todos los pedidos',
        icon: '📊',
        color: 'info',
        loading: this.isLoadingStats()
      },
      {
        title: 'Pendientes',
        value: pendingCount,
        subtitle: 'Requieren atención',
        icon: '⏳',
        color: 'warning',
        loading: this.isLoadingStats()
      },
      {
        title: 'Completados',
        value: completedCount,
        subtitle: 'Finalizados exitosamente',
        icon: '✅',
        color: 'success',
        loading: this.isLoadingStats()
      },
      {
        title: 'Entregados',
        value: deliveredCount,
        subtitle: 'Entregados exitosamente',
        icon: '🚚',
        color: 'success',
        loading: this.isLoadingStats()
      },
      {
        title: 'Pagados',
        value: paidCount,
        subtitle: 'Pagos aprobados',
        icon: '💳',
        color: 'success',
        loading: this.isLoadingStats()
      }
    ];

    // Card de Ingresos Totales al final
    cards.push({
      title: 'Ingresos Totales',
      value: `$${totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      subtitle: 'Ingresos generados',
      icon: '💰',
      color: 'primary',
      loading: this.isLoadingStats()
    });

    return cards;
  });

  ngOnInit(): void {
    this.loadStatistics();
  }

  private loadStatistics(): void {
    this.isLoadingStats.set(true);

    try {
      // Cargar tanto estadísticas como todas las órdenes para calcular payment status
      forkJoin({
        statistics: this.orderService.getOrderStatistics(),
        orders: this.orderService.getAllOrders({ limit: 1000 }) // Obtener todas las órdenes
      }).subscribe({
        next: ({ statistics, orders }) => {
          if (statistics.success && statistics.data) {
            this.statistics.set(statistics);
          }
          if (orders.success && orders.data) {
            this.allOrders.set(orders.data);
          }
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        },
        complete: () => {
          this.isLoadingStats.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.isLoadingStats.set(false);
    }
  }
}
