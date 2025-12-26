import {
  Component,
  OnInit,
  signal,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../core/services/payment.service';

type PaymentStatusType =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'in_process'
  | 'cancelled';

/**
 * Componente para mostrar estado de pago rechazado
 *
 * @responsibility Mostrar información de pago fallido y permitir reintentos
 * @features
 * - Verifica estado real del pago en backend
 * - Redirige a success si el pago fue aprobado
 * - Redirige a pending si el pago está en proceso
 * - Permite reintentar pago para la misma orden
 */
@Component({
  selector: 'app-payment-failure',
  templateUrl: './payment-failure.html',
  styleUrls: ['./payment-failure.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class PaymentFailure implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);

  protected readonly _orderId = signal<string | null>(null);
  protected readonly _paymentId = signal<string | null>(null);
  protected readonly _paymentStatus = signal<PaymentStatusType | null>(null);
  protected readonly _isLoading = signal(true);

  ngOnInit(): void {
    // Usar snapshot params primero, luego fallback a queryParams
    const orderId =
      this.route.snapshot.params['id'] ||
      this.route.snapshot.queryParams['order_id'] ||
      this.route.snapshot.queryParams['order'];

    if (!orderId) {
      this._orderId.set(null);
      this._isLoading.set(false);
      return;
    }

    this._orderId.set(orderId);

    // ✅ Verificar estado real del pago en backend
    this.verifyPaymentStatus(orderId);
  }

  private verifyPaymentStatus(orderId: string): void {
    this.paymentService.verifyPayment(orderId).subscribe({
      next: (response) => {
        this._paymentStatus.set(response.status);

        if (response.status === 'approved') {
          // ✅ Si se aprobó (webhook llegó antes), redirigir a success
          console.log('✅ Pago aprobado, redirigiendo a success');
          this.router.navigate(['/payment-success'], {
            queryParams: { order_id: orderId }
          });
        } else if (
          response.status === 'pending' ||
          response.status === 'in_process'
        ) {
          // ⏳ Si está pendiente, redirigir a pending
          console.log('⏳ Pago pendiente, redirigiendo a pending');
          this.router.navigate(['/payment-pending'], {
            queryParams: { order_id: orderId }
          });
        } else {
          // ❌ Pago rechazado o cancelado, mantener en failure
          this._isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('⚠️ Error al verificar estado del pago:', error);
        // En caso de error, asumir que fue rechazado
        this._isLoading.set(false);
      }
    });
  }

  protected retryPayment(): void {
    const orderId = this._orderId();
    if (orderId) {
      // ✅ Redirigir a checkout para reintentar pago
      this.router.navigate(['/purchase-order']);
    } else {
      // Si no hay orderId, volver al carrito
      this.router.navigate(['/cart']);
    }
  }

  protected goToHome(): void {
    this.router.navigate(['/']);
  }
}
