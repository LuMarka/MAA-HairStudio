import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  CreatePreferenceResponse,
  GetPaymentByOrderResponse,
  VerifyPaymentResponse,
  PaymentHistoryResponse,
  PaymentDetailsResponse,
  CreatePreferenceDto,
  SyncPaymentResponse,
  CancelPaymentResponse,
  AdminSearchPaymentsResponse,
  WebhookVerifyPaymentResponse
} from '../models/interfaces/payment.interface';

/**
 * Servicio para gestión de pagos con Mercado Pago
 *
 * Maneja todas las operaciones de pagos incluyendo:
 * - Crear preferencias de pago (1)
 * - Verificar estado de pagos (2)
 * - Obtener historial de pagos (3)
 * - Obtener detalles de un pago (4)
 * - Obtener pago por orden (5)
 * - Sincronizar pago (6)
 * - Cancelar pago (7)
 * - Buscar pagos en MP (admin) (8)
 * - Redirigir a Mercado Pago
 *
 * @example
 * ```typescript
 * const paymentService = inject(PaymentService);
 *
 * // 1️⃣ Crear preferencia y redirigir
 * paymentService.createPreference(orderId).subscribe(response => {
 *   paymentService.redirectToMercadoPago(
 *     response.data.initPoint,
 *     response.data.sandboxInitPoint,
 *     true // sandbox
 *   );
 * });
 *
 * // 2️⃣ Verificar estado del pago
 * paymentService.verifyPayment(orderId).subscribe(payment => {
 *   console.log('Estado:', payment.status);
 * });
 *
 * // 3️⃣ Obtener historial
 * paymentService.getPaymentHistory(1, 10).subscribe(history => {
 *   console.log('Pagos:', history.data);
 * });
 *
 * // 4️⃣ Detalles de un pago
 * paymentService.getPaymentDetails(paymentId).subscribe(details => {
 *   console.log('Detalles:', details.data);
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

  // ========== READONLY SIGNALS - Estado público ==========
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  // ========== MÉTODOS PÚBLICOS ==========

  /**
   * 1️⃣ CREAR PREFERENCE DE PAGO
   *
   * Crea una preferencia de pago en Mercado Pago
   * POST /payments/create-preference
   *
   * @param orderId - ID de la orden
   * @returns Observable con la respuesta que incluye initPoint y sandboxInitPoint
   *
   * @example
   * ```typescript
   * this.paymentService.createPreference(orderId).subscribe(response => {
   *   // Response contiene:
   *   // - paymentId: UUID del pago
   *   // - preferenceId: ID de la preferencia en MP
   *   // - initPoint: URL de producción
   *   // - sandboxInitPoint: URL de sandbox
   * });
   * ```
   */
  createPreference(orderId: string): Observable<CreatePreferenceResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    const dto: CreatePreferenceDto = { orderId };

    return this.http
      .post<CreatePreferenceResponse>(`${this.apiUrl}/create-preference`, dto)
      .pipe(
        tap((response) => {
          console.log('✅ [1️⃣ CREATE-PREFERENCE] Preferencia creada:', {
            preferenceId: response.data.preferenceId,
            paymentId: response.data.paymentId,
            amount: response.data.amount,
            currency: response.data.currency,
            expiresAt: response.data.expiresAt
          });
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'crear preferencia de pago')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * 2️⃣ VERIFICAR ESTADO DEL PAGO (Usar en /success page)
   *
   * Verifica el estado actual del pago
   * GET /payments/verify/:orderId
   *
   * @param orderId - ID de la orden
   * @returns Observable con estado del pago y detalles de la orden
   *
   * @example
   * ```typescript
   * this.paymentService.verifyPayment(orderId).subscribe(response => {
   *   if (response.success) {
   *     // response.status: 'approved' | 'pending' | 'rejected' | 'in_process' | 'cancelled'
   *     // response.order: { id, orderNumber, status, total }
   *     // response.data: detalles completos del pago
   *   } else {
   *     // Pago no encontrado
   *     // response.status: null
   *   }
   * });
   * ```
   */
  verifyPayment(orderId: string): Observable<VerifyPaymentResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .get<VerifyPaymentResponse>(`${this.apiUrl}/verify/${orderId}`)
      .pipe(
        tap((response) => {
          if (response.success && response.order) {
            console.log('✅ [2️⃣ VERIFY] Pago verificado:', {
              status: response.status,
              orderNumber: response.order.orderNumber,
              paymentStatus: response.order.status,
              amount: response.order.total,
              webhookProcessed: response.data?.webhookProcessed
            });
          } else {
            console.log('⚠️ [2️⃣ VERIFY] Pago no encontrado:', response.message);
          }
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'verificar estado del pago')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * 3️⃣ OBTENER HISTORIAL DE PAGOS
   *
   * Obtiene el historial de pagos del usuario autenticado
   * GET /payments/history?page=1&limit=10
   *
   * @param page - Número de página (default: 1)
   * @param limit - Cantidad de pagos por página (default: 10)
   * @returns Observable con lista de pagos y metadata
   *
   * @example
   * ```typescript
   * this.paymentService.getPaymentHistory(1, 10).subscribe(response => {
   *   // response.data: array de pagos
   *   // response.page, response.limit, response.total
   * });
   * ```
   */
  getPaymentHistory(
    page: number = 1,
    limit: number = 10
  ): Observable<PaymentHistoryResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .get<PaymentHistoryResponse>(`${this.apiUrl}/history`, {
        params: { page: page.toString(), limit: limit.toString() }
      })
      .pipe(
        tap((response) => {
          console.log('✅ [3️⃣ HISTORY] Historial obtenido:', {
            total: response.total,
            page: response.page,
            limit: response.limit,
            totalPages: Math.ceil(response.total / response.limit),
            itemsInPage: response.data.length
          });
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'obtener historial de pagos')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * 4️⃣ OBTENER DETALLES DE UN PAGO
   *
   * Obtiene los detalles completos de un pago específico
   * GET /payments/:paymentId
   *
   * @param paymentId - ID del pago
   * @returns Observable con detalles completos del pago (respuesta directa sin wrapper)
   *
   * @example
   * ```typescript
   * this.paymentService.getPaymentDetails(paymentId).subscribe(payment => {
   *   // payment contiene directamente:
   *   // - id, status, statusDetail, amount, currency
   *   // - paymentMethod, mercadoPagoPaymentId
   *   // - webhookProcessed, approvedAt
   *   // - order, transactions
   * });
   * ```
   */
  getPaymentDetails(paymentId: string): Observable<PaymentDetailsResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .get<PaymentDetailsResponse>(`${this.apiUrl}/${paymentId}`)
      .pipe(
        tap((response) => {
          console.log('✅ [4️⃣ DETAILS] Detalles del pago obtenidos:', {
            paymentId: response.id,
            status: response.status,
            statusDetail: response.statusDetail,
            amount: response.amount,
            currency: response.currency,
            paymentMethod: response.paymentMethod,
            webhookProcessed: response.webhookProcessed
          });
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'obtener detalles del pago')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * 5️⃣ OBTENER PAGO POR ORDEN
   *
   * Obtiene el pago asociado a una orden específica
   * GET /payments/order/:orderId
   *
   * @param orderId - ID de la orden
   * @returns Observable con detalles del pago
   *
   * @example
   * ```typescript
   * this.paymentService.getPaymentByOrder(orderId).subscribe(response => {
   *   // response.data contiene: id, status, amount, order, createdAt
   * });
   * ```
   */
  getPaymentByOrder(orderId: string): Observable<GetPaymentByOrderResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .get<GetPaymentByOrderResponse>(`${this.apiUrl}/order/${orderId}`)
      .pipe(
        tap((response) => {
          if (response.data) {
            console.log('✅ [5️⃣ GET-BY-ORDER] Pago obtenido:', {
              status: response.data.status,
              amount: response.data.amount,
              createdAt: response.data.dateCreated
            });
          }
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'obtener pago por orden')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * 6️⃣ SINCRONIZAR PAGO CON MERCADO PAGO
   *
   * Sincroniza un pago con Mercado Pago (en caso de desincronización)
   * PATCH /payments/:paymentId/sync
   *
   * @param paymentId - ID del pago
   * @returns Observable con confirmación de sincronización y pago actualizado
   *
   * @example
   * ```typescript
   * this.paymentService.syncPayment(paymentId).subscribe(response => {
   *   console.log('Pago sincronizado:', response.message);
   *   console.log('Datos actualizados:', response.data);
   * });
   * ```
   */
  syncPayment(paymentId: string): Observable<SyncPaymentResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .patch<SyncPaymentResponse>(
        `${this.apiUrl}/${paymentId}/sync`,
        {}
      )
      .pipe(
        tap((response) => {
          console.log('✅ [6️⃣ SYNC] Pago sincronizado:', response.message);
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'sincronizar pago')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * 7️⃣ CANCELAR PAGO (Solo si no está aprobado)
   *
   * Cancela un pago no aprobado
   * PATCH /payments/:paymentId/cancel
   *
   * @param paymentId - ID del pago
   * @returns Observable con confirmación de cancelación y pago cancelado
   *
   * @example
   * ```typescript
   * this.paymentService.cancelPayment(paymentId).subscribe(
   *   response => {
   *     console.log('Pago cancelado:', response.message);
   *     console.log('Datos:', response.data);
   *   },
   *   error => {
   *     // Error si ya está aprobado: "No se puede cancelar un pago ya aprobado"
   *   }
   * );
   * ```
   */
  cancelPayment(paymentId: string): Observable<CancelPaymentResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .patch<CancelPaymentResponse>(
        `${this.apiUrl}/${paymentId}/cancel`,
        {}
      )
      .pipe(
        tap((response) => {
          console.log('✅ [7️⃣ CANCEL] Pago cancelado:', response.message);
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400 && error.error?.message?.includes('aprobado')) {
            const customError = 'No se puede cancelar un pago ya aprobado. Debe solicitar un reembolso.';
            this._errorMessage.set(customError);
            console.error('❌ [7️⃣ CANCEL] ' + customError);
            return throwError(() => ({
              ...error,
              message: customError
            }));
          }
          return this.handleError(error, 'cancelar pago');
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * 8️⃣ BUSCAR PAGOS EN MERCADO PAGO (ADMIN)
   *
   * Busca pagos en Mercado Pago por external reference (solo admin)
   * GET /payments/admin/search/:externalReference
   *
   * @param externalReference - External reference (order ID)
   * @returns Observable con resultados de búsqueda en MP
   *
   * @example
   * ```typescript
   * this.paymentService.searchPaymentsInMercadoPago(orderId).subscribe(response => {
   *   // response.data: array de pagos encontrados en MP
   *   // response.count: cantidad de pagos encontrados
   * });
   * ```
   */
  searchPaymentsInMercadoPago(
    externalReference: string
  ): Observable<AdminSearchPaymentsResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .get<AdminSearchPaymentsResponse>(
        `${this.apiUrl}/admin/search/${externalReference}`
      )
      .pipe(
        tap((response) => {
          console.log('✅ [8️⃣ ADMIN-SEARCH] Búsqueda en MP completada:', {
            count: response.count,
            itemsFound: response.data.length
          });
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'buscar pagos en Mercado Pago')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * REDIRIGIR A MERCADO PAGO (NUEVA PESTAÑA)
   *
   * Abre Mercado Pago en una nueva pestaña sin cerrar la aplicación
   *
   * @param initPoint - URL de producción de Mercado Pago
   * @param sandboxInitPoint - URL de sandbox de Mercado Pago
   * @param useSandbox - Si usar sandbox (true) o producción (false)
   *
   * @example
   * ```typescript
   * this.paymentService.redirectToMercadoPago(
   *   response.data.initPoint,
   *   response.data.sandboxInitPoint,
   *   true // sandbox para desarrollo
   * );
   * ```
   */
  redirectToMercadoPago(
    initPoint: string,
    sandboxInitPoint: string,
    useSandbox = true
  ): void {
    const url = useSandbox ? sandboxInitPoint : initPoint;
    console.log(
      '🔗 Abriendo Mercado Pago en nueva pestaña:',
      useSandbox ? 'SANDBOX 🔒' : 'PRODUCCIÓN 🚀',
      {
        url: url.substring(0, 80) + '...'
      }
    );

    // ✅ Abrir en nueva pestaña sin cerrar la aplicación
    window.location.href = url;
  }

  /**
   * Limpia el mensaje de error
   */
  clearError(): void {
    this._errorMessage.set(null);
  }

  // ========== WEBHOOKS PÚBLICOS (SIN AUTH) ==========

  /**
   * 🔔 VERIFICAR PAGO PÚBLICO (Sin autenticación)
   *
   * Verifica el estado de un pago sin requerir autenticación
   * GET /webhooks/mercado-pago/verify/:identifier
   *
   * @param identifier - UUID de orden o ID numérico de Mercado Pago
   * @returns Observable con estado del pago
   *
   * @example
   * ```typescript
   * // Por UUID de orden
   * this.paymentService.verifyPaymentPublic(orderId).subscribe(response => {
   *   if (response.success) {
   *     console.log('Estado:', response.status);
   *   }
   * });
   *
   * // Por ID de Mercado Pago
   * this.paymentService.verifyPaymentPublic('144136787069').subscribe(...);
   * ```
   */
  verifyPaymentPublic(identifier: string): Observable<WebhookVerifyPaymentResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .get<WebhookVerifyPaymentResponse>(
        `${environment.apiUrl}webhooks/mercado-pago/verify/${identifier}`
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            console.log('✅ [🔔 WEBHOOK-VERIFY] Pago verificado (público):', {
              status: response.status,
              paymentStatus: response.paymentStatus,
              orderId: response.orderId,
              webhookProcessed: response.webhookProcessed
            });
          } else {
            console.log('⚠️ [🔔 WEBHOOK-VERIFY] Pago no encontrado:', response.message);
          }
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'verificar pago (público)')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Maneja errores HTTP de forma centralizada
   */
  private handleError(
    error: HttpErrorResponse,
    action: string
  ): Observable<never> {
    let errorMessage = `Error al ${action}`;

    if (error.error instanceof ErrorEvent) {
      // Error de cliente/red
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage =
        error.error?.message ||
        `${errorMessage}. Código: ${error.status}`;
    }

    this._errorMessage.set(errorMessage);
    console.error(`❌ ${errorMessage}`, error);

    return throwError(() => error);
  }
}
