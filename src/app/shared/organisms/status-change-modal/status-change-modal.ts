import { Component, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { OrderData, OrderStatus, PaymentStatus } from '../../../core/models/interfaces/order.interface';

export interface StatusChangeData {
  orderId: string;
  newStatus: OrderStatus;
  newPaymentStatus?: PaymentStatus;
  notes?: string;
}

@Component({
  selector: 'app-status-change-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './status-change-modal.html',
  styleUrls: ['./status-change-modal.scss']
})
export class StatusChangeModal {
  readonly isVisible = input<boolean>(false);
  readonly order = input<OrderData | null>(null);
  readonly loading = input<boolean>(false);

  readonly onClose = output<void>();
  readonly onSave = output<StatusChangeData>();

  protected selectedStatus = signal<OrderStatus>('pending');
  protected selectedPaymentStatus = signal<PaymentStatus>('pending');
  protected notes = signal<string>('');

  protected readonly isLoading = computed(() => this.loading());

  // Initialize form when order changes
  constructor() {
    effect(() => {
      const currentOrder = this.order();
      if (currentOrder) {
        this.selectedStatus.set(currentOrder.status);
        this.selectedPaymentStatus.set(currentOrder.paymentStatus);
        this.notes.set('');
      }
    });
  }

  protected readonly availableStatuses = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder) return [];

    const statusOptions = [
      { value: 'pending' as OrderStatus, label: 'Pendiente' },
      { value: 'confirmed' as OrderStatus, label: 'Confirmado' },
      { value: 'processing' as OrderStatus, label: 'Preparando' },
      { value: 'ready_pickup' as OrderStatus, label: 'Listo para recoger' },
      { value: 'shipped' as OrderStatus, label: 'Enviado' },
      { value: 'in_transit' as OrderStatus, label: 'En tránsito' },
      { value: 'delivered' as OrderStatus, label: 'Entregado' },
      { value: 'completed' as OrderStatus, label: 'Completado' },
      { value: 'cancelled' as OrderStatus, label: 'Cancelado' },
      { value: 'refunded' as OrderStatus, label: 'Reembolsado' }
    ];

    // Filter based on current status
    const currentStatus = currentOrder.status;

    return statusOptions.filter(option => {
      // Allow all transitions except backwards for completed states
      if (['cancelled', 'refunded', 'completed'].includes(currentStatus)) {
        return option.value === currentStatus;
      }
      return true;
    });
  });

  protected readonly availablePaymentStatuses = computed(() => [
    { value: 'pending' as PaymentStatus, label: 'Pendiente' },
    { value: 'payment_pending' as PaymentStatus, label: 'Pago pendiente' },
    { value: 'approved' as PaymentStatus, label: 'Aprobado' },
    { value: 'rejected' as PaymentStatus, label: 'Rechazado' },
    { value: 'refunded' as PaymentStatus, label: 'Reembolsado' },
    { value: 'cancelled' as PaymentStatus, label: 'Cancelado' }
  ]);

  protected readonly hasChanges = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder) return false;

    return (
      this.selectedStatus() !== currentOrder.status ||
      this.selectedPaymentStatus() !== currentOrder.paymentStatus ||
      this.notes().trim().length > 0
    );
  });

  protected formatCurrency(value: string): string {
    const num = parseFloat(value);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(num);
  }

  protected closeModal(): void {
    this.onClose.emit();
  }

  protected saveChanges(): void {
    const currentOrder = this.order();
    if (!currentOrder || !this.hasChanges()) return;

    const changeData: StatusChangeData = {
      orderId: currentOrder.id,
      newStatus: this.selectedStatus(),
      newPaymentStatus: this.selectedPaymentStatus(),
      notes: this.notes().trim() || undefined
    };

    this.onSave.emit(changeData);
  }
}
