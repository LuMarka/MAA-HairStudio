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
 * Componente para mostrar estado de pago pendiente
 *
 * @responsibility Mostrar estado de pago en proceso e implementar polling automático
 * @features
 * - Implementa polling automático cada 2 segundos
 * - Máximo 30 intentos (60 segundos)
 * - Redirige a success cuando el pago se aprueba
 * - Redirige a failure cuando el pago es rechazado
 * - Auto-cleanup robusto con Subject
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
  private readonly destroy$ = new Subject<void>();
  private readonly MAX_ATTEMPTS = 30; // 30 intentos * 2 segundos = 60 segundos

  ngOnInit(): void {
    this.extractOrderId();
  }

  ngOnDestroy(): void {
    // ✅ Limpiar recursos (polling + observables)
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
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
      this._isPolling.set(false);
      return;
    }

    console.log('📦 Order ID encontrado:', orderId);
    this._orderId.set(orderId);

    // ✅ Iniciar polling inmediatamente
    this.startPollingPaymentStatus(orderId);
  }

  private startPollingPaymentStatus(orderId: string): void {
    console.log('⏳ Iniciando polling cada 2 segundos...');

    // Verificar inmediatamente (no esperar 2 segundos)
    this.verifyPaymentStatus(orderId);

    // Luego verificar cada 2 segundos durante 60 segundos máximo
    let attempts = 0;
    const maxAttempts = this.MAX_ATTEMPTS;

    this.pollingInterval = setInterval(() => {
      attempts++;

      if (attempts >= maxAttempts) {
        clearInterval(this.pollingInterval!);
        this._statusMessage.set('⏱️ Timeout: El pago tardó demasiado en procesarse');
        this._isPolling.set(false);
        return;
      }

      this.verifyPaymentStatus(orderId);
    }, 2000);
  }

  private verifyPaymentStatus(orderId: string): void {
    this.paymentService
      .verifyPayment(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const currentAttempts = this._pollingAttempts() + 1;
          this._pollingAttempts.set(currentAttempts);
          this._paymentStatus.set(response.status);
          this._paymentId.set(response.data.id);

          if (response.status === 'approved') {
            // ✅ PAGO APROBADO
            console.log('✅ ¡Pago aprobado!');
            if (this.pollingInterval) {
              clearInterval(this.pollingInterval);
            }
            this._isPolling.set(false);
            this._statusMessage.set('✅ ¡Tu pago fue aprobado exitosamente!');
            console.log('✅ Pago aprobado, redirigiendo a success');

            setTimeout(() => {
              this.router.navigate(['/payment-success'], {
                queryParams: { order_id: orderId }
              });
            }, 2000);
          } else if (
            response.status === 'rejected' ||
            response.status === 'cancelled'
          ) {
            // ❌ PAGO RECHAZADO
            console.log('❌ Pago rechazado');
            if (this.pollingInterval) {
              clearInterval(this.pollingInterval);
            }
            this._isPolling.set(false);
            this._statusMessage.set('❌ Tu pago fue rechazado. Por favor intenta de nuevo.');
            console.error('❌ Pago rechazado, redirigiendo a failure');

            setTimeout(() => {
              this.router.navigate(['/payment-failure'], {
                queryParams: { order_id: orderId }
              });
            }, 2000);
          } else if (
            response.status === 'pending' ||
            response.status === 'in_process'
          ) {
            // ⏳ PENDIENTE
            console.log('⏳ Pago en proceso...');
            this._statusMessage.set(`⏳ Tu pago está siendo procesado. Por favor espera... (${currentAttempts * 2}s)`);
          }
        },
        error: (error) => {
          console.error('❌ Error verificando pago:', error);
          this._statusMessage.set('❌ Error al verificar el estado del pago. Reintentando...');
          // El polling continuará reintentando
        }
      });
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
