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
      { value: 'confirmed' as OrderStatus, label: 'Completado' },
      { value: 'delivered' as OrderStatus, label: 'Entregado' },
      { value: 'cancelled' as OrderStatus, label: 'Cancelado' }
    ];

    const currentStatus = currentOrder.status;

    // Permitir transiciones más flexibles para corregir errores
    switch (currentStatus) {
      case 'pending':
        // Desde pendiente puede ir a cualquier estado
        return statusOptions;

      case 'confirmed':
        // Desde confirmado puede ir a entregado o volver a pendiente (para corregir errores)
        return statusOptions.filter(option =>
          ['pending', 'confirmed', 'delivered', 'cancelled'].includes(option.value)
        );

      case 'delivered':
        // Desde entregado puede volver a confirmado (para corregir errores)
        return statusOptions.filter(option =>
          ['confirmed', 'delivered','pending', 'cancelled'].includes(option.value)
        );

      case 'cancelled':
        // Desde cancelado puede volver a pendiente o confirmado (para reactivar)
        return statusOptions.filter(option =>
          ['pending', 'confirmed', 'delivered', 'confirmed'].includes(option.value)
        );

      default:
        return statusOptions;
    }
  });

  protected readonly availablePaymentStatuses = computed(() => [
    { value: 'pending' as PaymentStatus, label: 'Pendiente' },
    { value: 'approved' as PaymentStatus, label: 'Aprobado' },
    { value: 'rejected' as PaymentStatus, label: 'Rechazado' }
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
    const numWithoutTax = num / 1.21; // Dividir por 1.21 para obtener el valor sin IVA
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(numWithoutTax);
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
