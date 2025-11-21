import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  AddressInterface,
  Datum as AddressData,
  AddressOperationResponse,
  DefaultAddressResponse,
  CreateAddressDto,
  UpdateAddressDto,
  AddressValidationResponse,
  ProvincesResponse,
  CitiesResponse
} from '../models/interfaces/address.interface';



/**
 * Servicio para gestión de direcciones de envío
 *
 * Maneja todas las operaciones CRUD de direcciones del usuario,
 * incluyendo validación, establecer predeterminada, y obtener datos
 * de ubicación (provincias y ciudades de Argentina).
 *
 * @example
 * ```typescript
 * const addressService = inject(AddressService);
 *
 * // Obtener todas las direcciones
 * addressService.getAddresses().subscribe(addresses => {
 *   console.log('Direcciones:', addresses);
 * });
 *
 * // Crear nueva dirección
 * addressService.createAddress({
 *   recipientName: 'Juan Pérez',
 *   phone: '+5491123456789',
 *   province: 'Buenos Aires',
 *   city: 'La Plata',
 *   postalCode: 'B1900',
 *   streetAddress: 'Calle 50 N° 456'
 * }).subscribe();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}address`;

  // ========== STATE MANAGEMENT ==========

  private readonly _addresses$ = new BehaviorSubject<AddressData[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _defaultAddressId = signal<string | null>(null);

  // ========== COMPUTED VALUES ==========

  readonly addresses = computed(() => this._addresses$.value);
  readonly isLoading = computed(() => this._isLoading());
  readonly errorMessage = computed(() => this._errorMessage());
  readonly hasAddresses = computed(() => this._addresses$.value.length > 0);
  readonly defaultAddress = computed(() =>
    this._addresses$.value.find(addr => addr.id === this._defaultAddressId())
  );
  readonly validatedAddresses = computed(() =>
    this._addresses$.value.filter(addr => addr.isValidated)
  );
  readonly activeAddresses = computed(() =>
    this._addresses$.value.filter(addr => addr.isActive)
  );

  // ========== PUBLIC METHODS - CRUD OPERATIONS ==========

  /**
   * Obtiene todas las direcciones del usuario autenticado
   *
   * @returns Observable con la respuesta de direcciones
   *
   * @example
   * ```typescript
   * addressService.getAddresses().subscribe({
   *   next: (response) => console.log('Direcciones:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getAddresses(): Observable<AddressInterface> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<AddressInterface>(this.apiUrl).pipe(
      tap((response) => {
        this._addresses$.next(response.data);
        this._defaultAddressId.set(response.meta.defaultAddressId || null);
        console.log('✅ Direcciones cargadas:', {
          total: response.meta.total,
          hasValidated: response.meta.hasValidatedAddresses
        });
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'cargar direcciones')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene una dirección específica por ID
   *
   * @param addressId - ID de la dirección
   * @returns Observable con la dirección
   *
   * @example
   * ```typescript
   * addressService.getAddressById('uuid-here').subscribe({
   *   next: (response) => console.log('Dirección:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getAddressById(addressId: string): Observable<AddressOperationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<AddressOperationResponse>(`${this.apiUrl}/${addressId}`).pipe(
      tap((response) => {
        console.log('✅ Dirección obtenida:', response.data.id);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'obtener dirección')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene la dirección predeterminada del usuario
   *
   * @returns Observable con la dirección predeterminada o null
   *
   * @example
   * ```typescript
   * addressService.getDefaultAddress().subscribe({
   *   next: (response) => {
   *     if (response.data) {
   *       console.log('Dirección por defecto:', response.data);
   *     } else {
   *       console.log('Sin dirección por defecto');
   *     }
   *   }
   * });
   * ```
   */
  getDefaultAddress(): Observable<DefaultAddressResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<DefaultAddressResponse>(`${this.apiUrl}/default/current`).pipe(
      tap((response) => {
        if (response.data) {
          this._defaultAddressId.set(response.data.id);
          console.log('✅ Dirección por defecto obtenida:', response.data.id);
        } else {
          console.log('ℹ️ Sin dirección por defecto configurada');
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'obtener dirección por defecto')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Crea una nueva dirección
   *
   * @param addressData - Datos de la dirección a crear
   * @returns Observable con la dirección creada
   *
   * @example
   * ```typescript
   * addressService.createAddress({
   *   recipientName: 'María González',
   *   phone: '+5491134567890',
   *   province: 'Buenos Aires',
   *   city: 'La Plata',
   *   postalCode: 'B1900',
   *   streetAddress: 'Calle 50 N° 456',
   *   isDefault: true
   * }).subscribe({
   *   next: (response) => console.log('Dirección creada:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  createAddress(addressData: CreateAddressDto): Observable<AddressOperationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<AddressOperationResponse>(this.apiUrl, addressData).pipe(
      tap((response) => {
        // Actualizar la lista local de direcciones
        const currentAddresses = this._addresses$.value;
        this._addresses$.next([...currentAddresses, response.data]);

        if (response.data.isDefault) {
          this._defaultAddressId.set(response.data.id);
        }

        console.log('✅ Dirección creada exitosamente:', response.data.id);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'crear dirección')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Actualiza una dirección existente
   *
   * @param addressId - ID de la dirección a actualizar
   * @param addressData - Datos a actualizar (parcial)
   * @returns Observable con la dirección actualizada
   *
   * @example
   * ```typescript
   * addressService.updateAddress('uuid-here', {
   *   phone: '+5491145678901',
   *   deliveryInstructions: 'Llamar antes de entregar'
   * }).subscribe({
   *   next: (response) => console.log('Dirección actualizada:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  updateAddress(addressId: string, addressData: UpdateAddressDto): Observable<AddressOperationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.patch<AddressOperationResponse>(`${this.apiUrl}/${addressId}`, addressData).pipe(
      tap((response) => {
        // Actualizar la dirección en la lista local
        const currentAddresses = this._addresses$.value;
        const updatedAddresses = currentAddresses.map(addr =>
          addr.id === addressId ? response.data : addr
        );
        this._addresses$.next(updatedAddresses);

        console.log('✅ Dirección actualizada exitosamente:', addressId);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'actualizar dirección')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Establece una dirección como predeterminada
   *
   * @param addressId - ID de la dirección a establecer como predeterminada
   * @returns Observable con la dirección actualizada
   *
   * @example
   * ```typescript
   * addressService.setDefaultAddress('uuid-here').subscribe({
   *   next: (response) => console.log('Dirección predeterminada:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  setDefaultAddress(addressId: string): Observable<AddressOperationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.patch<AddressOperationResponse>(`${this.apiUrl}/${addressId}/set-default`, {}).pipe(
      tap((response) => {
        // Actualizar todas las direcciones en la lista local
        const currentAddresses = this._addresses$.value;
        const updatedAddresses = currentAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        }));
        this._addresses$.next(updatedAddresses);
        this._defaultAddressId.set(addressId);

        console.log('✅ Dirección establecida como predeterminada:', addressId);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'establecer dirección predeterminada')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Valida una dirección
   *
   * @param addressId - ID de la dirección a validar
   * @returns Observable con el resultado de la validación
   *
   * @example
   * ```typescript
   * addressService.validateAddress('uuid-here').subscribe({
   *   next: (response) => {
   *     if (response.data.isValid) {
   *       console.log('Dirección válida');
   *     } else {
   *       console.log('Dirección inválida:', response.data.validationNotes);
   *     }
   *   }
   * });
   * ```
   */
  validateAddress(addressId: string): Observable<AddressValidationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<AddressValidationResponse>(`${this.apiUrl}/${addressId}/validate`, {}).pipe(
      tap((response) => {
        // Actualizar el estado de validación en la lista local
        const currentAddresses = this._addresses$.value;
        const updatedAddresses = currentAddresses.map(addr => {
          if (addr.id === addressId) {
            return {
              ...addr,
              isValidated: response.data.isValid,
              validationStatus: response.data.validationStatus
            };
          }
          return addr;
        });
        this._addresses$.next(updatedAddresses);

        console.log('✅ Dirección validada:', {
          addressId,
          isValid: response.data.isValid,
          status: response.data.validationStatus
        });
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'validar dirección')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Elimina una dirección (soft delete)
   *
   * @param addressId - ID de la dirección a eliminar
   * @returns Observable con la dirección eliminada
   *
   * @example
   * ```typescript
   * addressService.deleteAddress('uuid-here').subscribe({
   *   next: (response) => console.log('Dirección eliminada:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  deleteAddress(addressId: string): Observable<AddressOperationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.delete<AddressOperationResponse>(`${this.apiUrl}/${addressId}`).pipe(
      tap((response) => {
        // Remover la dirección de la lista local
        const currentAddresses = this._addresses$.value;
        const updatedAddresses = currentAddresses.filter(addr => addr.id !== addressId);
        this._addresses$.next(updatedAddresses);

        if (this._defaultAddressId() === addressId) {
          this._defaultAddressId.set(null);
        }

        console.log('✅ Dirección eliminada exitosamente:', addressId);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'eliminar dirección')),
      finalize(() => this._isLoading.set(false))
    );
  }

  // ========== PUBLIC METHODS - UTILITY ENDPOINTS ==========

  /**
   * Obtiene la lista de provincias de Argentina
   *
   * @returns Observable con el array de provincias
   *
   * @example
   * ```typescript
   * addressService.getProvinces().subscribe({
   *   next: (response) => console.log('Provincias:', response.data),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getProvinces(): Observable<ProvincesResponse> {
    return this.http.get<ProvincesResponse>(`${this.apiUrl}/utils/provinces`).pipe(
      tap((response) => {
        console.log('✅ Provincias obtenidas:', response.data.length);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'obtener provincias'))
    );
  }

  /**
   * Obtiene las ciudades de una provincia específica
   *
   * @param province - Nombre de la provincia
   * @returns Observable con las ciudades de la provincia
   *
   * @example
   * ```typescript
   * addressService.getCitiesByProvince('Buenos Aires').subscribe({
   *   next: (response) => console.log('Ciudades:', response.data.cities),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getCitiesByProvince(province: string): Observable<CitiesResponse> {
    const encodedProvince = encodeURIComponent(province);

    return this.http.get<CitiesResponse>(`${this.apiUrl}/utils/cities/${encodedProvince}`).pipe(
      tap((response) => {
        console.log('✅ Ciudades obtenidas para', province, ':', response.data.cities.length);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'obtener ciudades'))
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
   * Limpia la lista de direcciones del estado local
   */
  clearAddresses(): void {
    this._addresses$.next([]);
    this._defaultAddressId.set(null);
  }

  /**
   * Recarga las direcciones del usuario
   *
   * @returns Observable con la respuesta de direcciones
   */
  reloadAddresses(): Observable<AddressInterface> {
    console.log('🔄 Recargando direcciones...');
    return this.getAddresses();
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
