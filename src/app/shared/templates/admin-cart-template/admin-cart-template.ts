import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsCard, type StatsCardData } from '../../molecules/stats-card/stats-card';
import { OrdersTable, type OrderTableColumn } from '../../organisms/orders-table/orders-table';
import { StatusChangeModal, type StatusChangeData } from '../../organisms/status-change-modal/status-change-modal';
import { OrderService } from '../../../core/services/order.service';
import type { OrderData, OrderStatisticsResponse } from '../../../core/models/interfaces/order.interface';

@Component({
  selector: 'app-admin-cart-template',
  imports: [CommonModule, StatsCard, OrdersTable, StatusChangeModal],
  templateUrl: './admin-cart-template.html',
  styleUrl: './admin-cart-template.scss'
})
export class AdminCartTemplate implements OnInit {
  private readonly orderService = inject(OrderService);

  // State signals
  protected readonly isLoadingOrders = signal(false);
  protected readonly isLoadingStats = signal(false);
  protected readonly orders = signal<OrderData[]>([]);
  protected readonly statistics = signal<OrderStatisticsResponse | null>(null);
  protected readonly selectedOrder = signal<OrderData | null>(null);
  protected readonly showStatusModal = signal(false);
  protected readonly isUpdatingStatus = signal(false);

  // Computed stats
  protected readonly statsCards = computed((): StatsCardData[] => {
    const stats = this.statistics();

    if (!stats || !stats.data) {
      return [
        {
          title: 'Total Pedidos',
          value: 0,
          subtitle: 'Todos los pedidos',
          icon: '📦',
          color: 'info',
          loading: this.isLoadingStats()
        },
        {
          title: 'Pedidos Pendientes',
          value: 0,
          subtitle: 'Requieren atención',
          icon: '⏳',
          color: 'warning',
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
          title: 'Ingresos Totales',
          value: '$0,00',
          subtitle: 'Pedidos completados',
          icon: '💰',
          color: 'primary',
          loading: this.isLoadingStats()
        }
      ];
    }

    const statData = stats.data;
    const totalRevenue = statData.revenue?.total ?? 0;
    const pendingCount = statData.ordersByStatus?.['pending'] ?? 0;
    const completedCount = statData.ordersByStatus?.['completed'] ?? 0;

    return [
      {
        title: 'Total Pedidos',
        value: statData.totalOrders || 0,
        subtitle: 'Todos los pedidos',
        icon: '📦',
        color: 'info',
        loading: this.isLoadingStats()
      },
      {
        title: 'Pedidos Pendientes',
        value: pendingCount,
        subtitle: 'Requieren atención',
        icon: '⏳',
        color: 'warning',
        loading: this.isLoadingStats(),
        trend: pendingCount > 0
          ? { value: 5, direction: 'up' as const, label: 'vs mes anterior' }
          : undefined
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
        title: 'Ingresos Totales',
        value: `$${totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        subtitle: 'Pedidos completados',
        icon: '💰',
        color: 'primary',
        loading: this.isLoadingStats(),
        trend: { value: 12, direction: 'up' as const, label: 'vs mes anterior' }
      }
    ];
  });

  // Table configuration
  protected readonly orderColumns: OrderTableColumn[] = [
    {
      key: 'orderNumber',
      label: 'N° Pedido',
      sortable: true,
      width: '120px'
    },
    {
      key: 'user',
      label: 'Cliente',
      type: 'text',
      width: '150px'
    },
    {
      key: 'total',
      label: 'Total',
      type: 'currency',
      sortable: true,
      width: '100px'
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'status',
      width: '120px'
    },
    {
      key: 'paymentStatus',
      label: 'Pago',
      type: 'status',
      width: '120px'
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      type: 'date',
      sortable: true,
      width: '140px'
    },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'actions',
      width: '100px'
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  protected async loadData(): Promise<void> {
    await Promise.all([
      this.loadOrders(),
      this.loadStatistics()
    ]);
  }

  protected async loadOrders(): Promise<void> {
    this.isLoadingOrders.set(true);

    try {
      // Get all orders with pagination
      this.orderService.getAllOrders({ page: 1, limit: 50 }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.orders.set(response.data);
          }
        },
        error: (error) => {
          console.error('Error loading orders:', error);
        },
        complete: () => {
          this.isLoadingOrders.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading orders:', error);
      this.isLoadingOrders.set(false);
    }
  }

  protected async loadStatistics(): Promise<void> {
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

  protected onViewOrder(order: OrderData): void {
    this.selectedOrder.set(order);
    // Show details modal or navigate to details page
    // For now, we'll just log it and you can implement a detail modal
    console.log('Viewing order details:', order);
    // TODO: Implement order details modal component
  }

  protected onChangeStatus(order: OrderData): void {
    this.selectedOrder.set(order);
    this.showStatusModal.set(true);
  }

  protected onCloseStatusModal(): void {
    this.showStatusModal.set(false);
    this.selectedOrder.set(null);
  }

  protected onSaveStatusChange(changeData: StatusChangeData): void {
    this.isUpdatingStatus.set(true);

    this.orderService.updateOrderStatus(changeData.orderId, {
      status: changeData.newStatus,
      paymentStatus: changeData.newPaymentStatus,
      notes: changeData.notes
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the order in our local state
          this.orders.update(orders =>
            orders.map(order =>
              order.id === changeData.orderId
                ? { ...order, status: changeData.newStatus, paymentStatus: changeData.newPaymentStatus || order.paymentStatus }
                : order
            )
          );
          this.onCloseStatusModal();
        }
      },
      error: (error) => {
        console.error('Error updating order status:', error);
      },
      complete: () => {
        this.isUpdatingStatus.set(false);
      }
    });
  }

  protected onSortOrders(sortData: {key: string, direction: 'asc' | 'desc'}): void {
    const currentOrders = this.orders();
    const sortedOrders = [...currentOrders].sort((a, b) => {
      const aValue = (a as any)[sortData.key];
      const bValue = (b as any)[sortData.key];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date) {
        comparison = aValue.getTime() - (bValue as Date).getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortData.direction === 'asc' ? comparison : -comparison;
    });

    this.orders.set(sortedOrders);
  }
}
