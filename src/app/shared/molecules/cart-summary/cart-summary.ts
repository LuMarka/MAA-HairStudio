import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

type PaymentMethod = 'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card';

interface CartItem {
  id: string;
  name: string;
  brand?: string;
  quantity: number;
  price: number;
}

/**
 * Componente de resumen del carrito
 * 
 * @responsibility Mostrar resumen de productos, totales y método de pago seleccionado
 * @reusable Usado en confirmación de pedido y checkout
 * 
 * @example
 * ```html
 * <app-cart-summary
 *   [cartItems]="items()"
 *   [subtotal]="subtotal()"
 *   [ivaAmount]="ivaAmount()"
 *   [totalWithIva]="totalWithIva()"
 *   [selectedDeliveryOption]="deliveryOption()"
 *   [selectedPaymentMethod]="paymentMethod()"
 * />
 * ```
 */
@Component({
  selector: 'app-cart-summary',
  imports: [],
  templateUrl: './cart-summary.html',
  styleUrl: './cart-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartSummary {
  // ========== INPUTS ==========
  
  /**
   * Lista de items del carrito
   */
  readonly cartItems = input.required<CartItem[]>();

  /**
   * Subtotal sin IVA
   */
  readonly subtotal = input.required<number>();

  /**
   * Monto del IVA (21%)
   */
  readonly ivaAmount = input.required<number>();

  /**
   * Total con IVA incluido
   */
  readonly totalWithIva = input.required<number>();

  /**
   * Opción de entrega seleccionada
   */
  readonly selectedDeliveryOption = input<'pickup' | 'delivery'>('pickup');

  /**
   * Método de pago seleccionado (null si no hay ninguno)
   */
  readonly selectedPaymentMethod = input<PaymentMethod | null>(null);

  // ========== COMPUTED ==========

  /**
   * Texto descriptivo del método de pago seleccionado
   */
  readonly selectedPaymentMethodText = computed(() => {
    const method = this.selectedPaymentMethod();
    if (!method) return null;
    
    const paymentMethods: Record<PaymentMethod, string> = {
      'mercadopago-card': 'Tarjeta de Crédito/Débito (Mercado Pago)',
      'mercadopago': 'Mercado Pago',
      'transfer': 'Transferencia Bancaria',
      'cash': 'Efectivo en la entrega'
    };
    
    return paymentMethods[method];
  });

  /**
   * Indica si hay un método de pago seleccionado
   */
  readonly hasPaymentMethod = computed(() => this.selectedPaymentMethod() !== null);

  /**
   * Texto del costo de envío
   */
  readonly shippingText = computed(() => {
    return this.selectedDeliveryOption() === 'pickup' ? 'Gratis' : 'A convenir';
  });

  /**
   * Cantidad total de items en el carrito
   */
  readonly totalItems = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });
}