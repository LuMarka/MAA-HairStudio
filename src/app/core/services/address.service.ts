import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  AddressInterface,
  Datum as AddressData,
  AddressOperationResponse,
  DefaultAddressResponse,
  CreateAddressDto,
  UpdateAddressDto,
  AddressValidationResponse
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
  // ✅ Cambiar de BehaviorSubject a signal para reactividad con computed
  private readonly _addresses = signal<AddressData[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _defaultAddressId = signal<string | null>(null);

  // ========== COMPUTED VALUES ==========
  readonly addresses = computed(() => this._addresses());
  readonly isLoading = computed(() => this._isLoading());
  readonly errorMessage = computed(() => this._errorMessage());
  readonly hasAddresses = computed(() => this._addresses().length > 0);
  readonly defaultAddress = computed(() =>
    this._addresses().find(addr => addr.id === this._defaultAddressId())
  );
  readonly validatedAddresses = computed(() =>
    this._addresses().filter(addr => addr.isValidated)
  );
  readonly activeAddresses = computed(() =>
    this._addresses().filter(addr => addr.isActive)
  );

  // ========== PUBLIC METHODS - CRUD OPERATIONS ==========

  /**
   * Obtiene todas las direcciones del usuario autenticado
   */
  getAddresses(): Observable<AddressInterface> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<AddressInterface>(this.apiUrl).pipe(
      tap((response) => {
        this._addresses.set(response.data);
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
   */
  createAddress(addressData: CreateAddressDto): Observable<AddressOperationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<AddressOperationResponse>(this.apiUrl, addressData).pipe(
      tap((response) => {
        // Actualizar la lista local de direcciones
        this._addresses.update(current => [...current, response.data]);

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
   */
  updateAddress(addressId: string, addressData: UpdateAddressDto): Observable<AddressOperationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.patch<AddressOperationResponse>(`${this.apiUrl}/${addressId}`, addressData).pipe(
      tap((response) => {
        // Actualizar la dirección en la lista local
        this._addresses.update(current =>
          current.map(addr =>
            addr.id === addressId ? response.data : addr
          )
        );

        console.log('✅ Dirección actualizada exitosamente:', addressId);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'actualizar dirección')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Establece una dirección como predeterminada
   */
  setDefaultAddress(addressId: string): Observable<AddressOperationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.patch<AddressOperationResponse>(`${this.apiUrl}/${addressId}/set-default`, {}).pipe(
      tap((response) => {
        // Actualizar todas las direcciones en la lista local
        this._addresses.update(current =>
          current.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId
          }))
        );
        this._defaultAddressId.set(addressId);

        console.log('✅ Dirección establecida como predeterminada:', addressId);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'establecer dirección predeterminada')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Valida una dirección
   */
  validateAddress(addressId: string): Observable<AddressValidationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<AddressValidationResponse>(`${this.apiUrl}/${addressId}/validate`, {}).pipe(
      tap((response) => {
        // Actualizar el estado de validación en la lista local
        this._addresses.update(current =>
          current.map(addr => {
            if (addr.id === addressId) {
              return {
                ...addr,
                isValidated: response.data.isValid,
                validationStatus: response.data.validationStatus
              };
            }
            return addr;
          })
        );

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
   */
  deleteAddress(addressId: string): Observable<AddressOperationResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.delete<AddressOperationResponse>(`${this.apiUrl}/${addressId}`).pipe(
      tap((response) => {
        // Remover la dirección de la lista local
        this._addresses.update(current =>
          current.filter(addr => addr.id !== addressId)
        );

        if (this._defaultAddressId() === addressId) {
          this._defaultAddressId.set(null);
        }

        console.log('✅ Dirección eliminada exitosamente:', addressId);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'eliminar dirección')),
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
   * Limpia la lista de direcciones del estado local
   */
  clearAddresses(): void {
    this._addresses.set([]);
    this._defaultAddressId.set(null);
  }

  /**
   * Recarga las direcciones del usuario
   */
  reloadAddresses(): Observable<AddressInterface> {
    console.log('🔄 Recargando direcciones...');
    return this.getAddresses();
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
        operation
      });
    }

    this._errorMessage.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
