import { Component, signal, inject, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormPersonalData } from "../../organisms/form-personal-data/form-personal-data";
import { MethodePay } from "../../organisms/methode-pay/methode-pay";
import { Confirmation } from "../../organisms/confirmation/confirmation";
import { OrderService } from "../../../core/services/order.service";
import { CartService } from "../../../core/services/cart.service";
import type { DeliveryType } from "../../../core/models/interfaces/order.interface";

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
  lastName: string;
  email: string;
  phone: string;
  deliveryOption: DeliveryType;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
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
  readonly selectedDeliveryOption = signal<DeliveryType>('delivery');
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

  readonly subtotal = computed(() => {
    return this.cartService.totalAmount() / 1.21; // Sin IVA
  });

  readonly ivaAmount = computed(() => {
    return this.subtotal() * 0.21;
  });

  readonly totalWithIva = computed(() => {
    return this.cartService.totalAmount(); // Ya incluye IVA
  });

  // ========== CONSTRUCTOR ==========
  constructor() {
    // Cargar deliveryType desde OrderService al inicializar
    effect(() => {
      const checkoutState = this.orderService.checkoutState();
      if (checkoutState?.deliveryType) {
        this.selectedDeliveryOption.set(checkoutState.deliveryType);
        console.log('📦 Tipo de entrega cargado:', checkoutState.deliveryType);
      } else {
        console.warn('⚠️ No hay tipo de entrega seleccionado, redirigiendo al carrito...');
        this.router.navigate(['/cart']);
      }
    });
  }

  // ========== NAVIGATION METHODS ==========
  onNextStep(): void {
    const currentStepValue = this.currentStep();

    if (currentStepValue < this.totalSteps) {
      // Step 2 requires payment method
      if (currentStepValue === 2 && !this.selectedPaymentMethod()) {
        return;
      }

      this.currentStep.set(currentStepValue + 1);
    }
  }

  onPreviousStep(): void {
    const currentStepValue = this.currentStep();
    if (currentStepValue > 1) {
      this.currentStep.set(currentStepValue - 1);
    }
  }

  // ========== STEP 1: FORM PERSONAL DATA HANDLERS ==========
  onPersonalFormDataChange(data: Omit<OrderData, 'paymentMethod' | 'deliveryOption'>): void {
    this.personalFormData.set(data);

    // Update orderData with current delivery option and payment method
    this.orderData.set({
      ...data,
      deliveryOption: this.selectedDeliveryOption(),
      paymentMethod: this.selectedPaymentMethod() || 'cash'
    });
  }

  onPersonalFormValidChange(_isValid: boolean): void {
    // FormPersonalData handles its own validation
    // Just listen for validity changes if needed
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

    // Update orderData with selected payment method
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

  onFinalizeOrder(): void {
    const data = this.orderData();
    const paymentMethod = this.selectedPaymentMethod();
    const cartItems = this.cartItems();
    const total = this.totalWithIva();

    if (!data || !paymentMethod) {
      console.error('Datos del pedido incompletos');
      return;
    }

    if (cartItems.length === 0) {
      console.error('El carrito está vacío');
      this.router.navigate(['/cart']);
      return;
    }

    if (total <= 0) {
      console.error('Total inválido');
      return;
    }

    this.isProcessing.set(true);
    this.sendToWhatsApp(data, cartItems, total);
  }

  onBackToHome(): void {
    // Limpiar estado de checkout
    /* this.orderService.clearCheckout(); */
    this.router.navigate(['/']);
  }

  // ========== WHATSAPP INTEGRATION ==========
  private sendToWhatsApp(orderData: OrderData, cartItems: CartItem[], total: number): void {
    const message = this.buildWhatsAppMessage(orderData, cartItems, total);

    try {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodedMessage}`;

      if (whatsappUrl.length > 2000) {
        this.copyToClipboard(message);
        alert('El mensaje es muy largo. Se ha copiado al portapapeles. Por favor, pégalo en WhatsApp.');
        window.open(`https://wa.me/${this.WHATSAPP_NUMBER}`, '_blank');
        this.handleOrderSuccess();
        return;
      }

      window.open(whatsappUrl, '_blank');
      this.handleOrderSuccess();

    } catch (error) {
      console.error('Error sending to WhatsApp:', error);
      this.copyToClipboard(message);
      alert('Hubo un error al abrir WhatsApp. El mensaje se ha copiado al portapapeles.');
      window.open(`https://wa.me/${this.WHATSAPP_NUMBER}`, '_blank');
      this.handleOrderSuccess();
    }
  }

  private buildWhatsAppMessage(data: OrderData, items: CartItem[], total: number): string {
    let message = '🛍️ NUEVO PEDIDO - MAA Hair Studio\n\n';

    message += '📋 PRODUCTOS:\n';
    items.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      const brand = item.brand ? ` (${item.brand})` : '';
      message += `${index + 1}. ${item.name}${brand} x${item.quantity} - $${itemTotal.toFixed(2)}\n`;
    });

    message += `\n💰 TOTAL: $${total.toFixed(2)}\n\n`;

    message += '👤 DATOS DEL CLIENTE:\n';
    message += `Nombre: ${data.firstName} ${data.lastName}\n`;
    message += `Email: ${data.email}\n`;
    message += `Teléfono: ${data.phone}\n\n`;

    if (data.deliveryOption === 'delivery') {
      message += '🚚 DIRECCIÓN DE ENTREGA:\n';
      message += `Dirección: ${data.address}\n`;
      message += `Ciudad: ${data.city}\n`;
      if (data.postalCode) {
        message += `Código Postal: ${data.postalCode}\n`;
      }
    } else {
      message += '🏪 RETIRO EN TIENDA\n';
    }

    message += `\n💳 MÉTODO DE PAGO: ${this.getPaymentMethodText(data.paymentMethod)}\n`;

    if (data.notes?.trim()) {
      message += `\n📝 Notas: ${data.notes}\n`;
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

    // Limpiar carrito después de orden exitosa
    /* this.cartService.clearCart(); */

    // Limpiar estado de checkout
    /* this.orderService.clearCheckout(); */
  }

  private copyToClipboard(message: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).catch(err => {
        console.error('Failed to copy message:', err);
      });
    }
  }
}
