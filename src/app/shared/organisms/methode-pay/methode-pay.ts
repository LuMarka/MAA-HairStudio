import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Organismo para la selección del método de pago (Paso 2)
 * 
 * @responsibility Gestionar la selección del método de pago y mostrar resumen del pedido
 * @input orderData - Datos del pedido del paso anterior
 * @input selectedPaymentMethod - Método de pago actualmente seleccionado
 * @input selectedDeliveryOption - Tipo de entrega ('pickup' | 'delivery')
 * @input cartItems - Items del carrito para mostrar en resumen
 * @input subtotal - Subtotal sin IVA
 * @input ivaAmount - Monto del IVA (21%)
 * @input totalWithIva - Total final con IVA
 * @output paymentMethodChange - Emite cuando cambia el método de pago seleccionado
 * @output previousStep - Emite cuando se presiona volver
 * @output nextStep - Emite cuando se presiona continuar (con método seleccionado)
 */
@Component({
  selector: 'app-methode-pay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './methode-pay.html',
  styleUrl: './methode-pay.scss'
})
export class MethodePay {
  // ========== INPUTS ==========
  readonly orderData = input<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    deliveryOption: 'pickup' | 'delivery';
    address?: string;
    city?: string;
    postalCode?: string;
    notes?: string;
  } | null>(null);

  readonly selectedPaymentMethod = input<'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card' | null>(null);
  readonly selectedDeliveryOption = input.required<'pickup' | 'delivery'>();
  
  readonly cartItems = input<Array<{
    id: string;
    name: string;
    brand?: string;
    quantity: number;
    price: number;
  }>>([]);

  readonly subtotal = input.required<number>();
  readonly ivaAmount = input.required<number>();
  readonly totalWithIva = input.required<number>();

  // ========== OUTPUTS ==========
  readonly paymentMethodChange = output<'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card'>();
  readonly previousStep = output<void>();
  readonly nextStep = output<void>();

  // ========== COMPUTED ==========
  readonly selectedPaymentMethodText = computed(() => {
    const method = this.selectedPaymentMethod();
    if (!method) return '';

    const paymentMethods: Record<typeof method, string> = {
      'mercadopago-card': 'Tarjeta de Crédito/Débito (Mercado Pago)',
      'mercadopago': 'Mercado Pago',
      'transfer': 'Transferencia Bancaria',
      'cash': 'Efectivo en la entrega'
    };

    return paymentMethods[method] || 'No especificado';
  });

  readonly canContinue = computed(() => {
    return this.selectedPaymentMethod() !== null;
  });

  readonly deliveryText = computed(() => {
    return this.selectedDeliveryOption() === 'pickup' ? 'Retiro en tienda' : 'Envío a domicilio';
  });

  // ========== MÉTODOS PÚBLICOS ==========
  onPaymentMethodChange(method: 'transfer' | 'cash' | 'mercadopago' | 'mercadopago-card'): void {
    this.paymentMethodChange.emit(method);
  }

  onPreviousStep(): void {
    this.previousStep.emit();
  }

  onNextStep(): void {
    if (!this.canContinue()) {
      return;
    }
    this.nextStep.emit();
  }

  // ========== HELPERS ==========
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(price);
  }

  getPaymentMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      'cash': '💵',
      'transfer': '🏦',
      'mercadopago': '💳',
      'mercadopago-card': '💳'
    };
    return icons[method] || '💳';
  }

  getPaymentMethodTitle(method: string): string {
    const titles: Record<string, string> = {
      'cash': 'Efectivo',
      'transfer': 'Transferencia bancaria',
      'mercadopago': 'Mercado Pago',
      'mercadopago-card': 'Tarjeta (Mercado Pago)'
    };
    return titles[method] || 'Método de pago';
  }

  getPaymentMethodSubtitle(method: string): string {
    const deliveryOption = this.selectedDeliveryOption();
    
    const subtitles: Record<string, string> = {
      'cash': deliveryOption === 'delivery' 
        ? 'Paga al momento de la entrega' 
        : 'Paga al momento del retiro',
      'transfer': 'Te enviaremos los datos bancarios',
      'mercadopago': 'Pago online seguro',
      'mercadopago-card': 'Crédito o débito'
    };
    
    return subtitles[method] || '';
  }
}
