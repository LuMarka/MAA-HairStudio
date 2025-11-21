import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cartOld.service';
import { inject } from '@angular/core';

interface CartItem {
  id: string;
  name: string;
  brand?: string;
  quantity: number;
  price: number;
}

interface OrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryOption: 'pickup' | 'delivery';
  address?: string;
  city?: string;
  postalCode?: string;
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

  readonly subtotal = computed(() => this.cartTotal());

  readonly shipping = computed(() => {
    const data = this.orderData();
    if (!data) return null;

    return data.deliveryOption === 'pickup' ? 0 : null; // null = "a convenir"
  });

  readonly shippingText = computed(() => {
    const data = this.orderData();
    if (!data) return 'A convenir';

    return data.deliveryOption === 'pickup' ? 'Retiro en tienda (gratis)' : 'A convenir';
  });

  readonly tax = computed(() => this.subtotal() * 0.21);

  readonly total = computed(() => {
    const shipping = this.shipping();
    const subtotal = this.subtotal();
    const tax = this.tax();

    if (shipping === null) {
      return subtotal + tax;
    }

    return subtotal + shipping + tax;
  });

  readonly estimatedDelivery = computed(() => {
    const data = this.orderData();
    if (!data) return '3-5 días hábiles';

    return data.deliveryOption === 'pickup'
      ? 'Disponible para retiro'
      : '3-5 días hábiles';
  });

  readonly deliveryOptionText = computed(() => {
    const data = this.orderData();
    if (!data) return 'No especificado';

    return data.deliveryOption === 'pickup'
      ? 'Retiro en tienda'
      : 'Envío a domicilio';
  });

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
    return !!(data && method && items.length > 0);
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
