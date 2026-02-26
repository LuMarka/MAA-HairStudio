import { Component, signal, inject, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormPersonalData } from "../../organisms/form-personal-data/form-personal-data";
import { MethodePay } from "../../organisms/methode-pay/methode-pay";
import { Confirmation } from "../../organisms/confirmation/confirmation";
import { ShippingOptionsComponent } from "../../organisms/shipping-options/shipping-options";
import { OrderService } from "../../../core/services/order.service";
import { CartService } from "../../../core/services/cart.service";
import { PaymentService } from "../../../core/services/payment.service";
import { ShippingService } from "../../../core/services/shipping.service";
import type { DeliveryType, CreateOrderDto } from "../../../core/models/interfaces/order.interface";
import type { SelectedShippingOption } from "../../../core/models/interfaces/shipping.interface";
import { environment } from '../../../../environments/environment';

type PaymentMethod = 'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card';

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
  addressId?: string;  // ← Agregar
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
}

/**
 * Template para el flujo completo de compra (3 pasos)
 *
 * @responsibility Orquestar el proceso de checkout desde datos personales hasta confirmación
 * @step1 FormPersonalData - Recolectar información del cliente
 * @step2 MethodePay - Seleccionar método de pago
 * @step3 Confirmation - Revisar y finalizar pedido
 */
@Component({
  selector: 'app-purchase-order-template',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormPersonalData,
    MethodePay,
    Confirmation,
    ShippingOptionsComponent
  ],
  templateUrl: './purchase-order-template.html',
  styleUrl: './purchase-order-template.scss'
})
export class PurchaseOrderTemplate {
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);
  private readonly paymentService = inject(PaymentService);
  private readonly shippingService = inject(ShippingService);

  // ========== STATE SIGNALS ==========
  readonly currentStep = signal(1);
  readonly orderData = signal<OrderData | null>(null);
  readonly selectedPaymentMethod = signal<PaymentMethod | null>(null);
  readonly selectedDeliveryOption = signal<DeliveryType>('pickup');
  readonly orderSent = signal(false);
  readonly isProcessing = signal(false);
  readonly personalFormData = signal<Omit<OrderData, 'paymentMethod' | 'deliveryOption'> | null>(null);
  readonly selectedShippingOption = signal<SelectedShippingOption | null>(null);

  /**
   * ID de la orden creada en el backend.
   * Para delivery: se crea al pasar del Step 1 al Step 2 (antes de cotizar envío).
   * Para pickup: se crea en onFinalizeOrder (Step 4/3).
   */
  readonly createdOrderId = signal<string | null>(null);
  readonly createdOrderNumber = signal<string | null>(null);

  private readonly WHATSAPP_NUMBER = '5493534015655';
  private readonly totalSteps = 4; // 4 pasos para delivery, 3 para pickup

  // ========== COMPUTED VALUES - CART ==========
  readonly cartItems = computed(() => {
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

  // ========== COMPUTED VALUES - CHECKOUT STATE ==========
  readonly checkoutState = computed(() => this.orderService.checkoutState());
  readonly checkoutAddressId = computed(() => this.orderService.checkoutAddressId());

  // ========== COMPUTED VALUES - SHIPPING ==========
  readonly shippingOptions = computed(() => this.shippingService.shippingOptions());
  readonly shippingIsLoading = computed(() => this.shippingService.isLoading());
  readonly shippingError = computed(() => this.shippingService.errorMessage());

  /**
   * Determina si estamos en el paso de envío y si el envío es delivery
   */
  readonly shouldShowShipping = computed(() => {
    return this.currentStep() === 2 && this.selectedDeliveryOption() === 'delivery';
  });

  // ========== CONSTRUCTOR ==========
  constructor() {
    // Effect: Cargar deliveryType desde OrderService
    effect(() => {
      const checkoutState = this.checkoutState();
      if (checkoutState?.deliveryType) {
        this.selectedDeliveryOption.set(checkoutState.deliveryType);
      } else {
        this.selectedDeliveryOption.set('pickup');
      }
    });

    // La cotización de envío se dispara al crear la orden (createOrderAndGoToShipping)
  }

  // ========== NAVIGATION METHODS ==========
  onNextStep(): void {
    const currentStepValue = this.currentStep();
    const isPickup = this.selectedDeliveryOption() === 'pickup';
    const isDelivery = this.selectedDeliveryOption() === 'delivery';
    const maxSteps = isPickup ? 3 : this.totalSteps;

    if (currentStepValue < maxSteps) {
      // Validación para step 2 (shipping) si es delivery
      if (currentStepValue === 2 && isDelivery) {
        if (!this.selectedShippingOption()) {
          console.warn('⚠️ [PurchaseOrder] Opción de envío requerida');
          return;
        }
      }

      // Validación de método de pago:
      // - Pickup: payment está en step 2
      // - Delivery: payment está en step 3
      const isPaymentStep = (isPickup && currentStepValue === 2) || (isDelivery && currentStepValue === 3);
      if (isPaymentStep && !this.selectedPaymentMethod()) {
        console.warn('⚠️ [PurchaseOrder] Método de pago requerido');
        return;
      }

      this.currentStep.update(step => step + 1);
    }
  }

  onPreviousStep(): void {
    const currentStepValue = this.currentStep();
    if (currentStepValue > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  // ========== STEP 1: FORM PERSONAL DATA HANDLERS ==========
  onPersonalFormDataChange(data: Omit<OrderData, 'paymentMethod' | 'deliveryOption'>): void {

    this.personalFormData.set(data);

    this.orderData.set({
      ...data,
      deliveryOption: this.selectedDeliveryOption(),
      paymentMethod: this.selectedPaymentMethod() || 'cash'
    });
  }

  onPersonalFormValidChange(_isValid: boolean): void {
    // FormPersonalData maneja su propia validación
  }

  onEditCartFromForm(): void {
    this.router.navigate(['/cart']);
  }

  onContinueFromForm(): void {
    if (this.selectedDeliveryOption() === 'pickup') {
      // Pickup: ir al paso de método de pago (step 2 en pickup)
      this.currentStep.set(2);
    } else {
      // Delivery: crear orden primero, luego ir a shipping
      this.createOrderAndGoToShipping();
    }
  }

  // ========== STEP 2: SHIPPING METHOD HANDLERS (solo si es delivery) ==========

  /**
   * Crea la orden en el backend y luego va al paso de shipping.
   * Según la API: primero crear orden, luego cotizar envío con el orderId real.
   */
  private createOrderAndGoToShipping(): void {
    const createOrderDto = this.buildCreateOrderDto();
    if (!createOrderDto) {
      console.error('❌ [PurchaseOrder] No se pudo construir DTO para crear orden');
      return;
    }

    this.isProcessing.set(true);
    console.log('📦 [PurchaseOrder] Creando orden antes de cotizar envío...', createOrderDto);

    this.orderService.createOrderFromCart(createOrderDto).subscribe({
      next: (response) => {
        const orderId = response.data.id;
        const orderNumber = response.data.orderNumber;

        this.createdOrderId.set(orderId);
        this.createdOrderNumber.set(orderNumber);

        console.log('✅ [PurchaseOrder] Orden creada para shipping:', {
          orderId,
          orderNumber,
          deliveryType: response.data.deliveryType
        });

        this.isProcessing.set(false);
        // Ir al paso 2 (shipping) y cotizar
        this.currentStep.set(2);
        this.quoteShipping(orderId);
      },
      error: (error) => {
        console.error('❌ [PurchaseOrder] Error al crear orden:', error);
        this.isProcessing.set(false);
        alert('Hubo un error al crear tu pedido. Por favor intenta nuevamente.');
      }
    });
  }

  /**
   * Cotiza opciones de envío desde Zipnova usando el orderId real
   */
  private quoteShipping(orderId: string): void {
    const checkoutState = this.checkoutState();

    if (!checkoutState?.selectedAddressId) {
      console.warn('⚠️ [PurchaseOrder] No hay dirección seleccionada para cotizar envío');
      return;
    }

    console.log('🚚 [PurchaseOrder] Cotizando envío...', {
      orderId,
      destinationAddressId: checkoutState.selectedAddressId
    });

    this.shippingService.getShippingQuote({
      orderId,
      destinationAddressId: checkoutState.selectedAddressId
    }).subscribe({
      next: (response) => {
        console.log('✅ [PurchaseOrder] Opciones de envío obtenidas:', {
          optionsCount: response.data.options.length,
          origin: response.data.origin,
          destination: response.data.destination
        });
      },
      error: (error) => {
        console.error('❌ [PurchaseOrder] Error al cotizar envío:', error);
      }
    });
  }

  /**
   * Maneja la selección de opción de envío.
   * Crea el shipment en el backend y luego avanza al paso de pago.
   */
  onShippingSelected(selectedOption: SelectedShippingOption): void {
    this.selectedShippingOption.set(selectedOption);

    const orderId = this.createdOrderId();
    const addressId = this.checkoutAddressId();

    if (!orderId || !addressId) {
      console.error('❌ [PurchaseOrder] Faltan datos para crear envío');
      return;
    }

    this.isProcessing.set(true);
    console.log('📦 [PurchaseOrder] Creando envío con opción seleccionada...', selectedOption);

    this.shippingService.createShipment({
      orderId,
      destinationAddressId: addressId,
      zipnovaQuoteId: selectedOption.carrierId,
      shippingCost: selectedOption.price,
      serviceType: selectedOption.serviceType,
      logisticType: selectedOption.logisticType,
      carrierId: selectedOption.carrierId,
      pointId: selectedOption.pointId
    }).subscribe({
      next: (response) => {
        console.log('✅ [PurchaseOrder] Envío creado:', {
          shipmentId: response.data.id,
          trackingNumber: response.data.trackingNumber,
          carrier: response.data.carrier,
          shippingCost: response.data.shippingCost
        });
        this.isProcessing.set(false);
        // Avanzar al paso de pago
        this.currentStep.set(3);
      },
      error: (error) => {
        console.error('❌ [PurchaseOrder] Error al crear envío:', error);
        this.isProcessing.set(false);
        alert('Hubo un error al confirmar el envío. Por favor intenta nuevamente.');
      }
    });
  }

  // ========== STEP 3: PAYMENT METHOD HANDLERS ==========
  onPaymentMethodChange(method: PaymentMethod): void {
    this.selectedPaymentMethod.set(method);

    const currentData = this.personalFormData();
    if (currentData) {
      this.orderData.set({
        ...currentData,
        deliveryOption: this.selectedDeliveryOption(),
        paymentMethod: method
      });
    }
  }

  // ========== STEP 4: CONFIRMATION HANDLERS ==========
  onEditCart(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Construye el DTO para crear la orden usando CheckoutState
   */
  private buildCreateOrderDto(): CreateOrderDto | null {
    const orderData = this.orderData();
    const checkoutState = this.checkoutState();

    if (!orderData) {
      console.error('❌ [PurchaseOrder] No hay datos de orden');
      return null;
    }

    if (!checkoutState) {
      console.error('❌ [PurchaseOrder] No hay checkout state');
      return null;
    }

    const deliveryType = checkoutState.deliveryType;
    const addressId = checkoutState.selectedAddressId;

    // DTO base
    const baseDto: CreateOrderDto = {
      deliveryType,
      notes: orderData.deliveryInstructions || undefined
    };

    // Si es delivery Y hay addressId guardado
    if (deliveryType === 'delivery' && addressId) {
      return {
        ...baseDto,
        shippingAddressId: addressId
      };
    }

    // Si es delivery sin addressId, cambiar a pickup
    if (deliveryType === 'delivery' && !addressId) {
      return {
      ...baseDto,
      deliveryType: 'pickup'
      };
    }

    // Si es pickup
    return baseDto;
  }

  onFinalizeOrder(): void {
    const orderData = this.orderData();
    const paymentMethod = this.selectedPaymentMethod();
    const cartItems = this.cartItems();
    const total = this.totalWithIva();

    // ✅ LOG: Mostrar items del carrito
    console.log('🛒 [PurchaseOrder] Items en carrito:', {
      count: cartItems.length,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      }))
    });

    // ✅ LOG: Mostrar datos de la orden
    console.log('📋 [PurchaseOrder] Datos de orden:', {
      firstName: orderData?.firstName,
      email: orderData?.email,
      phone: orderData?.phone,
      deliveryOption: orderData?.deliveryOption,
      addressId: orderData?.addressId,
      paymentMethod,
      total
    });

    // Validaciones
    if (!orderData || !paymentMethod) {
      console.error('❌ [PurchaseOrder] Datos incompletos');
      return;
    }

    if (cartItems.length === 0) {
      console.error('❌ [PurchaseOrder] Carrito vacío');
      this.router.navigate(['/cart']);
      return;
    }

    if (total <= 0) {
      console.error('❌ [PurchaseOrder] Total inválido');
      return;
    }

    // Construir DTO
    const createOrderDto = this.buildCreateOrderDto();

    if (!createOrderDto) {
      console.error('❌ [PurchaseOrder] No se pudo construir DTO');
      return;
    }

    this.isProcessing.set(true);

    // Si es delivery, la orden ya fue creada en el paso 2
    const existingOrderId = this.createdOrderId();
    const existingOrderNumber = this.createdOrderNumber();

    if (existingOrderId && this.selectedDeliveryOption() === 'delivery') {
      console.log('📦 [PurchaseOrder] Usando orden existente:', existingOrderId);
      this.processPaymentForOrder(existingOrderId, existingOrderNumber || '', orderData, cartItems, total, paymentMethod);
      return;
    }

    // Para pickup: crear la orden ahora
    console.log('📦 [PurchaseOrder] Creando orden (pickup):', createOrderDto);

    this.orderService.createOrderFromCart(createOrderDto).subscribe({
      next: (response) => {
        console.log('✅ [PurchaseOrder] Orden creada:', {
          orderNumber: response.data.orderNumber,
          id: response.data.id,
          total: response.data.total,
          deliveryType: response.data.deliveryType
        });

        this.createdOrderId.set(response.data.id);
        this.createdOrderNumber.set(response.data.orderNumber);

        this.processPaymentForOrder(response.data.id, response.data.orderNumber, orderData, cartItems, total, paymentMethod);
      },
      error: (error) => {
        console.error('❌ [PurchaseOrder] Error al crear orden:', error);
        this.isProcessing.set(false);
        alert('Hubo un error al crear tu pedido. Por favor intenta nuevamente.');
      }
    });
  }

  /**
   * Procesa el pago para una orden ya creada
   */
  private processPaymentForOrder(
    orderId: string,
    orderNumber: string,
    orderData: OrderData,
    cartItems: CartItem[],
    total: number,
    paymentMethod: PaymentMethod
  ): void {
    // Si el método de pago es Mercado Pago, crear preferencia y redirigir
    if (paymentMethod === 'mercadopago' || paymentMethod === 'mercadopago-card') {
      this.handleMercadoPagoPayment(orderId, orderData, cartItems, total, orderNumber);
      return;
    }

    // Para otros métodos de pago (efectivo, transferencia), flujo tradicional
    this.cartService.clearCart().subscribe({
      next: () => {
        console.log('✅ [PurchaseOrder] Carrito limpiado');
        this.sendToWhatsApp(orderData, cartItems, total, orderNumber);
        this.orderService.clearCheckoutState();
        this.shippingService.clearShippingOptions();
        this.handleOrderSuccess();
      },
      error: (error) => {
        console.error('⚠️ [PurchaseOrder] Error al limpiar carrito:', error);
        this.sendToWhatsApp(orderData, cartItems, total, orderNumber);
        this.orderService.clearCheckoutState();
        this.shippingService.clearShippingOptions();
        this.handleOrderSuccess();
      }
    });
  }

  /**
   * Maneja el flujo de pago con Mercado Pago
   * Crea preferencia, limpia carrito, abre MP en nueva pestaña y envía a WhatsApp
   */
  private handleMercadoPagoPayment(
    orderId: string,
    orderData: OrderData,
    cartItems: CartItem[],
    total: number,
    orderNumber: string
  ): void {
    console.log(
      '💳 [PurchaseOrder] Iniciando pago con Mercado Pago para orden:',
      orderId
    );

    this.paymentService.createPreference(orderId.toString()).subscribe({
      next: (response) => {
        console.log('✅ [PurchaseOrder] Preferencia de Mercado Pago creada:', {
          preferenceId: response.data.preferenceId,
          amount: response.data.amount,
          currency: response.data.currency
        });

        // ✅ Limpiar carrito
        this.cartService.clearCart().subscribe({
          next: () => {
            console.log('✅ [PurchaseOrder] Carrito limpiado');
            this.orderService.clearCheckoutState();

            // ✅ Redirigir a Mercado Pago en NUEVA PESTAÑA (no cierra la app)
            const useSandbox = !environment.production;
            console.log(
              `🔗 [PurchaseOrder] Abriendo Mercado Pago en nueva pestaña (${
                useSandbox ? 'SANDBOX' : 'PRODUCCIÓN'
              })`
            );

            this.paymentService.redirectToMercadoPago(
              response.data.initPoint,
              response.data.sandboxInitPoint,
              useSandbox
            );

            // ✅ CONTINUAMOS EN LA APP: Enviar a WhatsApp y mostrar confirmación
            console.log('💬 [PurchaseOrder] Enviando pedido a WhatsApp...');
            this.sendToWhatsApp(orderData, cartItems, total, orderNumber);
            this.handleOrderSuccess();
          },
          error: (error) => {
            console.error(
              '⚠️ [PurchaseOrder] Error al limpiar carrito:',
              error
            );
            this.orderService.clearCheckoutState();

            // Abrir MP de todas formas en nueva pestaña
            const useSandbox = !environment.production;
            this.paymentService.redirectToMercadoPago(
              response.data.initPoint,
              response.data.sandboxInitPoint,
              useSandbox
            );

            // Enviar a WhatsApp aunque haya error
            console.log('💬 [PurchaseOrder] Enviando pedido a WhatsApp (con error)...');
            this.sendToWhatsApp(orderData, cartItems, total, orderNumber);
            this.handleOrderSuccess();
          }
        });
      },
      error: (error) => {
        console.error(
          '❌ [PurchaseOrder] Error al crear preferencia de Mercado Pago:',
          error
        );
        this.isProcessing.set(false);

        // Mostrar error al usuario
        alert(
          'Hubo un error al procesar el pago con Mercado Pago. Intenta nuevamente.'
        );
      }
    });
  }

  onBackToHome(): void {
    this.orderService.clearCheckoutState();
    this.router.navigate(['/']);
  }

  // ========== WHATSAPP INTEGRATION ==========
  private sendToWhatsApp(
    orderData: OrderData,
    cartItems: CartItem[],
    total: number,
    orderNumber: string
  ): void {
    const message = this.buildWhatsAppMessage(orderData, cartItems, total, orderNumber);

    try {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodedMessage}`;

      if (whatsappUrl.length > 2000) {
        this.copyToClipboard(message);
        alert('El mensaje es muy largo. Se ha copiado al portapapeles. Por favor, pégalo en WhatsApp.');
        window.open(`https://wa.me/${this.WHATSAPP_NUMBER}`, '_blank');
        return;
      }

      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('❌ Error al abrir WhatsApp:', error);
      this.copyToClipboard(message);
      alert('Hubo un error al abrir WhatsApp. El mensaje se ha copiado al portapapeles.');
      window.open(`https://wa.me/${this.WHATSAPP_NUMBER}`, '_blank');
    }
  }

  private buildWhatsAppMessage(
    data: OrderData,
    items: CartItem[],
    total: number,
    orderNumber: string
  ): string {
    let message = '🛍️ NUEVO PEDIDO - MAA Hair Studio\n\n';
    message += `📋 ORDEN: ${orderNumber}\n\n`;

    message += '🛒 PRODUCTOS:\n';
    items.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      const brand = item.brand ? ` (${item.brand})` : '';
      message += `${index + 1}. ${item.name}${brand}\n`;
      message += `   Cantidad: x${item.quantity} - Subtotal: $${itemTotal.toFixed(2)}\n`;
    });

    message += `\n💰 TOTAL: $${total.toFixed(2)}\n\n`;

    message += '👤 DATOS DEL CLIENTE:\n';
    message += `Nombre y Apellido: ${data.firstName}}\n`;
    message += `Email: ${data.email}\n`;
    message += `Teléfono: ${data.phone}\n\n`;

    if (data.deliveryOption === 'delivery') {
      message += '🚚 DIRECCIÓN DE ENTREGA:\n';
      if (data.province) message += `Provincia: ${data.province}\n`;
      if (data.city) message += `Ciudad: ${data.city}\n`;
      if (data.address) message += `Dirección: ${data.address}\n`;
      if (data.postalCode) message += `Código Postal: ${data.postalCode}\n`;
    } else {
      message += '🏪 RETIRO EN TIENDA\n';
    }

    message += `\n💳 MÉTODO DE PAGO: ${this.getPaymentMethodText(data.paymentMethod)}\n`;

    if (data.deliveryInstructions?.trim()) {
      message += `\n📝 Notas: ${data.deliveryInstructions}\n`;
    }

    message += '\n¡Gracias por tu pedido! 🎉';

    return message;
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

  private handleOrderSuccess(): void {
    this.isProcessing.set(false);
    this.orderSent.set(true);
    console.log('🎉 [PurchaseOrder] Orden procesada exitosamente');
  }

  private copyToClipboard(message: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).catch(err => {
        console.error('❌ Error al copiar al portapapeles:', err);
      });
    }
  }
}
