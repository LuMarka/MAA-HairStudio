import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsCard, type StatsCardData } from '../../shared/molecules/stats-card/stats-card';
import { OrderService } from '../../core/services/order.service';
import type { OrderStatisticsResponse } from '../../core/models/interfaces/order.interface';

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

  // Computed stats
  protected readonly statsCards = computed((): StatsCardData[] => {
    const stats = this.statistics();

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
    const pendingCount = ordersByStatus['pending'] ?? 0;
    const completedCount = ordersByStatus['confirmed'] ?? 0;

    // Map de estatuses adicionales que queremos mostrar
    const additionalStatuses: Record<string, { title: string; icon: string; color: 'primary' | 'info' | 'success' | 'warning' | 'secondary'; subtitle: string }> = {
      'delivered': {
        title: 'Entregados',
        icon: '✅',
        color: 'success',
        subtitle: 'Entregados exitosamente'
      },
      'paid': {
        title: 'Pagados',
        icon: '💳',
        color: 'success',
        subtitle: 'Pagados exitosamente'
      }
    };

    // Construir array de cards base
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
        title: 'Pendiente',
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
      }
    ];

    // Agregar cards adicionales solo si tienen datos
    Object.entries(additionalStatuses).forEach(([status, config]) => {
      const count = ordersByStatus[status] ?? 0;
      if (count > 0) {
        cards.push({
          title: config.title,
          value: count,
          subtitle: config.subtitle,
          icon: config.icon,
          color: config.color,
          loading: this.isLoadingStats()
        });
      }
    });

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
      this.orderService.getOrderStatistics().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.statistics.set(response);
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
