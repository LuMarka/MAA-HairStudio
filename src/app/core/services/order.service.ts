import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  OrderInterface,
  OrderData,
  CreateOrderDto,
  CreateOrderResponse,
  DeliveryType,
  OrderStatus,
  PaymentStatus,
  OrderListResponse,
  ConfirmOrderDto,
  OrderQueryParams,
  SetShippingCostDto,
  UpdateOrderStatusDto,
  OrderStatisticsResponse,
} from '../models/interfaces/order.interface';

/**
 * Estado temporal de checkout antes de crear la orden
 */
export interface CheckoutState {
  deliveryType: DeliveryType;
  selectedAddressId?: string;
  timestamp: number; // Para validar expiración (30 minutos)
}

/**
 * Servicio para gestión de órdenes de compra
 *
 * Maneja todas las operaciones de órdenes incluyendo:
 * - Crear órdenes desde el carrito
 * - Consultar órdenes del usuario
 * - Establecer costos de envío (admin)
 * - Confirmar órdenes (usuario)
 * - Actualizar estados (admin)
 * - Estadísticas y búsquedas (admin)
 * - Gestión de estado de checkout
 *
 * @example
 * ```typescript
 * const orderService = inject(OrderService);
 *
 * // Iniciar checkout
 * orderService.initCheckout('delivery');
 * router.navigate(['/purchase-order']);
 *
 * // Crear orden con pickup
 * orderService.createOrderFromCart({
 *   deliveryType: 'pickup',
 *   notes: 'Voy a retirar por la tarde'
 * }).subscribe();
 *
 * // Obtener mis órdenes
 * orderService.getMyOrders({ page: 1, limit: 10 }).subscribe();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}orders`;

  // ========== STORAGE KEYS ==========
  private readonly CHECKOUT_STATE_KEY = 'maa_checkout_state';
  private readonly CHECKOUT_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutos

  // ========== STATE MANAGEMENT ==========

  private readonly _orders$ = new BehaviorSubject<OrderData[]>([]);
  private readonly _currentOrder$ = new BehaviorSubject<OrderData | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _totalOrders = signal(0);
  private readonly _currentPage = signal(1);
  private readonly _totalPages = signal(0);

  // ========== CHECKOUT STATE ==========
  private readonly _checkoutState = signal<CheckoutState | null>(
    this.loadCheckoutStateFromStorage()
  );

  // ========== COMPUTED VALUES ==========

  readonly orders = computed(() => this._orders$.value);
  readonly currentOrder = computed(() => this._currentOrder$.value);
  readonly isLoading = computed(() => this._isLoading());
  readonly errorMessage = computed(() => this._errorMessage());
  readonly hasOrders = computed(() => this._orders$.value.length > 0);
  readonly totalOrders = computed(() => this._totalOrders());
  readonly currentPage = computed(() => this._currentPage());
  readonly totalPages = computed(() => this._totalPages());
  readonly hasNextPage = computed(() => this._currentPage() < this._totalPages());
  readonly hasPreviousPage = computed(() => this._currentPage() > 1);

  // Computed para filtrar órdenes por estado
  readonly pendingOrders = computed(() =>
    this._orders$.value.filter((order) => order.status === 'pending')
  );
  readonly confirmedOrders = computed(() =>
    this._orders$.value.filter((order) => order.status === 'confirmed')
  );
  readonly deliveredOrders = computed(() =>
    this._orders$.value.filter((order) => order.status === 'delivered')
  );

  // ========== COMPUTED - CHECKOUT STATE ==========

  /**
   * Estado de checkout actual
   */
  readonly checkoutState = this._checkoutState.asReadonly();

  /**
   * Indica si hay un checkout activo y no expirado
   */
  readonly hasActiveCheckout = computed(() => {
    const state = this._checkoutState();
    if (!state) return false;

    const now = Date.now();
    const isExpired = now - state.timestamp > this.CHECKOUT_EXPIRATION_MS;

    if (isExpired) {
      console.warn('⚠️ Checkout expirado, limpiando...');
      this.clearCheckoutState();
      return false;
    }

    return true;
  });

  /**
   * Tipo de entrega del checkout activo
   */
  readonly checkoutDeliveryType = computed(() => {
    return this.hasActiveCheckout() ? this._checkoutState()?.deliveryType ?? null : null;
  });

  /**
   * Dirección seleccionada del checkout activo
   */
  readonly checkoutAddressId = computed(() => {
    return this.hasActiveCheckout() ? this._checkoutState()?.selectedAddressId ?? null : null;
  });

  /**
   * Indica si el checkout es tipo delivery
   */
  readonly isDeliveryCheckout = computed(() => {
    return this.checkoutDeliveryType() === 'delivery';
  });

  /**
   * Indica si el checkout es tipo pickup
   */
  readonly isPickupCheckout = computed(() => {
    return this.checkoutDeliveryType() === 'pickup';
  });

  // ========== PUBLIC METHODS - CHECKOUT STATE MANAGEMENT ==========

  /**
   * Inicia el proceso de checkout guardando el tipo de entrega
   *
   * @param deliveryType - Tipo de entrega seleccionado
   * @param addressId - ID de dirección (opcional, solo para delivery)
   *
   * @example
   * ```typescript
   * // Iniciar checkout con pickup
   * orderService.initCheckout('pickup');
   *
   * // Iniciar checkout con delivery y dirección
   * orderService.initCheckout('delivery', 'address-uuid-123');
   *
   * // Luego navegar a purchase-order
   * router.navigate(['/purchase-order']);
   * ```
   */
  initCheckout(deliveryType: DeliveryType, addressId?: string): void {
    const checkoutState: CheckoutState = {
      deliveryType,
      selectedAddressId: addressId,
      timestamp: Date.now(),
    };

    this._checkoutState.set(checkoutState);
    this.saveCheckoutStateToStorage(checkoutState);

    console.log('✅ Checkout iniciado:', {
      deliveryType,
      hasAddress: !!addressId,
      timestamp: new Date(checkoutState.timestamp).toISOString(),
    });
  }

  /**
   * Actualiza la dirección seleccionada durante el checkout
   *
   * @param addressId - ID de la dirección seleccionada
   *
   * @example
   * ```typescript
   * // Usuario selecciona una dirección en purchase-order
   * orderService.updateCheckoutAddress('new-address-uuid');
   * ```
   */
  updateCheckoutAddress(addressId: string): void {
    const currentState = this._checkoutState();

    if (!currentState) {
      console.warn('⚠️ No hay checkout activo para actualizar dirección');
      return;
    }

    if (currentState.deliveryType !== 'delivery') {
      console.warn('⚠️ Solo se puede actualizar dirección en checkout tipo delivery');
      return;
    }

    const updatedState: CheckoutState = {
      ...currentState,
      selectedAddressId: addressId,
      timestamp: Date.now(), // Renovar timestamp al actualizar
    };

    this._checkoutState.set(updatedState);
    this.saveCheckoutStateToStorage(updatedState);

    console.log('✅ Dirección actualizada en checkout:', addressId);
  }

  /**
   * Limpia el estado de checkout
   * Se debe llamar después de crear la orden o cancelar el proceso
   *
   * @example
   * ```typescript
   * // Después de crear orden exitosamente
   * orderService.createOrderFromCart(data).subscribe({
   *   next: () => {
   *     orderService.clearCheckoutState();
   *     router.navigate(['/orders']);
   *   }
   * });
   *
   * // Al cancelar checkout
   * onCancelCheckout() {
   *   orderService.clearCheckoutState();
   *   router.navigate(['/cart']);
   * }
   * ```
   */
  clearCheckoutState(): void {
    this._checkoutState.set(null);
    this.removeCheckoutStateFromStorage();
    console.log('🧹 Estado de checkout limpiado');
  }

  /**
   * Obtiene el tipo de entrega del checkout activo
   *
   * @returns Tipo de entrega o null si no hay checkout activo
   *
   * @example
   * ```typescript
   * const deliveryType = orderService.getCheckoutDeliveryType();
   * if (deliveryType === 'delivery') {
   *   // Mostrar selector de dirección
   * }
   * ```
   */
  getCheckoutDeliveryType(): DeliveryType | null {
    return this.checkoutDeliveryType();
  }

  /**
   * Obtiene la dirección seleccionada del checkout activo
   *
   * @returns ID de dirección o null
   *
   * @example
   * ```typescript
   * const addressId = orderService.getCheckoutAddressId();
   * if (addressId) {
   *   addressService.getAddressById(addressId).subscribe();
   * }
   * ```
   */
  getCheckoutAddressId(): string | null {
    return this.checkoutAddressId();
  }

  /**
   * Valida que existe un checkout activo
   * Útil en guards o al inicializar componentes
   *
   * @returns true si hay checkout válido, false si no
   *
   * @example
   * ```typescript
   * // En purchase-order.component.ts
   * ngOnInit() {
   *   if (!this.orderService.hasActiveCheckout()) {
   *     console.warn('No hay checkout activo');
   *     this.router.navigate(['/cart']);
   *     return;
   *   }
   *   // Continuar con el flujo
   * }
   * ```
   */
  validateCheckout(): boolean {
    return this.hasActiveCheckout();
  }

  // ========== PUBLIC METHODS - USER OPERATIONS ==========

  /**
   * Crea una nueva orden desde el carrito
   *
   * @param orderData - Datos de la orden (tipo de entrega, dirección, notas)
   * @returns Observable con la respuesta de creación
   *
   * @example
   * ```typescript
   * // Orden con pickup
   * orderService.createOrderFromCart({
   *   deliveryType: 'pickup',
   *   notes: 'Voy a retirar por la tarde'
   * }).subscribe({
   *   next: (response) => console.log('Orden creada:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   *
   * // Orden con delivery
   * orderService.createOrderFromCart({
   *   deliveryType: 'delivery',
   *   shippingAddressId: 'address-uuid',
   *   notes: 'Llamar antes de entregar'
   * }).subscribe();
   * ```
   */
  createOrderFromCart(orderData: CreateOrderDto): Observable<OrderInterface> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<OrderInterface>(`${this.apiUrl}/from-cart`, orderData).pipe(
      tap((response) => {
        this._currentOrder$.next(response.data);
        console.log('✅ Orden creada exitosamente:', {
          orderNumber: response.data.orderNumber,
          deliveryType: response.data.deliveryType,
          total: response.data.total,
          requiresShippingCost: response.meta.requiresShippingCost,
        });
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'crear orden')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene todas las órdenes del usuario autenticado
   *
   * @param params - Parámetros de paginación
   * @returns Observable con la lista de órdenes
   *
   * @example
   * ```typescript
   * orderService.getMyOrders({ page: 1, limit: 10 }).subscribe({
   *   next: (response) => console.log('Mis órdenes:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getMyOrders(params?: { page?: number; limit?: number }): Observable<OrderListResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<OrderListResponse>(`${this.apiUrl}/my-orders`, { params: httpParams })
      .pipe(
        tap((response) => {
          this._orders$.next(response.data);
          this._totalOrders.set(response.meta.total);
          this._currentPage.set(response.meta.page);
          this._totalPages.set(response.meta.totalPages);
          console.log('✅ Órdenes cargadas:', {
            total: response.meta.total,
            page: response.meta.page,
            items: response.data.length,
          });
        }),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'obtener mis órdenes')),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * Obtiene una orden específica por ID
   *
   * @param orderId - ID de la orden
   * @returns Observable con la orden
   *
   * @example
   * ```typescript
   * orderService.getOrderById('order-uuid').subscribe({
   *   next: (order) => console.log('Orden:', order),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getOrderById(orderId: string): Observable<OrderData> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    const url = `${this.apiUrl}/${orderId}`;
    console.log('📡 Llamando GET a:', url);

    return this.http.get<OrderData>(url).pipe(
      tap((order) => {
        this._currentOrder$.next(order);
        console.log('✅ Orden obtenida:', order.orderNumber);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error HTTP:', {
          url: url,
          status: error.status,
          statusText: error.statusText,
          error: error.error
        });
        return this.handleError(error, 'obtener orden');
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Confirma una orden (cliente acepta el costo de envío)
   *
   * @param orderId - ID de la orden a confirmar
   * @returns Observable con la orden confirmada
   *
   * @example
   * ```typescript
   * orderService.confirmOrder('order-uuid').subscribe({
   *   next: (response) => console.log('Orden confirmada:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  /* confirmOrder(orderId: string): Observable<OrderInterface> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    const confirmDto: ConfirmOrderDto = { confirm: true };

    return this.http.patch<OrderInterface>(`${this.apiUrl}/${orderId}/confirm`, confirmDto).pipe(
      tap((response) => {
        this._currentOrder$.next(response.data);

        const currentOrders = this._orders$.value;
        const updatedOrders = currentOrders.map((order) =>
          order.id === orderId ? response.data : order
        );
        this._orders$.next(updatedOrders);

        console.log('✅ Orden confirmada exitosamente:', response.data.orderNumber);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'confirmar orden')),
      finalize(() => this._isLoading.set(false))
    );
  } */

  // ========== PUBLIC METHODS - ADMIN OPERATIONS ==========

  /**
   * Obtiene todas las órdenes (solo admin)
   *
   * @param params - Parámetros de consulta y filtros
   * @returns Observable con la lista de órdenes
   *
   * @example
   * ```typescript
   * orderService.getAllOrders({
   *   page: 1,
   *   limit: 20,
   *   status: 'confirmed',
   *   paymentStatus: 'approved'
   * }).subscribe({
   *   next: (response) => console.log('Todas las órdenes:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getAllOrders(params?: OrderQueryParams): Observable<OrderListResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.paymentStatus) httpParams = httpParams.set('paymentStatus', params.paymentStatus);
    if (params?.userId) httpParams = httpParams.set('userId', params.userId);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http
      .get<OrderListResponse>(`${this.apiUrl}/admin/all`, { params: httpParams })
      .pipe(
        tap((response) => {
          this._orders$.next(response.data);
          this._totalOrders.set(response.meta.total);
          this._currentPage.set(response.meta.page);
          this._totalPages.set(response.meta.totalPages);
          console.log('✅ Órdenes (admin) cargadas:', {
            total: response.meta.total,
            filters: response.meta.filters,
          });
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'obtener todas las órdenes')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * Obtiene órdenes pendientes de costo de envío (solo admin)
   *
   * @returns Observable con órdenes pendientes
   *
   * @example
   * ```typescript
   * orderService.getOrdersAwaitingShippingCost().subscribe({
   *   next: (response) => console.log('Órdenes pendientes:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getOrdersAwaitingShippingCost(): Observable<OrderListResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<OrderListResponse>(`${this.apiUrl}/admin/awaiting-shipping-cost`).pipe(
      tap((response) => {
        console.log('✅ Órdenes pendientes de envío:', response.meta.total);
      }),
      catchError((error: HttpErrorResponse) =>
        this.handleError(error, 'obtener órdenes pendientes')
      ),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Establece el costo de envío para una orden (solo admin)
   *
   * @param orderId - ID de la orden
   * @param shippingData - Costo y notas de envío
   * @returns Observable con la orden actualizada
   *
   * @example
   * ```typescript
   * orderService.setShippingCost('order-uuid', {
   *   shippingCost: 2500,
   *   shippingNotes: 'Envío por Andreani, estimado 3-5 días hábiles'
   * }).subscribe({
   *   next: (response) => console.log('Costo establecido:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  setShippingCost(orderId: string, shippingData: SetShippingCostDto): Observable<OrderInterface> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .patch<OrderInterface>(`${this.apiUrl}/${orderId}/shipping-cost`, shippingData)
      .pipe(
        tap((response) => {
          this._currentOrder$.next(response.data);
          console.log('✅ Costo de envío establecido:', {
            orderNumber: response.data.orderNumber,
            shippingCost: response.data.shippingCost,
          });
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError(error, 'establecer costo de envío')
        ),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * Actualiza el estado de una orden (solo admin)
   *
   * @param orderId - ID de la orden
   * @param statusData - Nuevo estado y datos relacionados
   * @returns Observable con la orden actualizada
   *
   * @example
   * ```typescript
   * orderService.updateOrderStatus('order-uuid', {
   *   status: 'processing',
   *   notes: 'Orden en preparación'
   * }).subscribe({
   *   next: (response) => console.log('Estado actualizado:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  updateOrderStatus(orderId: string, statusData: UpdateOrderStatusDto): Observable<OrderInterface> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.patch<OrderInterface>(`${this.apiUrl}/${orderId}/status`, statusData).pipe(
      tap((response) => {
        this._currentOrder$.next(response.data);

        const currentOrders = this._orders$.value;
        const updatedOrders = currentOrders.map((order) =>
          order.id === orderId ? response.data : order
        );
        this._orders$.next(updatedOrders);

        console.log('✅ Estado de orden actualizado:', {
          orderNumber: response.data.orderNumber,
          status: response.data.status,
          paymentStatus: response.data.paymentStatus,
        });
      }),
      catchError((error: HttpErrorResponse) =>
        this.handleError(error, 'actualizar estado de orden')
      ),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Busca una orden por número (solo admin)
   *
   * @param orderNumber - Número de la orden (ej: MAA-251118-0001)
   * @returns Observable con la orden encontrada
   *
   * @example
   * ```typescript
   * orderService.searchOrderByNumber('MAA-251118-0001').subscribe({
   *   next: (response) => console.log('Orden encontrada:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  searchOrderByNumber(orderNumber: string): Observable<OrderInterface> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<OrderInterface>(`${this.apiUrl}/admin/search/${orderNumber}`).pipe(
      tap((response) => {
        this._currentOrder$.next(response.data);
        console.log('✅ Orden encontrada:', response.data.orderNumber);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'buscar orden')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene estadísticas de órdenes (solo admin)
   *
   * @returns Observable con las estadísticas
   *
   * @example
   * ```typescript
   * orderService.getOrderStatistics().subscribe({
   *   next: (response) => console.log('Estadísticas:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getOrderStatistics(): Observable<OrderStatisticsResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<OrderStatisticsResponse>(`${this.apiUrl}/admin/statistics`).pipe(
      tap((response) => {
        console.log('✅ Estadísticas obtenidas:', {
          totalOrders: response.data.totalOrders,
          revenue: response.data.revenue.total,
        });
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'obtener estadísticas')),
      finalize(() => this._isLoading.set(false))
    );
  }

  // ========== PUBLIC METHODS - STATE MANAGEMENT ==========

  /**
   * Limpia el mensaje de error
   */
  clearError(): void {
    this._errorMessage.set(null);
  }

  /**
   * Limpia la lista de órdenes del estado local
   */
  clearOrders(): void {
    this._orders$.next([]);
    this._currentOrder$.next(null);
    this._totalOrders.set(0);
    this._currentPage.set(1);
    this._totalPages.set(0);
  }

  /**
   * Limpia la orden actual
   */
  clearCurrentOrder(): void {
    this._currentOrder$.next(null);
  }

  /**
   * Recarga las órdenes del usuario
   *
   * @param params - Parámetros de paginación
   * @returns Observable con la respuesta de órdenes
   */
  reloadMyOrders(params?: { page?: number; limit?: number }): Observable<OrderListResponse> {
    console.log('🔄 Recargando mis órdenes...');
    return this.getMyOrders(params);
  }

  // ========== PRIVATE METHODS - CHECKOUT STORAGE ==========

  /**
   * Carga el estado de checkout desde localStorage
   */
  private loadCheckoutStateFromStorage(): CheckoutState | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.CHECKOUT_STATE_KEY);
      if (!stored) return null;

      const state: CheckoutState = JSON.parse(stored);

      // Validar que no haya expirado
      const now = Date.now();
      if (now - state.timestamp > this.CHECKOUT_EXPIRATION_MS) {
        console.warn('⚠️ Checkout state expirado al cargar');
        this.removeCheckoutStateFromStorage();
        return null;
      }

      console.log('✅ Checkout state cargado desde storage');
      return state;
    } catch (error) {
      console.error('❌ Error al cargar estado de checkout:', error);
      return null;
    }
  }

  /**
   * Guarda el estado de checkout en localStorage
   */
  private saveCheckoutStateToStorage(state: CheckoutState): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.setItem(this.CHECKOUT_STATE_KEY, JSON.stringify(state));
      console.log('💾 Checkout state guardado en storage');
    } catch (error) {
      console.error('❌ Error al guardar estado de checkout:', error);
    }
  }

  /**
   * Elimina el estado de checkout de localStorage
   */
  private removeCheckoutStateFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.removeItem(this.CHECKOUT_STATE_KEY);
      console.log('🗑️ Checkout state eliminado de storage');
    } catch (error) {
      console.error('❌ Error al eliminar estado de checkout:', error);
    }
  }

  // ========== PRIVATE METHODS - ERROR HANDLING ==========

  /**
   * Maneja errores HTTP de manera centralizada
   */
  private handleError(error: HttpErrorResponse, operation: string): Observable<never> {
    let errorMessage = `Error al ${operation}`;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de red: ${error.error.message}`;
      console.error('❌ Error del cliente:', error.error.message);
    } else {
      const serverMessage = error.error?.message;

      if (Array.isArray(serverMessage)) {
        errorMessage = serverMessage.join(', ');
      } else if (typeof serverMessage === 'string') {
        errorMessage = serverMessage;
      } else {
        errorMessage = `${errorMessage}. Código: ${error.status}`;
      }

      console.error('❌ Error del servidor:', {
        status: error.status,
        message: errorMessage,
        operation,
      });
    }

    this._errorMessage.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
