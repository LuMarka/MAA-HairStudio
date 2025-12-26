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
 * Componente para mostrar el estado de pago exitoso
 *
 * @responsibility Verificar pago, mostrar confirmación, e implementar polling para estados pending
 * @features
 * - Verifica estado real del pago con backend
 * - Implementa polling automático cada 1 segundo (como sugiere backend)
 * - Máximo 30 intentos (30 segundos)
 * - Redirige a órdenes cuando se confirma el pago
 * - Manejo de errores y estados rechazados
 * - Auto-cleanup de polling al destruir componente
 */
@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.html',
  styleUrls: ['./payment-success.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class PaymentSuccess implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);

  protected readonly _isLoading = signal(true);
  protected readonly _orderId = signal<string | null>(null);
  protected readonly _paymentId = signal<string | null>(null);
  protected readonly _errorMessage = signal<string | null>(null);
  protected readonly _paymentStatus = signal<PaymentStatusType | null>(null);
  protected readonly _pollingAttempts = signal(0);

  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_ATTEMPTS = 30; // 30 segundos máximo (1 intento por segundo)

  ngOnInit(): void {
    this.route.snapshot.params['id'] || this.route.queryParams.subscribe((params) => {
      // Mercado Pago envía 'order_id' como parámetro
      const orderId = this.route.snapshot.params['id'] || params['order_id'] || params['order'];

      if (!orderId) {
        this._errorMessage.set('Parámetros de pago inválidos');
        this._isLoading.set(false);
        return;
      }

      this._orderId.set(orderId);

      // ✅ Iniciar polling inmediatamente como sugiere backend
      this.startPollingPaymentStatus(orderId);
    });
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
          this._paymentStatus.set(response.status);
          this._paymentId.set(response.data.id);

          if (response.status === 'approved') {
            // ✅ Pago aprobado
            if (this.pollingInterval) {
              clearInterval(this.pollingInterval);
            }
            this._isLoading.set(false);
            this._errorMessage.set(null);
            console.log('✅ Pago confirmado, redirigiendo a órdenes en 2 segundos');

            setTimeout(() => {
              this.router.navigate(['/orders', orderId]);
            }, 2000);
          } else if (
            response.status === 'pending' ||
            response.status === 'in_process'
          ) {
            // ⏳ Pago pendiente, continuar polling
            this._isLoading.set(true);
            this._errorMessage.set(
              `⏳ Procesando pago... (${attempts}s)`
            );

            // Si alcanzamos máximo de intentos
            if (attempts >= this.MAX_ATTEMPTS) {
              if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
              }
              this._isLoading.set(false);
              this._errorMessage.set(
                '⏳ El pago está siendo procesado. Por favor, vuelva más tarde.'
              );
              console.log(
                '⏳ Polling expirado después de 30 intentos (30 segundos)'
              );
            }
          } else if (
            response.status === 'rejected' ||
            response.status === 'cancelled'
          ) {
            // ❌ Pago rechazado
            if (this.pollingInterval) {
              clearInterval(this.pollingInterval);
            }
            this._isLoading.set(false);
            this._errorMessage.set(
              `❌ Pago ${
                response.status === 'rejected' ? 'rechazado' : 'cancelado'
              }`
            );
            console.error('❌ Pago rechazado o cancelado');
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
            this._isLoading.set(false);
            this._errorMessage.set('Error al verificar el pago');
            console.error('❌ Polling finalizado después de máximo de intentos');
          }
        }
      });
    }, 1000); // Polling cada 1 segundo (como sugiere backend)
  }

  protected goToOrders(): void {
    const orderId = this._orderId();
    if (orderId) {
      this.router.navigate(['/orders', orderId]);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  protected goToHome(): void {
    this.router.navigate(['/']);
  }
}
