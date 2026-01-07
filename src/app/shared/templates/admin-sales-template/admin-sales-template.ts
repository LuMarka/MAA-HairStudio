import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsCard, type StatsCardData } from '../../molecules/stats-card/stats-card';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import type { OrderStatisticsResponse } from '../../../core/models/interfaces/order.interface';
import type { AbandonedCartsResponse, AbandonedCart } from '../../../core/models/interfaces/cart.interface';

@Component({
  selector: 'app-admin-sales-template',
  standalone: true,
  imports: [CommonModule, StatsCard],
  templateUrl: './admin-sales-template.html',
  styleUrl: './admin-sales-template.scss'
})
export class AdminSalesTemplate implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);

  // State signals
  protected readonly isLoadingStats = signal(false);
  protected readonly isLoadingAbandoned = signal(false);
  protected readonly statistics = signal<OrderStatisticsResponse | null>(null);
  protected readonly abandonedCarts = signal<readonly AbandonedCart[]>([]);
  protected readonly abandonedCount = signal(0);

  // Computed stats for sales
  protected readonly salesCards = computed((): StatsCardData[] => {
    const stats = this.statistics();

    if (!stats || !stats.data) {
      return [
        {
          title: 'Ingresos Totales',
          value: '$0,00',
          subtitle: 'Ingresos generados',
          icon: '💰',
          color: 'primary',
          loading: this.isLoadingStats()
        },
        {
          title: 'Total Pedidos',
          value: 0,
          subtitle: 'Todos los pedidos',
          icon: '📊',
          color: 'info',
          loading: this.isLoadingStats()
        },
        {
          title: 'Pedidos Completados',
          value: 0,
          subtitle: 'Finalizados exitosamente',
          icon: '✅',
          color: 'success',
          loading: this.isLoadingStats()
        },
        {
          title: 'Ticket Promedio',
          value: '$0,00',
          subtitle: 'Monto promedio por pedido',
          icon: '📈',
          color: 'info',
          loading: this.isLoadingStats()
        }
      ];
    }

    const statData = stats.data;
    const totalRevenue = statData.revenue?.total ?? 0;
    const totalOrders = statData.totalOrders || 0;
    const ordersByStatus = statData.ordersByStatus || {};
    const completedCount = ordersByStatus['confirmed'] ?? 0;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return [
      {
        title: 'Ingresos Totales',
        value: this.formatCurrency(totalRevenue),
        subtitle: 'Ingresos generados',
        icon: '💰',
        color: 'primary',
        loading: this.isLoadingStats()
      },
      {
        title: 'Total Pedidos',
        value: totalOrders,
        subtitle: 'Todos los pedidos',
        icon: '📊',
        color: 'info',
        loading: this.isLoadingStats()
      },
      {
        title: 'Pedidos Completados',
        value: completedCount,
        subtitle: 'Finalizados exitosamente',
        icon: '✅',
        color: 'success',
        loading: this.isLoadingStats()
      },
      {
        title: 'Ticket Promedio',
        value: this.formatCurrency(averageTicket),
        subtitle: 'Monto promedio por pedido',
        icon: '📈',
        color: 'info',
        loading: this.isLoadingStats()
      }
    ];
  });

  ngOnInit(): void {
    this.loadStatistics();
    this.loadAbandonedCarts();
  }

  private loadStatistics(): void {
    this.isLoadingStats.set(true);

    try {
      this.orderService.getOrderStatistics().subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.statistics.set(response);
          }
        },
        error: (error: any) => {
          console.error('Error loading sales statistics:', error);
        },
        complete: () => {
          this.isLoadingStats.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading sales statistics:', error);
      this.isLoadingStats.set(false);
    }
  }

  private loadAbandonedCarts(): void {
    this.isLoadingAbandoned.set(true);

    try {
      this.cartService.getAbandonedCarts(24, { page: 1, limit: 10 }).subscribe({
        next: (response: AbandonedCartsResponse) => {
          if (response.success && response.data) {
            this.abandonedCarts.set(response.data);
            this.abandonedCount.set(response.meta.total);
          } else {
            this.abandonedCarts.set([]);
            this.abandonedCount.set(0);
          }
        },
        error: (error: any) => {
          console.error('Error loading abandoned carts:', error);
          this.abandonedCarts.set([]);
          this.abandonedCount.set(0);
        },
        complete: () => {
          this.isLoadingAbandoned.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading abandoned carts:', error);
      this.isLoadingAbandoned.set(false);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }
}
