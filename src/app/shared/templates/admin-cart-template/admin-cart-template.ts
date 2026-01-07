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
      sortable: true,
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
      sortable: true,
      width: '120px'
    },
    {
      key: 'paymentStatus',
      label: 'Pago',
      type: 'status',
      sortable: true,
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
      let aValue: any;
      let bValue: any;

      // Extract value based on key
      if (sortData.key === 'user') {
        aValue = a.user?.name || a.user?.email || '';
        bValue = b.user?.name || b.user?.email || '';
      } else {
        aValue = (a as any)[sortData.key];
        bValue = (b as any)[sortData.key];
      }

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
