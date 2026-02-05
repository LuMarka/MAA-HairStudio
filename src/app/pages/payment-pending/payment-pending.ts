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
import { PaymentService } from '../../core/services/payment.service';

type PaymentStatusType =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'in_process'
  | 'cancelled';

/**
 * Componente para mostrar estado de pago pendiente
 *
 * @responsibility Mostrar estado de pago en proceso e implementar polling automático
 * @features
 * - Implementa polling automático cada 1 segundo (como sugiere backend)
 * - Máximo 30 intentos (30 segundos)
 * - Redirige a success cuando el pago se aprueba
 * - Redirige a failure cuando el pago es rechazado
 * - Auto-cleanup de polling al destruir componente
 * - Muestra información de seguimiento del pago
 */
@Component({
  selector: 'app-payment-pending',
  templateUrl: './payment-pending.html',
  styleUrls: ['./payment-pending.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class PaymentPending implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);

  protected readonly _orderId = signal<string | null>(null);
  protected readonly _paymentId = signal<string | null>(null);
  protected readonly _paymentStatus = signal<PaymentStatusType | null>(null);
  protected readonly _isPolling = signal(true);
  protected readonly _pollingAttempts = signal(0);
  protected readonly _statusMessage = signal('Procesando pago...');

  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_ATTEMPTS = 60; // 60 segundos máximo (1 intento por segundo)

  ngOnInit(): void {
    // Usar snapshot params primero, luego fallback a queryParams
    const orderId =
      this.route.snapshot.params['id'] ||
      this.route.snapshot.queryParams['order_id'] ||
      this.route.snapshot.queryParams['order'];

    if (!orderId) {
      this._orderId.set(null);
      this._isPolling.set(false);
      return;
    }

    this._orderId.set(orderId);

    // ✅ Iniciar polling inmediatamente como sugiere backend
    this.startPollingPaymentStatus(orderId);
  }

  ngOnDestroy(): void {
    // Limpiar polling al destruir componente
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private startPollingPaymentStatus(orderId: string): void {
    let attempts = 0;

    this.pollingInterval = setInterval(() => {
      this.paymentService.verifyPayment(orderId).subscribe({
        next: (response) => {
          attempts++;
          this._pollingAttempts.set(attempts);

          // Verificar si el pago fue encontrado
          if (!response.success || !response.status) {
            this._statusMessage.set(`⏳ Esperando confirmación... (${attempts}s)`);
            if (attempts >= this.MAX_ATTEMPTS) {
              if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
              }
              this._isPolling.set(false);
              this._statusMessage.set('⏳ El pago está siendo procesado. Por favor, vuelva más tarde.');
            }
            return;
          }

          this._paymentStatus.set(response.status);
          this._paymentId.set(response.data?.id ?? null);

          if (response.status === 'approved') {
            // ✅ Pago aprobado
            if (this.pollingInterval) {
              clearInterval(this.pollingInterval);
            }
            this._isPolling.set(false);
            console.log('✅ Pago aprobado, redirigiendo a success');

            this.router.navigate(['/payment/success'], {
              queryParams: { order_id: orderId }
            });
          } else if (
            response.status === 'rejected' ||
            response.status === 'cancelled'
          ) {
            // ❌ Pago rechazado
            if (this.pollingInterval) {
              clearInterval(this.pollingInterval);
            }
            this._isPolling.set(false);
            console.error('❌ Pago rechazado, redirigiendo a failure');

            this.router.navigate(['/payment/failure'], {
              queryParams: { order_id: orderId }
            });
          } else if (
            response.status === 'pending' ||
            response.status === 'in_process'
          ) {
            // ⏳ Pago aún pendiente, continuar polling
            this._statusMessage.set(`⏳ Procesando pago... (${attempts}s)`);

            // Si alcanzamos máximo de intentos
            if (attempts >= this.MAX_ATTEMPTS) {
              if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
              }
              this._isPolling.set(false);
              this._statusMessage.set(
                '⏳ El pago está siendo procesado. Por favor, vuelva más tarde.'
              );
              console.log(
                '⏳ Polling expirado después de 30 intentos (30 segundos)'
              );
            }
          }
        },
        error: (error) => {
          attempts++;
          this._pollingAttempts.set(attempts);
          console.error('⚠️ Error durante polling:', error);

          // Si alcanzamos máximo de intentos
          if (attempts >= this.MAX_ATTEMPTS) {
            if (this.pollingInterval) {
              clearInterval(this.pollingInterval);
            }
            this._isPolling.set(false);
            this._statusMessage.set('Error al verificar el pago');
            console.error('❌ Polling finalizado después de máximo de intentos');
          }
        }
      });
    }, 1000); // Polling cada 1 segundo (como sugiere backend)
  }

  protected goToOrders(): void {
    this.router.navigate(['/order-me']);
  }

  protected goToHome(): void {
    this.router.navigate(['/']);
  }
}
