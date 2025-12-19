import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../core/services/payment.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.html',
  styleUrls: ['./payment-success.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class PaymentSuccess implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly orderService = inject(OrderService);

  protected readonly _isLoading = signal(true);
  protected readonly _orderId = signal<number | null>(null);
  protected readonly _paymentId = signal<string | null>(null);
  protected readonly _errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const orderId = params['order'];
      const paymentId = params['payment_id'];

      if (!orderId || !paymentId) {
        this._errorMessage.set('Parámetros de pago inválidos');
        this._isLoading.set(false);
        return;
      }

      this._orderId.set(Number(orderId));
      this._paymentId.set(paymentId);

      this.verifyPayment(Number(orderId));
    });
  }

  private verifyPayment(orderId: number): void {
    this.paymentService.getPaymentByOrder(orderId.toString()).subscribe({
      next: (response) => {
        if (response.data?.status === 'approved') {
          this._isLoading.set(false);
        } else {
          this._errorMessage.set('El pago no ha sido aprobado');
          this._isLoading.set(false);
        }
      },
      error: () => {
        this._errorMessage.set('Error al verificar el pago');
        this._isLoading.set(false);
      }
    });
  }

  protected goToOrders(): void {
    this.router.navigate(['/order-me']);
  }

  protected goToHome(): void {
    this.router.navigate(['/']);
  }
}
