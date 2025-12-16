import { Component, ChangeDetectionStrategy, input, output, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { CartSummary } from "../../molecules/cart-summary/cart-summary";

type PaymentMethod = 'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card';
type DeliveryType = 'pickup' | 'delivery';

interface CartItem {
  id: string;
  name: string;
  brand?: string;
  quantity: number;
  price: number;
}

interface OrderData {
  firstName: string;
  /* lastName: string; */
  email: string;
  phone: string;
  deliveryOption: DeliveryType;
  addressId?: string; // ✅ Agregar
  address?: string;
  city?: string;
  province?: string; // ✅ Ya está, asegúrate que esté
  postalCode?: string;
  deliveryInstructions?: string; // ✅ Cambiar notes por deliveryInstructions
}

/**
 * Organismo para la selección del método de pago (Paso 2)
 *
 * @responsibility Gestionar la selección del método de pago y mostrar resumen del pedido
 * @features
 * - Selección de método de pago con validación
 * - Resumen de datos del cliente del paso anterior
 * - Resumen completo del carrito con totales
 * - Cálculo automático de IVA y totales
 * - Navegación entre pasos del checkout
 */
@Component({
  selector: 'app-methode-pay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CartSummary], // ✅ Solo CartSummary
  templateUrl: './methode-pay.html',
  styleUrl: './methode-pay.scss'
})
export class MethodePay {
  private readonly cartService = inject(CartService);

  // ========== INPUTS ==========
  readonly orderData = input<OrderData | null>(null);
  readonly selectedPaymentMethod = input<PaymentMethod | null>(null);
  readonly selectedDeliveryOption = input.required<DeliveryType>();

  // ========== OUTPUTS ==========
  readonly paymentMethodChange = output<PaymentMethod>();
  readonly previousStep = output<void>();
  readonly nextStep = output<void>();

  // ========== COMPUTED - CART DATA ==========
  readonly cartItems = computed<CartItem[]>(() => {
    const cart = this.cartService.cart();
    if (!cart?.data) return [];

    return cart.data.map(item => ({
      id: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      quantity: item.quantity,
      price: item.product.finalPrice
    }));
  });

  readonly hasCartItems = computed(() => this.cartItems().length > 0);
  readonly cartItemsCount = computed(() => this.cartItems().length);

  // ========== COMPUTED - TOTALS ==========
  readonly subtotal = computed(() => {
    return this.cartService.subtotal();
  });

  readonly ivaAmount = computed(() => {
    return this.subtotal() * 0.21;
  });

  readonly totalWithIva = computed(() => {
    return this.cartService.totalAmount();
  });

  readonly shippingCost = computed(() => {
    return this.selectedDeliveryOption() === 'pickup' ? 0 : 0; // A convenir
  });

  readonly shippingText = computed(() => {
    return this.selectedDeliveryOption() === 'pickup' ? 'Gratis' : 'A convenir';
  });

  // ========== COMPUTED - PAYMENT METHOD ==========
  readonly selectedPaymentMethodText = computed(() => {
    const method = this.selectedPaymentMethod();
    if (!method) return '';

    const paymentMethods: Record<PaymentMethod, string> = {
      'mercadopago-card': 'Tarjeta de Crédito/Débito (Mercado Pago)',
      'mercadopago': 'Mercado Pago',
      'transfer': 'Transferencia Bancaria',
      'cash': 'Efectivo'
    };

    return paymentMethods[method] || 'No especificado';
  });

  readonly canContinue = computed(() => {
    return this.selectedPaymentMethod() !== null && this.hasCartItems();
  });

  // ========== COMPUTED - DELIVERY ==========
  readonly deliveryText = computed(() => {
    return this.selectedDeliveryOption() === 'pickup'
      ? 'Retiro en tienda'
      : 'Envío a domicilio';
  });

  readonly deliveryBadgeText = computed(() => {
    return this.selectedDeliveryOption() === 'pickup' ? '🏪 Retiro' : '🚚 Envío';
  });

  // ========== COMPUTED - CUSTOMER DATA ==========
  readonly customerName = computed(() => {
    const data = this.orderData();
    if (!data) return '';
    return `${data.firstName}`;
  });

  readonly hasDeliveryAddress = computed(() => {
    const data = this.orderData();
    return data?.deliveryOption === 'delivery' && !!data.address;
  });

  // ========== COMPUTED - ADDRESS INFO ==========
  readonly hasAddressId = computed(() => {
    const data = this.orderData();
    return !!data?.addressId;
  });

  readonly hasManualAddress = computed(() => {
    const data = this.orderData();
    return !!data?.address && !data.addressId;
  });

  // ========== CONSTRUCTOR ==========
  constructor() {
    // Effect para debug
    effect(() => {
      const data = this.orderData();
    });
  }

  // ========== MÉTODOS PÚBLICOS - EVENTOS ==========
  onPaymentMethodChange(method: PaymentMethod): void {
    this.paymentMethodChange.emit(method);
  }

  onPreviousStep(): void {
    this.previousStep.emit();
  }

  onNextStep(): void {
    if (!this.canContinue()) {
      console.warn('⚠️ No se puede continuar: método de pago no seleccionado o carrito vacío');
      return;
    }
    this.nextStep.emit();
  }

  // ========== MÉTODOS PÚBLICOS - HELPERS ==========

  /**
   * Formatea un precio a formato de moneda
   */
  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  /**
   * Calcula el subtotal de un item
   */
  getItemSubtotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  /**
   * Obtiene el ícono del método de pago
   */
  getPaymentMethodIcon(method: PaymentMethod): string {
    const icons: Record<PaymentMethod, string> = {
      'cash': '💵',
      'transfer': '🏦',
      'mercadopago': '💳',
      'mercadopago-card': '💳'
    };
    return icons[method] || '💳';
  }

  /**
   * Obtiene el título del método de pago
   */
  getPaymentMethodTitle(method: PaymentMethod): string {
    const titles: Record<PaymentMethod, string> = {
      'cash': 'Efectivo',
      'transfer': 'Transferencia bancaria',
      'mercadopago': 'Mercado Pago',
      'mercadopago-card': 'Tarjeta (Mercado Pago)'
    };
    return titles[method] || 'Método de pago';
  }

  /**
   * Obtiene el subtítulo del método de pago según tipo de entrega
   */
  getPaymentMethodSubtitle(method: PaymentMethod): string {
    const deliveryOption = this.selectedDeliveryOption();

    const subtitles: Record<PaymentMethod, string> = {
      'cash': deliveryOption === 'delivery'
        ? 'Paga al momento de la entrega'
        : 'Paga al momento del retiro',
      'transfer': 'Te enviaremos los datos bancarios',
      'mercadopago': 'Pago online seguro',
      'mercadopago-card': 'Crédito o débito'
    };

    return subtitles[method] || '';
  }

  /**
   * Formatea la dirección completa de entrega
   */
  getFullAddress(): string {
    const data = this.orderData();
    if (!data || data.deliveryOption !== 'delivery') return '';

    const parts = [
      data.address,
      data.city,
      data.province,
      data.postalCode
    ].filter(Boolean);

    return parts.join(', ');
  }
}
