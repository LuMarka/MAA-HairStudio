import { Component, signal, inject, ChangeDetectionStrategy, computed, OnInit, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cartOld.service';
import { CommonModule } from '@angular/common';

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
  deliveryOption: 'pickup' | 'delivery';
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  paymentMethod: 'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card';
}

@Component({
  selector: 'app-purchase-order-template',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './purchase-order-template.html',
  styleUrl: './purchase-order-template.scss'
})
export class PurchaseOrderTemplate implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly currentStep = signal(1);
  readonly totalSteps = signal(3);
  readonly orderData = signal<OrderData | null>(null);
  readonly selectedPaymentMethod = signal<OrderData['paymentMethod'] | null>(null);
  readonly selectedDeliveryOption = signal<'pickup' | 'delivery'>('delivery');
  readonly formValid = signal(false);
  readonly orderSent = signal(false);
  readonly isProcessing = signal(false);

private readonly WHATSAPP_NUMBER = '5492616984285';
/*    private readonly WHATSAPP_NUMBER = '5493534015655'; */

  readonly cartItems = computed(() => this.cartService.items());
  readonly cartTotal = computed(() => this.cartService.total());

  readonly deliveryOptionText = computed(() => {
    return this.selectedDeliveryOption() === 'pickup' ? 'Retiro en tienda' : 'Envío a domicilio';
  });

  // Computed for selected payment method text
  readonly selectedPaymentMethodText = computed(() => {
    const method = this.selectedPaymentMethod();
    return method ? this.getPaymentMethodText(method) : '';
  });

  // Reactive form
  readonly orderForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    address: [''],
    city: [''],
    postalCode: [''],
    notes: ['']
  });

  readonly isStep1Valid = computed(() => {
    return this.formValid();
  });

  readonly isOrderComplete = computed(() => {
    const data = this.orderData();
    const paymentMethod = this.selectedPaymentMethod();
    return data !== null && paymentMethod !== null && this.isStep1Valid();
  });

  constructor() {
    // Effect para actualizar la validación del formulario
    effect(() => {
      const deliveryOption = this.selectedDeliveryOption();
      this.updateFormValidators(deliveryOption);
      this.checkFormValidity();
    });
  }

  ngOnInit(): void {
    // Get delivery option from query params
    this.route.queryParams.subscribe(params => {
      const deliveryOption = params['deliveryOption'] as 'pickup' | 'delivery';
      if (deliveryOption) {
        this.selectedDeliveryOption.set(deliveryOption);
      }
    });

    // Check if cart is empty
    if (this.cartItems().length === 0) {
      this.router.navigate(['/cart']);
    }

    // Subscribe to form changes
    this.orderForm.valueChanges.subscribe(() => {
      this.checkFormValidity();
      this.updateOrderData();
    });

    // Subscribe to form status changes
    this.orderForm.statusChanges.subscribe(() => {
      this.checkFormValidity();
    });

    // Initial validation check
    this.updateFormValidators(this.selectedDeliveryOption());
    this.checkFormValidity();
  }

  private updateFormValidators(deliveryOption: 'pickup' | 'delivery'): void {
    const addressControl = this.orderForm.get('address');
    const cityControl = this.orderForm.get('city');

    if (deliveryOption === 'delivery') {
      addressControl?.setValidators([Validators.required]);
      cityControl?.setValidators([Validators.required]);
    } else {
      addressControl?.clearValidators();
      cityControl?.clearValidators();
    }

    addressControl?.updateValueAndValidity({ emitEvent: false });
    cityControl?.updateValueAndValidity({ emitEvent: false });
  }

  private checkFormValidity(): void {
    const form = this.orderForm;
    const deliveryOption = this.selectedDeliveryOption();

    // Check basic required fields
    const firstNameValid = form.get('firstName')?.valid ?? false;
    const lastNameValid = form.get('lastName')?.valid ?? false;
    const emailValid = form.get('email')?.valid ?? false;
    const phoneValid = form.get('phone')?.valid ?? false;

    let isValid = firstNameValid && lastNameValid && emailValid && phoneValid;

    // For delivery, also check address fields
    if (deliveryOption === 'delivery') {
      const addressValid = form.get('address')?.valid ?? false;
      const cityValid = form.get('city')?.valid ?? false;
      isValid = isValid && addressValid && cityValid;
    }

    this.formValid.set(isValid);
  }

  private updateOrderData(): void {
    if (this.isStep1Valid()) {
      const formValue = this.orderForm.value;
      this.orderData.set({
        firstName: formValue.firstName || '',
        lastName: formValue.lastName || '',
        email: formValue.email || '',
        phone: formValue.phone || '',
        deliveryOption: this.selectedDeliveryOption(),
        address: formValue.address || '',
        city: formValue.city || '',
        postalCode: formValue.postalCode || '',
        notes: formValue.notes || '',
        paymentMethod: 'cash'
      } as OrderData);
    }
  }

  onNextStep(): void {
    const currentStepValue = this.currentStep();

    if (currentStepValue < this.totalSteps()) {
      // Step 1: Validate form
      if (currentStepValue === 1) {
        this.orderForm.markAllAsTouched();
        this.checkFormValidity();

        if (!this.isStep1Valid()) {
          return;
        }
      }

      // Step 2: Validate payment method
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

  onPaymentMethodChange(method: OrderData['paymentMethod']): void {
    this.selectedPaymentMethod.set(method);

    const currentData = this.orderData();
    if (currentData) {
      this.orderData.set({
        ...currentData,
        paymentMethod: method
      });
    }
  }

  onEditCart(): void {
    this.router.navigate(['/cart']);
  }

  // Form helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.orderForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.orderForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const fieldLabels: Record<string, string> = {
          firstName: 'El nombre',
          lastName: 'El apellido',
          email: 'El email',
          phone: 'El teléfono',
          address: 'La dirección',
          city: 'La ciudad'
        };
        return `${fieldLabels[fieldName] || 'Este campo'} es requerido`;
      }
      if (field.errors['email']) {
        return 'Ingresa un email válido';
      }
    }
    return '';
  }

  // Private method for payment method text (no null handling needed)
  private getPaymentMethodText(method: OrderData['paymentMethod']): string {
    const paymentMethods: Record<OrderData['paymentMethod'], string> = {
      'mercadopago-card': 'Tarjeta de Crédito/Débito (Mercado Pago)',
      'mercadopago': 'Mercado Pago',
      'transfer': 'Transferencia Bancaria',
      'cash': 'Efectivo en la entrega'
    };

    return paymentMethods[method] || 'No especificado';
  }

  onFinalizeOrder(): void {
    const data = this.orderData();
    const paymentMethod = this.selectedPaymentMethod();
    const cartItems = this.cartItems();
    const total = this.cartTotal();

    if (!data || !paymentMethod) {
      alert('Por favor complete todos los datos requeridos');
      return;
    }

    if (cartItems.length === 0) {
      alert('El carrito está vacío');
      this.router.navigate(['/cart']);
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

    this.isProcessing.set(true);
    this.sendToWhatsApp(completeOrderData, cartItems, total);
  }

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

  private handleOrderSuccess(): void {
    this.isProcessing.set(false);
    this.orderSent.set(true);
    this.cartService.clearCart();

    // Auto redirect after 5 seconds
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 15000);
  }

  onBackToHome(): void {
    this.router.navigate(['/']);
  }

  private copyToClipboard(message: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).then(() => {
        console.log('Message copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy message:', err);
      });
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
}
