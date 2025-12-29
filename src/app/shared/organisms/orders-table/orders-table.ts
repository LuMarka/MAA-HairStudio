import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { OrderData, OrderStatus, PaymentStatus } from '../../../core/models/interfaces/order.interface';

export interface OrderTableColumn {
  key: keyof OrderData | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'date' | 'currency' | 'status' | 'badge' | 'actions';
}

@Component({
  selector: 'app-orders-table',
  imports: [CommonModule],
  template: 'orders-table.html',
  styleUrls: ['./orders-table.scss']
})
export class OrdersTable {
  readonly orders = input.required<OrderData[]>();
  readonly columns = input.required<OrderTableColumn[]>();
  readonly loading = input<boolean>(false);

  readonly onViewOrder = output<OrderData>();
  readonly onChangeStatus = output<OrderData>();
  readonly onSort = output<{key: string, direction: 'asc' | 'desc'}>();

  protected readonly skeletonRows = Array(5).fill(null);

  protected getCellValue(order: OrderData, key: string): any {
    if (key === 'actions') return '';
    if (key === 'user') return order.user?.name || order.user?.email || 'N/A';
    return (order as any)[key];
  }

  protected formatDate(value: any): string {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected formatCurrency(value: any): string {
    if (!value) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  }

  protected getStatusClass(status: OrderStatus | PaymentStatus): string {
    const statusMap: Record<string, string> = {
      'pending': 'warning',
      'confirmed': 'info',
      'processing': 'info',
      'ready_pickup': 'success',
      'shipped': 'info',
      'in_transit': 'info',
      'delivered': 'success',
      'completed': 'success',
      'cancelled': 'error',
      'refunded': 'error',
      'payment_pending': 'warning',
      'approved': 'success',
      'rejected': 'error'
    };
    return statusMap[status] || 'default';
  }

  protected getStatusLabel(status: OrderStatus | PaymentStatus): string {
    const statusLabels: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'processing': 'Preparando',
      'ready_pickup': 'Listo para recoger',
      'shipped': 'Enviado',
      'in_transit': 'En tránsito',
      'delivered': 'Entregado',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado',
      'payment_pending': 'Pago pendiente',
      'approved': 'Aprobado',
      'rejected': 'Rechazado'
    };
    return statusLabels[status] || status;
  }

  protected getBadgeClass(value: any): string {
    // Logic for badge classes if needed
    return 'default';
  }

  protected canChangeStatus(order: OrderData): boolean {
    return !['completed', 'cancelled', 'refunded'].includes(order.status);
  }

  protected handleSort(key: string): void {
    // Toggle sort direction logic would go here
    this.onSort.emit({key, direction: 'asc'}); // Simplified for now
  }
}
