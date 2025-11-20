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
  OrderStatisticsResponse
} from '../models/interfaces/order.interface';

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
 *
 * @example
 * ```typescript
 * const orderService = inject(OrderService);
 *
 * // Crear orden con pickup
 * orderService.createOrderFromCart({
 *   deliveryType: 'tienda',
 *   notes: 'Voy a retirar por la tarde'
 * }).subscribe();
 *
 * // Obtener mis órdenes
 * orderService.getMyOrders({ page: 1, limit: 10 }).subscribe();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}orders`;

  // ========== STATE MANAGEMENT ==========

  private readonly _orders$ = new BehaviorSubject<OrderData[]>([]);
  private readonly _currentOrder$ = new BehaviorSubject<OrderData | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _totalOrders = signal(0);
  private readonly _currentPage = signal(1);
  private readonly _totalPages = signal(0);

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
    this._orders$.value.filter(order => order.status === 'pending')
  );
  readonly confirmedOrders = computed(() =>
    this._orders$.value.filter(order => order.status === 'confirmed')
  );
  readonly deliveredOrders = computed(() =>
    this._orders$.value.filter(order => order.status === 'delivered')
  );

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
   *   deliveryType: 'tienda',
   *   notes: 'Voy a retirar por la tarde'
   * }).subscribe({
   *   next: (response) => console.log('Orden creada:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   *
   * // Orden con delivery
   * orderService.createOrderFromCart({
   *   deliveryType: 'casa',
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
          requiresShippingCost: response.meta.requiresShippingCost
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

    return this.http.get<OrderListResponse>(`${this.apiUrl}/my-orders`, { params: httpParams }).pipe(
      tap((response) => {
        this._orders$.next(response.data);
        this._totalOrders.set(response.meta.total);
        this._currentPage.set(response.meta.page);
        this._totalPages.set(response.meta.totalPages);
        console.log('✅ Órdenes cargadas:', {
          total: response.meta.total,
          page: response.meta.page,
          items: response.data.length
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

    return this.http.get<OrderData>(`${this.apiUrl}/${orderId}`).pipe(
      tap((order) => {
        this._currentOrder$.next(order);
        console.log('✅ Orden obtenida:', order.orderNumber);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'obtener orden')),
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
  confirmOrder(orderId: string): Observable<OrderInterface> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    const confirmDto: ConfirmOrderDto = { confirm: true };

    return this.http.patch<OrderInterface>(`${this.apiUrl}/${orderId}/confirm`, confirmDto).pipe(
      tap((response) => {
        this._currentOrder$.next(response.data);
        
        // Actualizar en la lista local si existe
        const currentOrders = this._orders$.value;
        const updatedOrders = currentOrders.map(order =>
          order.id === orderId ? response.data : order
        );
        this._orders$.next(updatedOrders);

        console.log('✅ Orden confirmada exitosamente:', response.data.orderNumber);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'confirmar orden')),
      finalize(() => this._isLoading.set(false))
    );
  }

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

    return this.http.get<OrderListResponse>(`${this.apiUrl}/admin/all`, { params: httpParams }).pipe(
      tap((response) => {
        this._orders$.next(response.data);
        this._totalOrders.set(response.meta.total);
        this._currentPage.set(response.meta.page);
        this._totalPages.set(response.meta.totalPages);
        console.log('✅ Órdenes (admin) cargadas:', {
          total: response.meta.total,
          filters: response.meta.filters
        });
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'obtener todas las órdenes')),
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
      catchError((error: HttpErrorResponse) => this.handleError(error, 'obtener órdenes pendientes')),
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

    return this.http.patch<OrderInterface>(`${this.apiUrl}/${orderId}/shipping-cost`, shippingData).pipe(
      tap((response) => {
        this._currentOrder$.next(response.data);
        console.log('✅ Costo de envío establecido:', {
          orderNumber: response.data.orderNumber,
          shippingCost: response.data.shippingCost
        });
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'establecer costo de envío')),
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
        
        // Actualizar en la lista local si existe
        const currentOrders = this._orders$.value;
        const updatedOrders = currentOrders.map(order =>
          order.id === orderId ? response.data : order
        );
        this._orders$.next(updatedOrders);

        console.log('✅ Estado de orden actualizado:', {
          orderNumber: response.data.orderNumber,
          status: response.data.status,
          paymentStatus: response.data.paymentStatus
        });
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'actualizar estado de orden')),
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
          revenue: response.data.revenue.total
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

  // ========== PRIVATE METHODS ==========

  /**
   * Maneja errores HTTP de manera centralizada
   *
   * @param error - Error HTTP recibido
   * @param operation - Nombre de la operación que falló
   * @returns Observable que emite el error
   */
  private handleError(error: HttpErrorResponse, operation: string): Observable<never> {
    let errorMessage = `Error al ${operation}`;

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de red: ${error.error.message}`;
      console.error('❌ Error del cliente:', error.error.message);
    } else {
      // Error del lado del servidor
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
        operation
      });
    }

    this._errorMessage.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}