import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

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
 * @responsibility Mostrar resumen de productos, totales, método de pago y estado de validación
 * @reusable Usado en confirmación de pedido, checkout y formulario de datos personales
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
 *   [isFormValid]="formValid()"
 *   [validationMessage]="validationMsg()"
 * />
 * ```
 */
@Component({
  selector: 'app-cart-summary',
  imports: [CurrencyPipe],
  templateUrl: './cart-summary.html',
  styleUrl: './cart-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartSummary {
  // ========== INPUTS - CART DATA ==========
  
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

  // ========== INPUTS - DELIVERY & PAYMENT ==========
  
  /**
   * Opción de entrega seleccionada
   */
  readonly selectedDeliveryOption = input<'pickup' | 'delivery'>('pickup');

  /**
   * Método de pago seleccionado (null si no hay ninguno)
   */
  readonly selectedPaymentMethod = input<PaymentMethod | null>(null);

  // ========== INPUTS - VALIDATION ==========
  
  /**
   * Indica si el formulario padre es válido
   */
  readonly isFormValid = input<boolean>(false);

  /**
   * Mensaje de validación del formulario padre
   */
  readonly validationMessage = input<string>('');

  /**
   * Indica si se debe mostrar el estado de validación
   */
  readonly showValidation = input<boolean>(false);

  // ========== COMPUTED - CART ==========

  /**
   * Indica si hay items en el carrito
   */
  readonly hasCartItems = computed(() => this.cartItems().length > 0);

  /**
   * Cantidad total de items en el carrito
   */
  readonly cartItemsCount = computed(() => this.cartItems().length);

  /**
   * Cantidad total de productos (suma de quantities)
   */
  readonly totalItems = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  // ========== COMPUTED - PAYMENT ==========

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

  // ========== COMPUTED - DELIVERY ==========

  /**
   * Texto del costo de envío
   */
  readonly shippingText = computed(() => {
    return this.selectedDeliveryOption() === 'pickup' ? 'Gratis' : 'A convenir';
  });

  /**
   * Texto de la modalidad de entrega
   */
  readonly deliveryOptionText = computed(() => {
    return this.selectedDeliveryOption() === 'delivery' 
      ? 'Envío a domicilio' 
      : 'Retiro en tienda';
  });

  /**
   * Label del tiempo de entrega/retiro
   */
  readonly deliveryTimeLabel = computed(() => {
    return this.selectedDeliveryOption() === 'delivery'
      ? 'Tiempo estimado:'
      : 'Disponible:';
  });

  /**
   * Texto del tiempo de entrega/retiro
   */
  readonly deliveryTimeText = computed(() => {
    return this.selectedDeliveryOption() === 'delivery'
      ? '3-5 días hábiles'
      : 'Inmediato';
  });

  // ========== COMPUTED - VALIDATION ==========

  /**
   * Indica si se debe mostrar el estado de validación
   * Se muestra si showValidation es true O si hay un mensaje de validación
   */
  readonly shouldShowValidation = computed(() => {
    return this.showValidation() || !!this.validationMessage();
  });
}