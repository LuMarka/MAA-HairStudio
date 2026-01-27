import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { OrderData } from '../../../core/models/interfaces/order.interface';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-order-detail',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class OrderDetail {
  orderId = input<string | null>(null);
  onBack = output<void>();

  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

  readonly order = signal<OrderData | null>(null);
  readonly isLoading = computed(() => this.orderService.isLoading());
  readonly errorMessage = computed(() => this.orderService.errorMessage());

  // ========== COMPUTED PARA CALCULAR TOTALES CORRECTOS ==========

  /**
   * Calcula el subtotal sin IVA basándose en los totalPrice de los items
   */
  readonly calculatedSubtotal = computed(() => {
    const orderData = this.order();
    if (!orderData?.items) return 0;

    // Usar totalPrice y dividir entre 1.21 para obtener precio sin IVA
    const total = orderData.items.reduce((sum, item) => {
      const totalPrice = parseFloat(item.totalPrice);
      // Dividir entre 1.21 para obtener precio sin IVA
      const priceWithoutTax = totalPrice / 1.21;
      return sum + priceWithoutTax;
    }, 0);

    return total;
  });

  /**
   * Calcula el IVA (21%) sobre el subtotal calculado
   */
  readonly calculatedTax = computed(() => {
    return this.calculatedSubtotal() * 0.21;
  });

  /**
   * Calcula el total con IVA usando el totalPrice de cada item
   */
  readonly calculatedTotal = computed(() => {
    const orderData = this.order();
    if (!orderData?.items) return 0;

    // Usar directamente el totalPrice de cada item (monto realmente abonado)
    const total = orderData.items.reduce((sum, item) => {
      const totalPrice = parseFloat(item.totalPrice);
      return sum + totalPrice;
    }, 0);

    // Agregar shipping cost si existe
    const shippingCost = parseFloat(orderData.shippingCost || '0');
    return total + shippingCost;
  });

  /**
   * Obtiene el costo de shipping
   */
  readonly shippingCost = computed(() => {
    const orderData = this.order();
    return parseFloat(orderData?.shippingCost || '0');
  });

  constructor() {

    effect(() => {
      const id = this.orderId();
      if (id) {
        this.loadOrderDetail(id);
      }
    });
  }

  private loadOrderDetail(id: string): void {

    this.orderService.getOrderById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.order.set(order);
        },
        error: (error) => {
          console.error('❌ Error cargando orden:', error);
        }
      });
  }

  goBack(): void {
    this.onBack.emit();
  }

  /* confirmOrder(): void {
    if (!this.order()) return;

    this.orderService.confirmOrder(this.order()!.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.order.set(response.data);
          console.log('✅ Orden confirmada');
        },
        error: (error) => {
          console.error('Error confirmando orden:', error);
        }
      });
  } */

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'processing': 'En Proceso',
      'shipped': 'Enviada',
      'delivered': 'Entregada',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }

  getDeliveryLabel(deliveryType: string): string {
    const labels: { [key: string]: string } = {
      'delivery': 'Envío a Domicilio',
      'pickup': 'Retiro en Local'
    };
    return labels[deliveryType] || deliveryType;
  }

  getPaymentStatusLabel(paymentStatus: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'refunded': 'Reembolsado'
    };
    return labels[paymentStatus] || paymentStatus;
  }
}
