import { Component, signal, inject, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormPersonalData } from "../../organisms/form-personal-data/form-personal-data";
import { MethodePay } from "../../organisms/methode-pay/methode-pay";
import { Confirmation } from "../../organisms/confirmation/confirmation";
import { OrderService } from "../../../core/services/order.service";
import { CartService } from "../../../core/services/cart.service";
import type { DeliveryType, CreateOrderDto } from "../../../core/models/interfaces/order.interface";

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
    Confirmation
  ],
  templateUrl: './purchase-order-template.html',
  styleUrl: './purchase-order-template.scss'
})
export class PurchaseOrderTemplate {
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);

  // ========== STATE SIGNALS ==========
  readonly currentStep = signal(1);
  readonly orderData = signal<OrderData | null>(null);
  readonly selectedPaymentMethod = signal<PaymentMethod | null>(null);
  readonly selectedDeliveryOption = signal<DeliveryType>('pickup');
  readonly orderSent = signal(false);
  readonly isProcessing = signal(false);
  readonly personalFormData = signal<Omit<OrderData, 'paymentMethod' | 'deliveryOption'> | null>(null);

  private readonly WHATSAPP_NUMBER = '573185539506';
  private readonly totalSteps = 3;

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

  // ========== CONSTRUCTOR ==========
  constructor() {
    // Effect: Cargar deliveryType desde OrderService
    effect(() => {
      const checkoutState = this.checkoutState();
      if (checkoutState?.deliveryType) {
        this.selectedDeliveryOption.set(checkoutState.deliveryType);
        console.log('📦 [PurchaseOrder] Tipo de entrega:', checkoutState.deliveryType);
      } else {
        console.warn('⚠️ [PurchaseOrder] No hay checkout state, usando pickup por defecto');
        this.selectedDeliveryOption.set('pickup');
      }
    });
  }

  // ========== NAVIGATION METHODS ==========
  onNextStep(): void {
    const currentStepValue = this.currentStep();

    if (currentStepValue < this.totalSteps) {
      if (currentStepValue === 2 && !this.selectedPaymentMethod()) {
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
    this.currentStep.set(2);
  }

  // ========== STEP 2: PAYMENT METHOD HANDLERS ==========
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

  // ========== STEP 3: CONFIRMATION HANDLERS ==========
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
      console.log('📦 [PurchaseOrder] Creando orden con addressId:', addressId);
      return {
        ...baseDto,
        shippingAddressId: addressId
      };
    }

    // Si es delivery sin addressId, cambiar a pickup
    if (deliveryType === 'delivery' && !addressId) {
      console.log('📦 [PurchaseOrder] Sin addressId, cambiando a pickup');
      return {
      ...baseDto,
      deliveryType: 'pickup'
      };
    }

    // Si es pickup
    console.log('🏪 [PurchaseOrder] Creando orden pickup');
    return baseDto;
  }

  onFinalizeOrder(): void {
    const orderData = this.orderData();
    const paymentMethod = this.selectedPaymentMethod();
    const cartItems = this.cartItems();
    const total = this.totalWithIva();

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

    console.log('📦 [PurchaseOrder] Creando orden:', createOrderDto);

    // Crear orden en el backend
    this.orderService.createOrderFromCart(createOrderDto).subscribe({
      next: (response) => {
        console.log('✅ [PurchaseOrder] Orden creada:', {
          orderNumber: response.data.orderNumber,
          id: response.data.id,
          total: response.data.total,
          deliveryType: response.data.deliveryType,
          hasShippingAddress: !!response.data.shippingAddress
        });

        // Limpiar carrito
        this.cartService.clearCart().subscribe({
          next: () => {
            console.log('✅ [PurchaseOrder] Carrito limpiado');
            this.sendToWhatsApp(orderData, cartItems, total, response.data.orderNumber);
            this.orderService.clearCheckoutState();
            this.handleOrderSuccess();
          },
          error: (error) => {
            console.error('⚠️ [PurchaseOrder] Error al limpiar carrito:', error);
            this.sendToWhatsApp(orderData, cartItems, total, response.data.orderNumber);
            this.orderService.clearCheckoutState();
            this.handleOrderSuccess();
          }
        });
      },
      error: (error) => {
        console.error('❌ [PurchaseOrder] Error al crear orden:', error);
        this.isProcessing.set(false);
        alert('Hubo un error al crear tu pedido. Por favor intenta nuevamente.');
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
