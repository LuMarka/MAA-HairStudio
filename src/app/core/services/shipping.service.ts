import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  ShippingQuoteRequestDto,
  CreateShippingRequestDto,
  ShippingQuoteResponse,
  CreateShippingResponse,
  GetShippingResponse,
  GetShippingByOrderResponse,
  Shipment,
  ShippingOption,
  SelectedShippingOption,
} from '../models/interfaces/shipping.interface';

/**
 * Servicio para gestión de envíos con Zipnova
 *
 * Maneja todas las operaciones de envíos incluyendo:
 * - Cotizar opciones de envío
 * - Crear envíos confirmados
 * - Obtener estado de seguimiento
 * - Obtener envío asociado a una orden
 *
 * @example
 * ```typescript
 * const shippingService = inject(ShippingService);
 *
 * // Cotizar opciones de envío
 * shippingService.getShippingQuote({
 *   orderId: 'order-uuid',
 *   destinationAddressId: 'addr-uuid',
 *   deliveryType: 'delivery'
 * }).subscribe();
 *
 * // Crear envío seleccionado
 * shippingService.createShipment({
 *   orderId: 'order-uuid',
 *   destinationAddressId: 'addr-uuid',
 *   zipnovaQuoteId: '208',
 *   shippingCost: 2500,
 *   serviceType: 'standard_delivery',
 *   logisticType: 'crossdock',
 *   carrierId: 208
 * }).subscribe();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ShippingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}shipping`;

  // ========== STATE MANAGEMENT ==========

  private readonly _shippingOptions = signal<ShippingOption[]>([]);
  private readonly _currentShipment = signal<Shipment | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _selectedOption = signal<SelectedShippingOption | null>(null);

  // ========== COMPUTED VALUES ==========

  readonly shippingOptions = this._shippingOptions.asReadonly();
  readonly currentShipment = this._currentShipment.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly selectedOption = this._selectedOption.asReadonly();

  readonly hasOptions = computed(() => this._shippingOptions().length > 0);
  readonly hasShipment = computed(() => !!this._currentShipment());

  /**
   * Opciones ordenadas por tags (más baratas primero, más rápidas después)
   */
  readonly sortedOptions = computed(() => {
    const options = this._shippingOptions();
    return [...options].sort((a, b) => {
      // Primero las opciones etiquetadas como "cheapest"
      if (a.tags.includes('cheapest') && !b.tags.includes('cheapest')) return -1;
      if (!a.tags.includes('cheapest') && b.tags.includes('cheapest')) return 1;

      // Luego por precio
      return a.price - b.price;
    });
  });

  /**
   * Opción más económica
   */
  readonly cheapestOption = computed(() => {
    const options = this.sortedOptions();
    return options.find((opt) => opt.tags.includes('cheapest')) || options[0] || null;
  });

  /**
   * Opción más rápida
   */
  readonly fastestOption = computed(() => {
    const options = this._shippingOptions();
    return options.reduce((fastest, current) => {
      return current.estimatedDays < fastest.estimatedDays ? current : fastest;
    }, options[0] || null);
  });

  // ========== PUBLIC METHODS ==========

  /**
   * Cotiza opciones de envío disponibles
   *
   * @param requestData - Datos de la cotización
   * @returns Observable con las opciones de envío
   *
   * @example
   * ```typescript
   * shippingService.getShippingQuote({
   *   orderId: 'order-uuid-1234',
   *   destinationAddressId: 'addr-uuid-5678',
   *   deliveryType: 'delivery'
   * }).subscribe({
   *   next: (response) => {
   *     console.log('Opciones:', response.data.options);
   *   },
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getShippingQuote(requestData: ShippingQuoteRequestDto): Observable<ShippingQuoteResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<ShippingQuoteResponse>(`${this.apiUrl}/quote`, requestData).pipe(
      tap((response) => {
        this._shippingOptions.set(response.data.options);
        console.log('✅ Cotización obtenida:', {
          origin: response.data.origin,
          destination: response.data.destination,
          optionsCount: response.data.options.length,
        });
      }),
      catchError((error: HttpErrorResponse) =>
        this.handleError(error, 'obtener cotización de envío')
      ),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Crea un envío confirmado
   *
   * @param requestData - Datos del envío a crear
   * @returns Observable con el envío creado
   *
   * @example
   * ```typescript
   * // Envío a domicilio
   * shippingService.createShipment({
   *   orderId: 'order-uuid-1234',
   *   destinationAddressId: 'addr-uuid-5678',
   *   zipnovaQuoteId: '208',
   *   shippingCost: 2500.00,
   *   serviceType: 'standard_delivery',
   *   logisticType: 'crossdock',
   *   carrierId: 208
   * }).subscribe({
   *   next: (response) => console.log('Envío creado:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   *
   * // Envío con retiro en punto
   * shippingService.createShipment({
   *   orderId: 'order-uuid-1234',
   *   destinationAddressId: 'addr-uuid-5678',
   *   zipnovaQuoteId: '208',
   *   shippingCost: 1800.00,
   *   serviceType: 'pickup_point',
   *   logisticType: 'carrier_dropoff',
   *   carrierId: 208,
   *   pointId: 5423  // Punto de retiro seleccionado
   * }).subscribe();
   * ```
   */
  createShipment(requestData: CreateShippingRequestDto): Observable<CreateShippingResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<CreateShippingResponse>(`${this.apiUrl}/create`, requestData).pipe(
      tap((response) => {
        this._currentShipment.set(response.data);
        console.log('✅ Envío creado exitosamente:', {
          id: response.data.id,
          trackingNumber: response.data.trackingNumber,
          carrier: response.data.carrier,
          shippingCost: response.data.shippingCost,
        });
      }),
      catchError((error: HttpErrorResponse) =>
        this.handleError(error, 'crear envío')
      ),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene el estado y seguimiento de un envío específico
   *
   * @param shipmentId - ID del envío
   * @returns Observable con los datos de seguimiento
   *
   * @example
   * ```typescript
   * shippingService.getShipmentStatus('shipment-uuid-1234').subscribe({
   *   next: (response) => {
   *     console.log('Estado:', response.data.status);
   *     console.log('Eventos:', response.data.events);
   *   },
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getShipmentStatus(shipmentId: string): Observable<GetShippingResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<GetShippingResponse>(`${this.apiUrl}/${shipmentId}`).pipe(
      tap((response) => {
        console.log('✅ Estado del envío obtenido:', {
          id: response.data.id,
          status: response.data.status,
          trackingNumber: response.data.trackingNumber,
        });
      }),
      catchError((error: HttpErrorResponse) =>
        this.handleError(error, 'obtener estado del envío')
      ),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene el envío asociado a una orden
   *
   * @param orderId - ID de la orden
   * @returns Observable con los datos del envío o null
   *
   * @example
   * ```typescript
   * shippingService.getShippingByOrderId('order-uuid-1234').subscribe({
   *   next: (response) => {
   *     if (response.data) {
   *       console.log('Envío encontrado:', response.data);
   *     } else {
   *       console.log('No hay envío para esta orden');
   *     }
   *   },
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getShippingByOrderId(orderId: string): Observable<GetShippingByOrderResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http
      .get<GetShippingByOrderResponse>(`${this.apiUrl}/order/${orderId}`)
      .pipe(
        tap((response) => {
          if (response.data) {
            this._currentShipment.set(response.data);
            console.log('✅ Envío de orden obtenido:', {
              id: response.data.id,
              status: response.data.status,
              carrier: response.data.carrier,
            });
          } else {
            console.log('⚠️ No hay envío registrado para esta orden');
            this._currentShipment.set(null);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          // 404 no es un error real en este caso
          if (error.status === 404) {
            console.log('ℹ️ No hay envío para esta orden');
            this._currentShipment.set(null);
            this._isLoading.set(false);
            return new Observable<GetShippingByOrderResponse>((obs) => {
              obs.next({
                success: false,
                message: 'No hay envío registrado para esta orden',
                data: null,
              });
              obs.complete();
            });
          }
          return this.handleError(error, 'obtener envío de orden');
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  // ========== PUBLIC METHODS - STATE MANAGEMENT ==========

  /**
   * Guarda la opción de envío seleccionada por el usuario
   *
   * @param option - Opción seleccionada
   *
   * @example
   * ```typescript
   * // Usuario selecciona una opción de envío
   * const selectedOption: SelectedShippingOption = {
   *   carrierId: 208,
   *   serviceType: 'standard_delivery',
   *   logisticType: 'crossdock',
   *   price: 2500,
   *   carrier: 'OCA',
   *   estimatedDelivery: '2026-03-01'
   * };
   * shippingService.selectShippingOption(selectedOption);
   * ```
   */
  selectShippingOption(option: SelectedShippingOption): void {
    this._selectedOption.set(option);
    console.log('✅ Opción de envío seleccionada:', option);
  }

  /**
   * Limpia la opción de envío seleccionada
   */
  clearSelectedOption(): void {
    this._selectedOption.set(null);
  }

  /**
   * Limpia todas las opciones de cotización
   */
  clearShippingOptions(): void {
    this._shippingOptions.set([]);
    this._selectedOption.set(null);
  }

  /**
   * Limpia el mensaje de error
   */
  clearError(): void {
    this._errorMessage.set(null);
  }

  /**
   * Limpia el estado actual del envío
   */
  clearCurrentShipment(): void {
    this._currentShipment.set(null);
  }

  /**
   * Recarga el estado del envío de una orden
   *
   * @param orderId - ID de la orden
   * @returns Observable con la respuesta
   */
  reloadShippingByOrderId(orderId: string): Observable<GetShippingByOrderResponse> {
    console.log('🔄 Recargando envío de orden...');
    return this.getShippingByOrderId(orderId);
  }

  // ========== PRIVATE METHODS ==========

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
