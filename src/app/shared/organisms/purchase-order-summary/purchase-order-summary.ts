import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { inject } from '@angular/core';

interface OrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
  paymentMethod: 'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card';
}

@Component({
  selector: 'app-purchase-order-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './purchase-order-summary.html',
  styleUrl: './purchase-order-summary.scss'
})
export class PurchaseOrderSummary {
  // Inputs
  readonly currentStep = input<number>(1);
  readonly orderData = input<OrderData | null>(null);
  readonly paymentMethod = input<OrderData['paymentMethod'] | null>(null);

  // Outputs
  readonly editCart = output<void>();
  readonly previousStep = output<void>();
  readonly finalizeOrder = output<void>();

  // Services
  private readonly cartService = inject(CartService);

  // Computed signals
  readonly cartItems = computed(() => this.cartService.items());
  readonly cartTotal = computed(() => this.cartService.total());

  // Additional computed properties for the summary
  readonly subtotal = computed(() => this.cartTotal());
  readonly shipping = computed(() => {
    const subtotal = this.subtotal();
    return subtotal > 100 ? 0 : 15.99; // Free shipping over $100
  });
  readonly tax = computed(() => this.subtotal() * 0.16); // 16% tax
  readonly total = computed(() => this.subtotal() + this.shipping() + this.tax());
  readonly estimatedDelivery = computed(() => '3-5 días hábiles');

  readonly paymentMethodText = computed(() => {
    const method = this.paymentMethod();
    if (!method) return 'No seleccionado';

    const paymentMethods: Record<OrderData['paymentMethod'], string> = {
      'mercadopago-card': 'Tarjeta de Crédito/Débito (Mercado Pago)',
      'mercadopago': 'Mercado Pago',
      'transfer': 'Transferencia Bancaria',
      'cash': 'Efectivo en la entrega'
    };

    return paymentMethods[method] || 'No especificado';
  });

  readonly isOrderValid = computed(() => {
    const data = this.orderData();
    const method = this.paymentMethod();
    const items = this.cartItems();
    return data && method && items.length > 0;
  });

  onEditCart(): void {
    this.editCart.emit();
  }

  onPreviousStep(): void {
    this.previousStep.emit();
  }

  onFinalizeOrder(): void {
    this.finalizeOrder.emit();
  }
}
