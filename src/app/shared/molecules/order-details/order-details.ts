import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './order-details.html',
  styleUrl: './order-details.scss'
})
export class OrderDetails {
  orderData = input<any>(null);

  getPaymentText(): string {
    const method = this.orderData()?.paymentMethod;

    switch (method) {
      case 'mercadopago-card':
        return 'Tarjeta (Mercado Pago)';
      case 'mercadopago':
        return 'Mercado Pago';
      case 'transfer':
        return 'Transferencia';
      case 'cash':
        return 'Efectivo';
      default:
        return 'No seleccionado';
    }
  }
}
