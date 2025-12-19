import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  CreatePreferenceResponse,
  GetPaymentByOrderResponse,
  CreatePreferenceDto
} from '../models/interfaces/payment.interface';
import type { OrderData } from '../models/interfaces/order.interface';

/**
 * Servicio para gestión de pagos con Mercado Pago
 *
 * Maneja todas las operaciones de pagos incluyendo:
 * - Crear preferencias de pago
 * - Consultar estado de pagos
 * - Redirigir a Mercado Pago
 *
 * @example
 * ```typescript
 * const paymentService = inject(PaymentService);
 *
 * // Crear preferencia y redirigir
 * paymentService.createPreference(orderId).subscribe(response => {
 *   if (response.success) {
 *     window.location.href = response.data.sandboxInitPoint;
 *   }
 * });
 *
 * // Consultar estado
 * paymentService.getPaymentByOrder(orderId).subscribe(payment => {
 *   console.log('Estado del pago:', payment.data.status);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}payments`;

  // ========== SIGNALS - Estado ==========
  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  // ========== COMPUTED - Estado público ==========
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  // ========== MÉTODOS PÚBLICOS ==========

  /**
   * Crea una preferencia de pago en Mercado Pago
   *
   * @param orderId - ID de la orden
   * @returns Observable con la respuesta que incluye initPoint
   */
  createPreference(orderId: string): Observable<CreatePreferenceResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    const dto: CreatePreferenceDto = { orderId };

    return this.http.post<CreatePreferenceResponse>(`${this.apiUrl}/create-preference`, dto).pipe(
      tap((response) => {
        console.log('✅ Preferencia creada:', response.data.preferenceId);
      }),
      catchError((error: HttpErrorResponse) =>
        this.handleError(error, 'crear preferencia de pago')
      ),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene el estado del pago de una orden
   *
   * @param orderId - ID de la orden
   * @returns Observable con el estado del pago
   */
  getPaymentByOrder(orderId: string): Observable<GetPaymentByOrderResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<GetPaymentByOrderResponse>(`${this.apiUrl}/order/${orderId}`).pipe(
      tap((response) => {
        if (response.data) {
          console.log('✅ Estado del pago:', response.data.status);
        }
      }),
      catchError((error: HttpErrorResponse) =>
        this.handleError(error, 'obtener estado del pago')
      ),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Redirige a Mercado Pago para completar el pago
   *
   * @param initPoint - URL de Mercado Pago
   * @param useSandbox - Si usar sandbox (true) o producción (false)
   */
  redirectToMercadoPago(initPoint: string, sandboxInitPoint: string, useSandbox = true): void {
    const url = useSandbox ? sandboxInitPoint : initPoint;
    window.location.href = url;
  }

  /**
   * Limpia el mensaje de error
   */
  clearError(): void {
    this._errorMessage.set(null);
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Maneja errores HTTP de forma centralizada
   */
  private handleError(error: HttpErrorResponse, action: string): Observable<never> {
    let errorMessage = `Error al ${action}`;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `${errorMessage}. Código: ${error.status}`;
    }

    this._errorMessage.set(errorMessage);
    console.error(`❌ ${errorMessage}`, error);

    return throwError(() => error);
  }

}
