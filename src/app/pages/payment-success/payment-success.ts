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
 * Componente para mostrar el estado de pago exitoso
 *
 * @responsibility Verificar pago, mostrar confirmación, e implementar polling para estados pending
 * @features
 * - Verifica estado real del pago con backend
 * - Implementa polling automático cada 2 segundos
 * - Máximo 30 intentos (60 segundos)
 * - Redirige a órdenes cuando se confirma el pago
 * - Manejo de errores y estados rechazados
 * - Auto-cleanup robusto con Subject
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
      this._errorMessage.set('❌ Parámetros de pago inválidos');
      this._isLoading.set(false);
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
        this._errorMessage.set('⏱️ Timeout: El pago tardó demasiado en procesarse');
        this._isLoading.set(false);
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
            this._isLoading.set(false);
            this._errorMessage.set(null);
            console.log('✅ Pago confirmado, redirigiendo a órdenes');

            setTimeout(() => {
              this.router.navigate(['/order-me']);
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
            this._isLoading.set(false);
            this._errorMessage.set(
              `❌ Pago ${
                response.status === 'rejected' ? 'rechazado' : 'cancelado'
              }`
            );
          } else if (
            response.status === 'pending' ||
            response.status === 'in_process'
          ) {
            // ⏳ PENDIENTE
            console.log('⏳ Pago en proceso...');
            this._isLoading.set(true);
            this._errorMessage.set(
              `⏳ Tu pago está siendo procesado. Por favor espera... (${currentAttempts * 2}s)`
            );
          }
        },
        error: (error) => {
          console.error('❌ Error verificando pago:', error);
          this._errorMessage.set('❌ Error al verificar el estado del pago. Reintentando...');
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
