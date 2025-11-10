import { Component, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PurchaseOrderHeader } from '../../organisms/purchase-order-header/purchase-order-header';
import { PurchaseOrderForm } from '../../organisms/purchase-order-form/purchase-order-form';
import { PurchaseOrderSummary } from '../../organisms/purchase-order-summary/purchase-order-summary';
import { CartService } from '../../../core/services/cart.service';

interface OrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
  paymentMethod: 'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card';
}

interface CartItem {
  id: string;
  name: string;
  brand?: string;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-purchase-order-template',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PurchaseOrderHeader,
    PurchaseOrderForm,
    PurchaseOrderSummary
  ],
  templateUrl: './purchase-order-template.html',
  styleUrl: './purchase-order-template.scss'
})
export class PurchaseOrderTemplate {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly currentStep = signal(1);
  readonly totalSteps = signal(3);
  readonly isFormValid = signal(false);
  readonly orderData = signal<OrderData | null>(null);
  readonly selectedPaymentMethod = signal<OrderData['paymentMethod'] | null>(null);

  /* private readonly WHATSAPP_NUMBER = '5493534015655'; */
  private readonly WHATSAPP_NUMBER = '5492616984285';

  readonly cartItems = computed(() => this.cartService.items());
  readonly cartTotal = computed(() => this.cartService.total());

  readonly isOrderComplete = computed(() => {
    const data = this.orderData();
    const paymentMethod = this.selectedPaymentMethod();
    return data !== null && paymentMethod !== null && this.isFormValid();
  });

  onNextStep(): void {
    const currentStepValue = this.currentStep();

    if (currentStepValue < this.totalSteps()) {
      // Para el paso 1, verificar que el formulario sea válido
      if (currentStepValue === 1 && !this.isFormValid()) {
        return;
      }

      // Para el paso 2, verificar que hay método de pago seleccionado
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

  onValidationChange(isValid: boolean): void {
    this.isFormValid.set(isValid);
    console.log('Form validation changed:', isValid);
  }

  onDataChange(data: OrderData): void {
    this.orderData.set(data);
    if (data.paymentMethod) {
      this.selectedPaymentMethod.set(data.paymentMethod);
    }
    console.log('Order data changed:', data);
  }

  onPaymentMethodChange(method: OrderData['paymentMethod']): void {
    this.selectedPaymentMethod.set(method);

    const currentData = this.orderData();
    if (currentData) {
      this.orderData.set({
        ...currentData,
        paymentMethod: method
      });
    }

    console.log('Payment method changed:', method);
  }

  onEditCart(): void {
    console.log('Navigating to products for editing cart');
    this.router.navigate(['/products']);
  }

  onFinalizeOrder(): void {
    const data = this.orderData();
    const paymentMethod = this.selectedPaymentMethod();
    const cartItems = this.cartItems();
    const total = this.cartTotal();

    console.log('=== Finalizing Order (Guest User) ===');
    console.log('Order data:', data);
    console.log('Payment method:', paymentMethod);
    console.log('Cart items:', cartItems);
    console.log('Cart total:', total);

    // Validaciones
    if (!data || !paymentMethod) {
      alert('Por favor complete todos los datos requeridos');
      return;
    }

    if (cartItems.length === 0) {
      alert('El carrito está vacío');
      this.router.navigate(['/tienda']);
      return;
    }

    if (total <= 0) {
      alert('Total inválido');
      return;
    }

    const completeOrderData: OrderData = {
      ...data,
      paymentMethod
    };

    this.sendToWhatsApp(completeOrderData, cartItems, total);
  }

  private sendToWhatsApp(orderData: OrderData, cartItems: CartItem[], total: number): void {
    const message = this.buildWhatsAppMessage(orderData, cartItems, total);

    console.log('=== WhatsApp Message ===');
    console.log('Message (raw):', message);

    try {
      // Codificar el mensaje correctamente
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodedMessage}`;

      console.log('WhatsApp URL:', whatsappUrl);
      console.log('URL Length:', whatsappUrl.length);

      // WhatsApp tiene un límite de ~2000 caracteres en la URL
      if (whatsappUrl.length > 2000) {
        console.warn('Message too long, copying to clipboard');
        this.copyToClipboard(message);
        alert('El mensaje es muy largo. Se ha copiado al portapapeles. Por favor, pégalo en WhatsApp.');
        window.open(`https://wa.me/${this.WHATSAPP_NUMBER}`, '_blank');
        return;
      }

      // Abrir WhatsApp con el mensaje
      window.open(whatsappUrl, '_blank');

      // Mostrar mensaje de confirmación y limpiar carrito después de un delay
      setTimeout(() => {
        alert('¡Pedido enviado! Te contactaremos pronto por WhatsApp.');
        this.cartService.clearCart();
        this.router.navigate(['/']);
      }, 2000);

    } catch (error) {
      console.error('Error sending to WhatsApp:', error);
      this.copyToClipboard(message);
      alert('Hubo un error al abrir WhatsApp. El mensaje se ha copiado al portapapeles.');
      window.open(`https://wa.me/${this.WHATSAPP_NUMBER}`, '_blank');
    }
  }  private copyToClipboard(message: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).then(() => {
        alert('Mensaje copiado al portapapeles. Pégalo en WhatsApp.');
      }).catch(err => {
        console.error('Failed to copy message:', err);
      });
    }
  }

  private buildWhatsAppMessage(data: OrderData, items: CartItem[], total: number): string {
    let message = 'NUEVO PEDIDO - MAA Hair Studio\n\n';

    message += 'PRODUCTOS:\n';
    items.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      const brand = item.brand ? ` (${item.brand})` : '';
      message += `${index + 1}. ${item.name}${brand} x${item.quantity} - $${itemTotal.toFixed(2)}\n`;
    });

    message += `\nTOTAL: $${total.toFixed(2)}\n\n`;

    message += 'DATOS DEL CLIENTE:\n';
    message += `Nombre: ${data.firstName} ${data.lastName}\n`;
    message += `Email: ${data.email}\n`;
    message += `Telefono: ${data.phone}\n\n`;

    message += 'DIRECCION DE ENTREGA:\n';
    message += `Direccion: ${data.address}\n`;
    message += `Ciudad: ${data.city}\n`;
    message += `Codigo Postal: ${data.postalCode}\n\n`;

    message += `METODO DE PAGO: ${this.getPaymentMethodText(data.paymentMethod)}\n`;

    if (data.notes?.trim()) {
      message += `\nNotas: ${data.notes}\n`;
    }

    message += '\nGracias por tu pedido!';

    return message;
  }

  private getPaymentMethodText(method: OrderData['paymentMethod']): string {
    const paymentMethods: Record<OrderData['paymentMethod'], string> = {
      'mercadopago-card': 'Tarjeta de Crédito/Débito (Mercado Pago)',
      'mercadopago': 'Mercado Pago',
      'transfer': 'Transferencia Bancaria',
      'cash': 'Efectivo en la entrega'
    };

    return paymentMethods[method] || 'No especificado';
  }
}
