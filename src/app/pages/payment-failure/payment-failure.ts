import {
  Component,
  OnInit,
  signal,
  inject,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
 * - Auto-cleanup robusto con Subject
 */
@Component({
  selector: 'app-payment-failure',
  templateUrl: './payment-failure.html',
  styleUrls: ['./payment-failure.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class PaymentFailure implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);

  protected readonly _orderId = signal<string | null>(null);
  protected readonly _paymentId = signal<string | null>(null);
  protected readonly _paymentStatus = signal<PaymentStatusType | null>(null);
  protected readonly _isLoading = signal(true);

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.extractOrderId();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extractOrderId(): void {
    // 1️⃣ Intentar obtener del snapshot (route params)
    let orderId = this.route.snapshot.params['id'];

    // 2️⃣ Si no existe, intentar desde queryParams
    if (!orderId) {
      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe((params) => {
          orderId = params['order_id'] || params['order'];
          this.processOrderId(orderId);
        });
    } else {
      // 3️⃣ Si ya tenemos el ID, procesar inmediatamente
      this.processOrderId(orderId);
    }
  }

  private processOrderId(orderId: string | null): void {
    if (!orderId) {
      this._orderId.set(null);
      this._isLoading.set(false);
      return;
    }

    console.log('📦 Order ID encontrado:', orderId);
    this._orderId.set(orderId);

    // ✅ Verificar estado real del pago en backend
    this.verifyPaymentStatus(orderId);
  }

  private verifyPaymentStatus(orderId: string): void {
    this.paymentService
      .verifyPayment(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
