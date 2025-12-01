import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect, inject } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { CartSummary } from '../../molecules/cart-summary/cart-summary';
import type { CreateOrderDto } from '../../../core/models/interfaces/order.interface';

type PaymentMethod = 'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card';

interface OrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryOption: 'pickup' | 'delivery';
  address?: string;
  city?: string;
  province?: string;
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
 * @features
 * - Muestra resumen completo del pedido antes de finalizar
 * - Integración con OrderService para crear orden con addressId
 * - Manejo de delivery con dirección guardada vs pickup
 * - Countdown automático después de orden exitosa
 * - Gestión de estados de loading y error
 *
 * @example
 * ```html
 * <app-confirmation
 *   [orderData]="orderData()"
 *   [orderSent]="orderSent()"
 *   [isProcessing]="isProcessing()"
 *   (previousStep)="onPreviousStep()"
 *   (finalizeOrder)="onFinalizeOrder()"
 *   (backToHome)="onBackToHome()">
 * </app-confirmation>
 * ```
 */
@Component({
  selector: 'app-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CartSummary],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss'
})
export class Confirmation {
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);

  // ========== INPUTS ==========
  readonly orderData = input<OrderData | null>(null);
  readonly orderSent = input(false);
  readonly isProcessing = input(false);

  // ========== OUTPUTS ==========
  readonly editCart = output<void>();
  readonly previousStep = output<void>();
  readonly finalizeOrder = output<void>();
  readonly backToHome = output<void>();

  // ========== SIGNALS ==========
  private readonly redirectCountdown = signal(60);

  // ========== COMPUTED - ORDER SERVICE ==========
  readonly checkoutState = computed(() => this.orderService.checkoutState());
  readonly checkoutDeliveryType = computed(() => this.orderService.checkoutDeliveryType());
  readonly checkoutAddressId = computed(() => this.orderService.checkoutAddressId());
  readonly isDeliveryCheckout = computed(() => this.orderService.isDeliveryCheckout());
  readonly isPickupCheckout = computed(() => this.orderService.isPickupCheckout());

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

  readonly subtotal = computed(() => this.cartService.subtotal());
  readonly ivaAmount = computed(() => this.subtotal() * 0.21);
  readonly totalWithIva = computed(() => this.cartService.totalAmount());

  // ========== COMPUTED - DELIVERY & PAYMENT ==========
  readonly selectedDeliveryOption = computed<'pickup' | 'delivery'>(() => {
    return this.checkoutDeliveryType() || 'pickup';
  });

  readonly selectedPaymentMethod = computed<PaymentMethod | null>(() => {
    const data = this.orderData();
    return data?.paymentMethod ?? null;
  });

  readonly selectedPaymentMethodText = computed(() => {
    const method = this.selectedPaymentMethod();
    if (!method) return '';
    return this.getPaymentMethodText(method);
  });

  readonly deliveryOptionText = computed(() => {
    return this.isDeliveryCheckout()
      ? 'Envío a domicilio'
      : 'Retiro en tienda';
  });

  // ========== COMPUTED - VALIDATION ==========
  readonly hasValidOrder = computed(() => {
    const data = this.orderData();
    const paymentMethod = this.selectedPaymentMethod();
    const items = this.cartItems();
    const hasCheckout = this.orderService.validateCheckout();

    return data !== null &&
           paymentMethod !== null &&
           items.length > 0 &&
           hasCheckout;
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

    // Effect para debug del estado de checkout
    effect(() => {
      const state = this.checkoutState();
      if (state) {
        console.log('🔍 Estado de checkout en confirmación:', {
          deliveryType: state.deliveryType,
          addressId: state.selectedAddressId,
          hasAddress: !!state.selectedAddressId
        });
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

  /**
   * Construye el DTO para crear la orden según el tipo de entrega y addressId
   */
  private buildCreateOrderDto(): CreateOrderDto | null {
    const orderData = this.orderData();
    const checkoutState = this.checkoutState();

    if (!orderData || !checkoutState) {
      console.error('❌ Datos de orden o checkout state no disponibles');
      return null;
    }

    const deliveryType = checkoutState.deliveryType;
    const addressId = checkoutState.selectedAddressId;

    const baseDto = {
      deliveryType,
      notes: orderData.notes || undefined
    };

    if (deliveryType === 'delivery' && addressId) {
      console.log('📦 Creando orden con delivery y addressId:', addressId);
      return {
        ...baseDto,
        shippingAddressId: addressId
      } as CreateOrderDto;
    }

    if (deliveryType === 'delivery' && !addressId) {
      console.log('📦 Creando orden con delivery pero sin addressId guardado');
      return {
        ...baseDto
      } as CreateOrderDto;
    }

    console.log('🏪 Creando orden con pickup');
    return {
      ...baseDto
    } as CreateOrderDto;
  }

  // ========== MÉTODOS PÚBLICOS - EVENTOS ==========
  onEditCart(): void {
    this.editCart.emit();
  }

  onPreviousStep(): void {
    this.previousStep.emit();
  }

  /**
   * Finaliza el pedido creando la orden con OrderService
   */
  onFinalizeOrder(): void {
    if (!this.canFinalize()) {
      console.warn('⚠️ No se puede finalizar la orden en este momento');
      return;
    }

    const createOrderDto = this.buildCreateOrderDto();

    if (!createOrderDto) {
      console.error('❌ No se pudo construir el DTO de orden');
      return;
    }

    console.log('📝 Finalizando orden con DTO:', createOrderDto);
    this.finalizeOrder.emit();
  }

  onBackToHome(): void {
    this.orderService.clearCheckoutState();
    this.backToHome.emit();
  }

  // ========== MÉTODOS PÚBLICOS - API ==========

  /**
   * Método público para obtener el DTO de creación de orden
   * Útil si el componente padre maneja la creación
   */
  getCreateOrderDto(): CreateOrderDto | null {
    return this.buildCreateOrderDto();
  }

  // ========== HELPERS PARA TEMPLATE ==========
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
