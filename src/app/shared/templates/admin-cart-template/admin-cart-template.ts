import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsCard, type StatsCardData } from '../../molecules/stats-card/stats-card';
import { OrdersTable, type OrderTableColumn } from '../../organisms/orders-table/orders-table';
import { StatusChangeModal, type StatusChangeData } from '../../organisms/status-change-modal/status-change-modal';
import { OrderService } from '../../../core/services/order.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import type { OrderData } from '../../../core/models/interfaces/order.interface';

@Component({
  selector: 'app-admin-cart-template',
  imports: [CommonModule, StatsCard, OrdersTable, StatusChangeModal],
  templateUrl: './admin-cart-template.html',
  styleUrl: './admin-cart-template.scss'
})
export class AdminCartTemplate implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly wishlistService = inject(WishlistService);

  // State signals
  protected readonly isLoadingOrders = signal(false);
  protected readonly isLoadingStats = signal(false);
  protected readonly orders = signal<OrderData[]>([]);
  protected readonly selectedOrder = signal<OrderData | null>(null);
  protected readonly showStatusModal = signal(false);
  protected readonly isUpdatingStatus = signal(false);

  // Computed stats
  protected readonly statsCards = computed((): StatsCardData[] => {
    const ordersList = this.orders();

    const totalOrders = ordersList.length;
    const pendingOrders = ordersList.filter(o => o.status === 'pending').length;
    const completedOrders = ordersList.filter(o => o.status === 'completed').length;
    const totalRevenue = ordersList
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + parseFloat(o.total), 0);

    return [
      {
        title: 'Total Pedidos',
        value: totalOrders,
        subtitle: 'Todos los pedidos',
        icon: '📦',
        color: 'info',
        loading: this.isLoadingStats()
      },
      {
        title: 'Pedidos Pendientes',
        value: pendingOrders,
        subtitle: 'Requieren atención',
        icon: '⏳',
        color: 'warning',
        loading: this.isLoadingStats(),
        trend: pendingOrders > 0 ? { value: 5, direction: 'up', label: 'vs mes anterior' } : undefined
      },
      {
        title: 'Pedidos Completados',
        value: completedOrders,
        subtitle: 'Finalizados exitosamente',
        icon: '✅',
        color: 'success',
        loading: this.isLoadingStats()
      },
      {
        title: 'Ingresos Totales',
        value: `$${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        subtitle: 'Pedidos completados',
        icon: '💰',
        color: 'primary',
        loading: this.isLoadingStats(),
        trend: { value: 12, direction: 'up', label: 'vs mes anterior' }
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
      this.loadWishlistStats()
    ]);
  }

  protected async loadOrders(): Promise<void> {
    this.isLoadingOrders.set(true);
    this.isLoadingStats.set(true);

    try {
      // Get all orders (you may want to add pagination later)
      this.orderService.getAllOrders().subscribe({
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
          this.isLoadingStats.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading orders:', error);
      this.isLoadingOrders.set(false);
      this.isLoadingStats.set(false);
    }
  }

  protected async loadWishlistStats(): Promise<void> {
    try {
      this.wishlistService.getAnalytics().subscribe({
        next: (response) => {
          console.log('Wishlist analytics:', response);
          // Handle wishlist analytics here when available
        },
        error: (error) => {
          console.error('Error loading wishlist stats:', error);
        }
      });
    } catch (error) {
      console.error('Error loading wishlist stats:', error);
    }
  }

  protected onViewOrder(order: OrderData): void {
    console.log('View order:', order);
    // Implement order detail view
    // You could navigate to a detail page or show a detail modal
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
    // Implement sorting logic
    console.log('Sort orders:', sortData);
  }
}
