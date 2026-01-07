import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { OrderData } from '../../../core/models/interfaces/order.interface';

@Component({
  selector: 'app-order-details-modal',
  imports: [CommonModule],
  templateUrl: './order-details-modal.html',
  styleUrls: ['./order-details-modal.scss']
})
export class OrderDetailsModal {
  readonly isVisible = input<boolean>(false);
  readonly order = input<OrderData | null>(null);

  readonly onClose = output<void>();
  readonly onChangeStatus = output<OrderData>();

  protected readonly orderDetails = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder) return null;

    return {
      orderNumber: currentOrder.orderNumber,
      customer: currentOrder.user?.name || currentOrder.user?.email || 'N/A',
      deliveryType: this.getDeliveryTypeLabel(currentOrder.deliveryType),
      status: this.getStatusLabel(currentOrder.status),
      paymentStatus: this.getStatusLabel(currentOrder.paymentStatus),
      subtotal: this.formatCurrency(currentOrder.subtotal),
      shippingCost: this.formatCurrency(currentOrder.shippingCost),
      tax: this.formatCurrency(currentOrder.tax),
      total: this.formatCurrency(currentOrder.total),
      items: currentOrder.items,
      address: currentOrder.shippingAddress,
      notes: currentOrder.notes || 'Sin notas',
      createdAt: this.formatDate(currentOrder.createdAt)
    };
  });

  protected closeModal(): void {
    this.onClose.emit();
  }

  protected changeStatus(): void {
    const currentOrder = this.order();
    if (currentOrder) {
      this.onChangeStatus.emit(currentOrder);
    }
  }

  protected formatCurrency(value: string): string {
    if (!value) return '-';
    const num = parseFloat(value);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(num);
  }

  protected formatDate(value: Date | string): string {
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

  protected getDeliveryTypeLabel(deliveryType: string): string {
    const labels: Record<string, string> = {
      'pickup': 'Retiro en tienda',
      'delivery': 'Envío a domicilio'
    };
    return labels[deliveryType] || deliveryType;
  }

  protected getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Completado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado',
      'approved': 'Aprobado',
      'rejected': 'Rechazado'
    };
    return statusLabels[status] || status;
  }
}