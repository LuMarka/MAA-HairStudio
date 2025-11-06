import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PurchaseOrderHeader } from '../../organisms/purchase-order-header/purchase-order-header';
import { PurchaseOrderForm } from '../../organisms/purchase-order-form/purchase-order-form';
import { PurchaseOrderSummary } from '../../organisms/purchase-order-summary/purchase-order-summary';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-purchase-order-template',
  imports: [
    PurchaseOrderHeader,
    PurchaseOrderForm,
    PurchaseOrderSummary
  ],
  templateUrl: './purchase-order-template.html',
  styleUrl: './purchase-order-template.scss'
})
export class PurchaseOrderTemplate {
  private cartService = inject(CartService);
  private router = inject(Router);

  // Señales para el estado del formulario
  currentStep = signal(1);
  totalSteps = signal(3);
  isFormValid = signal(false);
  orderData = signal<any>(null);

  // WhatsApp de MAA Hair Studio (sin el símbolo +)
  private readonly WHATSAPP_NUMBER = '5493534015655';

  // Métodos para manejar la navegación del stepper
  onNextStep() {
    const currentStepValue = this.currentStep();
    const data = this.orderData();

    console.log('=== onNextStep ===');
    console.log('Current step:', currentStepValue);
    console.log('Order data:', data);

    // PASO 2: Al terminar de seleccionar método de pago
    if (currentStepValue === 2) {
      // Si es transferencia o efectivo, ir al paso 3 (confirmación)
      if (data?.paymentMethod === 'transfer' || data?.paymentMethod === 'cash') {
        this.currentStep.update(step => step + 1);
        return;
      }

      // Si es Mercado Pago, también ir al paso 3
      if (data?.paymentMethod === 'mercadopago' || data?.paymentMethod === 'mercadopago-card') {
        this.currentStep.update(step => step + 1);
        return;
      }
    }

    // PASO 3: Botón "Finalizar Pedido"
    if (currentStepValue === 3) {
      this.finalizeOrder(data);
      return;
    }

    // Avanzar al siguiente paso normalmente
    if (currentStepValue < this.totalSteps()) {
      this.currentStep.update(step => step + 1);
    }
  }

  onPreviousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  onFormValidation(isValid: boolean) {
    this.isFormValid.set(isValid);
  }

  onOrderDataChange(data: any) {
    this.orderData.set(data);
  }

  /**
   * Finalizar el pedido según el método de pago seleccionado
   */
  private finalizeOrder(data: any) {
    console.log('=== Finalizing Order ===');
    console.log('Payment method:', data?.paymentMethod);

    const paymentMethod = data?.paymentMethod;

    // Transferencia o Efectivo: Redirigir a WhatsApp
    if (paymentMethod === 'transfer' || paymentMethod === 'cash') {
      this.redirectToWhatsApp(data);
      return;
    }

    // Mercado Pago: Iniciar flujo de pago
    if (paymentMethod === 'mercadopago' || paymentMethod === 'mercadopago-card') {
      this.initializeMercadoPago(data);
      return;
    }

    // Fallback: si no se reconoce el método, ir a WhatsApp
    console.warn('Payment method not recognized, redirecting to WhatsApp');
    this.redirectToWhatsApp(data);
  }

  /**
   * Redirigir a WhatsApp con los detalles del pedido
   */
  private redirectToWhatsApp(data: any) {
    const cartItems = this.cartService.items();
    const subtotal = this.cartService.subtotal();

    // Construir mensaje ultra-simple que funcione
    let message = 'Hola! Me gustaria realizar un pedido:%0A%0A';

    // Productos
    message += `PRODUCTOS (${cartItems.length}):%0A`;
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}%0A`;
    });

    message += `%0ATOTAL: $${subtotal.toFixed(2)}%0A%0A`;

    // Datos del cliente
    message += `DATOS:%0A`;
    message += `${data.firstName || ''} ${data.lastName || ''}%0A`;
    message += `${data.email || ''}%0A`;
    message += `${data.phone || ''}%0A%0A`;

    // Dirección
    message += `DIRECCION:%0A`;
    message += `${data.address || ''}%0A`;
    message += `${data.city || ''} - CP: ${data.postalCode || ''}%0A%0A`;

    // Método de pago
    const paymentText = data.paymentMethod === 'transfer' ? 'Transferencia'
      : data.paymentMethod === 'cash' ? 'Efectivo (Contra Entrega)'
      : 'Mercado Pago';
    message += `PAGO: ${paymentText}`;

    const whatsappUrl = `https://wa.me/${this.WHATSAPP_NUMBER}?text=${message}`;

    console.log('Redirecting to WhatsApp');
    console.log('URL length:', whatsappUrl.length);

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');

    // Limpiar carrito después de 2 segundos
    setTimeout(() => {
      this.cartService.clearCart();
      this.router.navigate(['/']);
    }, 2000);
  }

  /**
   * Inicializar el flujo de pago con Mercado Pago
   * TODO: Implementar integración completa con Mercado Pago SDK
   */
  private initializeMercadoPago(data: any) {
    console.log('=== Initializing Mercado Pago ===');

    const cartItems = this.cartService.items();
    const subtotal = this.cartService.subtotal();

    // PASO 1: Crear la preferencia de pago
    const orderData = {
      items: cartItems.map(item => ({
        id: item.id,
        title: item.name,
        description: item.description || item.brand,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'ARS' // Peso argentino
      })),
      payer: {
        name: data.firstName,
        surname: data.lastName,
        email: data.email,
        phone: {
          number: data.phone
        },
        address: {
          street_name: data.address,
          zip_code: data.postalCode,
          city_name: data.city
        }
      },
      back_urls: {
        success: `${window.location.origin}/checkout/success`,
        failure: `${window.location.origin}/checkout/failure`,
        pending: `${window.location.origin}/checkout/pending`
      },
      auto_return: 'approved',
      notification_url: 'YOUR_BACKEND_WEBHOOK_URL' // URL de tu backend para recibir notificaciones
    };

    console.log('Order data for Mercado Pago:', orderData);

    // PASO 2: Llamar a tu backend para crear la preferencia
    // Por ahora, redirigir a WhatsApp como fallback
    alert(`
      🔧 Integración de Mercado Pago pendiente

      Para implementar Mercado Pago necesitas:

      1. Crear cuenta en Mercado Pago Developers
      2. Obtener tus credenciales (Public Key y Access Token)
      3. Implementar endpoint en tu backend para crear preferencias
      4. Integrar el SDK de Mercado Pago

      Por ahora, te redirigiremos a WhatsApp para completar la compra.
    `);

    this.redirectToWhatsApp(data);

    /*
    // EJEMPLO de implementación futura:

    fetch('YOUR_BACKEND_URL/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(preference => {
      // Redirigir a Mercado Pago
      window.location.href = preference.init_point;
    })
    .catch(error => {
      console.error('Error creating Mercado Pago preference:', error);
      alert('Error al procesar el pago. Por favor, intenta nuevamente.');
    });
    */
  }
}
