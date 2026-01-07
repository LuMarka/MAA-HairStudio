import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersTable, type OrderTableColumn } from '../../organisms/orders-table/orders-table';
import { StatusChangeModal, type StatusChangeData } from '../../organisms/status-change-modal/status-change-modal';
import { OrderDetailsModal } from '../../organisms/order-details-modal/order-details-modal';
import { OrderService } from '../../../core/services/order.service';
import type { OrderData } from '../../../core/models/interfaces/order.interface';

@Component({
  selector: 'app-admin-orders-template',
  standalone: true,
  imports: [CommonModule, OrdersTable, StatusChangeModal, OrderDetailsModal],
  templateUrl: './admin-orders-template.html',
  styleUrl: './admin-orders-template.scss'
})
export class AdminOrdersTemplate implements OnInit {
  private readonly orderService = inject(OrderService);

  // State signals
  protected readonly isLoadingOrders = signal(false);
  protected readonly orders = signal<OrderData[]>([]);
  protected readonly selectedOrder = signal<OrderData | null>(null);
  protected readonly showStatusModal = signal(false);
  protected readonly isUpdatingStatus = signal(false);
  
  // Signals for details modal
  protected readonly selectedOrderForDetails = signal<OrderData | null>(null);
  protected readonly showDetailsModal = signal(false);

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
      width: '150px'
    },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'actions',
      width: '80px'
    }
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.isLoadingOrders.set(true);

    try {
      this.orderService.getAllOrders({ page: 1, limit: 50 }).subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.orders.set(response.data);
          }
        },
        error: (error: any) => {
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
      next: (response: any) => {
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
      error: (error: any) => {
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

  // Methods for details modal
  protected onRowClick(order: OrderData): void {
    this.selectedOrderForDetails.set(order);
    this.showDetailsModal.set(true);
  }

  protected onCloseDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedOrderForDetails.set(null);
  }

  protected onChangeStatusFromDetails(order: OrderData): void {
    // Close details modal and open status change modal
    this.onCloseDetailsModal();
    this.onChangeStatus(order);
  }
}
