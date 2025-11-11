import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.scss'
})
export class OrderConfirmation {
  orderData = input<any>(null);

  getPaymentMethodText(): string {
    const method = this.orderData()?.paymentMethod;
    console.log('Payment method in confirmation:', method);

    switch (method) {
      case 'mercadopago-card':
        return 'Tarjeta de Crédito/Débito (Mercado Pago)';
      case 'mercadopago':
        return 'Mercado Pago';
      case 'transfer':
        return 'Transferencia Bancaria';
      case 'cash':
        return 'Pago en efectivo (contra entrega)';
      default:
        return 'No seleccionado';
    }
  }
}
