import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
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
  imports: [CommonModule],
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
  readonly selectedDeliveryOption = computed(() => {
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

    // Construir DTO base
    const baseDto = {
      deliveryType,
      notes: orderData.notes || undefined
    };

    // Si es delivery Y hay addressId, usar shippingAddressId
    if (deliveryType === 'delivery' && addressId) {
      console.log('📦 Creando orden con delivery y addressId:', addressId);
      return {
        ...baseDto,
        shippingAddressId: addressId
      } as CreateOrderDto;
    }

    // Si es delivery pero NO hay addressId guardado (dirección manual)
    if (deliveryType === 'delivery' && !addressId) {
      console.log('📦 Creando orden con delivery pero sin addressId guardado');
      // El backend creará la dirección temporal con los datos de orderData
      return {
        ...baseDto,
        // Aquí podrías agregar campos de dirección manual si tu DTO lo soporta
        // O manejar este caso de forma diferente
      } as CreateOrderDto;
    }

    // Si es pickup
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

    // Emitir evento para que el componente padre maneje la creación
    // O crear la orden directamente aquí
    this.finalizeOrder.emit();

    // Si quieres crear la orden directamente desde aquí:
    /*
    this.orderService.createOrderFromCart(createOrderDto).subscribe({
      next: (response) => {
        console.log('✅ Orden creada exitosamente:', response.data.orderNumber);
        // Limpiar checkout state después de crear orden
        this.orderService.clearCheckoutState();
        // Emitir evento de éxito
        this.finalizeOrder.emit();
      },
      error: (error) => {
        console.error('❌ Error al crear orden:', error);
        // Manejar error
      }
    });
    */
  }

  onBackToHome(): void {
    // Limpiar checkout state al volver al inicio
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
