import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

type PaymentMethod = 'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card';

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
  paymentMethod: PaymentMethod;
}

interface CartItem {
  id: string;
  name: string;
  brand?: string;
  quantity: number;
  price: number;
}

/**
 * Organismo para la confirmación final del pedido (Paso 3)
 * 
 * @responsibility Mostrar resumen del pedido y gestionar la finalización/éxito
 * @input orderData - Datos completos del pedido
 * @input selectedPaymentMethod - Método de pago seleccionado
 * @input selectedDeliveryOption - Tipo de entrega ('pickup' | 'delivery')
 * @input cartItems - Items del carrito
 * @input subtotal - Subtotal sin IVA
 * @input ivaAmount - Monto del IVA (21%)
 * @input totalWithIva - Total final con IVA
 * @input orderSent - Estado de envío exitoso
 * @input isProcessing - Estado de procesamiento
 * @output editCart - Emite cuando se presiona editar carrito
 * @output previousStep - Emite cuando se presiona volver
 * @output finalizeOrder - Emite cuando se presiona finalizar pedido
 * @output backToHome - Emite cuando se presiona volver al inicio (después de éxito)
 */
@Component({
  selector: 'app-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss'
})
export class Confirmation {
  // ========== INPUTS ==========
  readonly orderData = input<OrderData | null>(null);
  readonly selectedPaymentMethod = input<PaymentMethod | null>(null);
  readonly selectedDeliveryOption = input.required<'pickup' | 'delivery'>();
  
  readonly cartItems = input<CartItem[]>([]);
  readonly subtotal = input.required<number>();
  readonly ivaAmount = input.required<number>();
  readonly totalWithIva = input.required<number>();
  
  readonly orderSent = input(false);
  readonly isProcessing = input(false);

  // ========== OUTPUTS ==========
  readonly editCart = output<void>();
  readonly previousStep = output<void>();
  readonly finalizeOrder = output<void>();
  readonly backToHome = output<void>();

  // ========== SIGNALS ==========
  private readonly redirectCountdown = signal(60);

  // ========== COMPUTED ==========
  readonly selectedPaymentMethodText = computed(() => {
    const method = this.selectedPaymentMethod();
    if (!method) return '';
    return this.getPaymentMethodText(method);
  });

  readonly deliveryOptionText = computed(() => {
    return this.selectedDeliveryOption() === 'pickup' 
      ? 'Retiro en tienda' 
      : 'Envío a domicilio';
  });

  readonly hasValidOrder = computed(() => {
    const data = this.orderData();
    const paymentMethod = this.selectedPaymentMethod();
    const items = this.cartItems();
    return data !== null && paymentMethod !== null && items.length > 0;
  });

  readonly canFinalize = computed(() => {
    return this.hasValidOrder() && !this.isProcessing();
  });

  readonly redirectSeconds = computed(() => {
    return Math.floor(this.redirectCountdown() / 1);
  });

  // ========== CONSTRUCTOR ==========
  constructor() {
    // Effect para iniciar countdown después de envío exitoso
    effect(() => {
      if (this.orderSent()) {
        this.startRedirectCountdown();
      }
    });
  }

  // ========== MÉTODOS PRIVADOS ==========
  private startRedirectCountdown(): void {
    const interval = setInterval(() => {
      const current = this.redirectCountdown();
      
      if (current <= 1) {
        clearInterval(interval);
        this.backToHome.emit();
        return;
      }
      
      this.redirectCountdown.set(current - 1);
    }, 1000);
  }

  private getPaymentMethodText(method: PaymentMethod): string {
    const paymentMethods: Record<PaymentMethod, string> = {
      'mercadopago-card': 'Tarjeta de Crédito/Débito (Mercado Pago)',
      'mercadopago': 'Mercado Pago',
      'transfer': 'Transferencia Bancaria',
      'cash': 'Efectivo en la entrega'
    };
    return paymentMethods[method] || 'No especificado';
  }

  // ========== MÉTODOS PÚBLICOS - EVENTOS ==========
  onEditCart(): void {
    this.editCart.emit();
  }

  onPreviousStep(): void {
    this.previousStep.emit();
  }

  onFinalizeOrder(): void {
    if (!this.canFinalize()) {
      return;
    }
    this.finalizeOrder.emit();
  }

  onBackToHome(): void {
    this.backToHome.emit();
  }

  // ========== HELPERS PARA TEMPLATE ==========
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(price);
  }

  getItemTotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  getPaymentMethodIcon(method: PaymentMethod): string {
    const icons: Record<PaymentMethod, string> = {
      'cash': '💵',
      'transfer': '🏦',
      'mercadopago': '💳',
      'mercadopago-card': '💳'
    };
    return icons[method] || '💳';
  }
}
