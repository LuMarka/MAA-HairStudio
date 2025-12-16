import { Injectable, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import type {
  CartInterface,
  Datum,
  Summary,
  Cart,
  CartQueryParams,
  AddToCartRequest,
  CartActionResponse,
  UpdateCartRequest,
  CartSummaryResponse,
  CartCountResponse,
  CartValidationResponse,
  AbandonedCartsResponse
} from '../models/interfaces/cart.interface';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = `${environment.apiUrl}cart`;

  // Verificar si estamos en el navegador
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Signals para estado reactivo
  private readonly cartData = signal<CartInterface | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly error = signal<string | null>(null);

  // Signal para IDs de productos en carrito (para búsquedas rápidas)
  private readonly cartProductIds = signal<Set<string>>(new Set());

  // Computed signals públicos
  readonly cart = this.cartData.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  // Computed del resumen
  readonly summary = computed(() => this.cartData()?.summary ?? null);
  readonly totalItems = computed(() => this.cartData()?.summary.totalItems ?? 0);
  readonly totalQuantity = computed(() => this.cartData()?.summary.totalQuantity ?? 0);
  readonly subtotal = computed(() => this.cartData()?.summary.subtotal ?? 0);
  readonly totalDiscount = computed(() => this.cartData()?.summary.totalDiscount ?? 0);
  readonly totalAmount = computed(() => this.cartData()?.summary.totalAmount ?? 0);
  readonly estimatedTax = computed(() => this.cartData()?.summary.estimatedTax ?? 0);
  readonly estimatedShipping = computed(() => this.cartData()?.summary.estimatedShipping ?? 0);
  readonly estimatedTotal = computed(() => this.cartData()?.summary.estimatedTotal ?? 0);

  // Computed de los items
  readonly items = computed(() => this.cartData()?.data ?? []);
  readonly hasItems = computed(() => this.items().length > 0);
  readonly isEmpty = computed(() => !this.hasItems());

  constructor() {
    // ✅ SIMPLIFICADO: Solo sincronizar con servidor cuando el usuario esté autenticado
    effect(() => {
      if (this.authService.isAuthenticated() && this.isBrowser) {
        this.syncWithServer();
      } else {
        this.resetState();
      }
    });
  }

  // ========== MÉTODOS PÚBLICOS ==========

  /**
   * Verifica si un producto está en el carrito
   */
  isProductInCart(productId: string): boolean {
    return this.cartProductIds().has(productId);
  }

  /**
   * Obtiene la cantidad de un producto en el carrito
   */
  getProductQuantity(productId: string): number {
    const items = this.items();
    const item = items.find(i => i.product.id === productId);
    return item?.quantity ?? 0;
  }

  /**
   * Obtiene todo el carrito con paginación
   */
  getCart(params?: CartQueryParams): Observable<CartInterface> {
    this.isLoadingSignal.set(true);
    this.error.set(null);

    let httpParams = new HttpParams();
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<CartInterface>(this.baseUrl, { params: httpParams }).pipe(
      tap((data) => {
        this.cartData.set(data);
        this.updateCartProductIds(data);
        this.isLoadingSignal.set(false);
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Agrega un producto al carrito
   */
  addToCart(request: AddToCartRequest): Observable<CartActionResponse> {
    if (this.isProductInCart(request.productId)) {
      console.warn('⚠️ El producto ya está en el carrito. Usa updateCart para modificar la cantidad.');
    }

    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.post<CartActionResponse>(`${this.baseUrl}/add`, request).pipe(
      tap((response) => {
        this.cartData.set(response.cart);
        this.updateCartProductIds(response.cart);
        this.isLoadingSignal.set(false);
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Actualiza un item del carrito
   */
  updateCart(request: UpdateCartRequest): Observable<CartActionResponse> {
    if (!this.isProductInCart(request.productId)) {
      console.warn('⚠️ El producto no está en el carrito');
      return throwError(() => new Error('El producto no está en el carrito'));
    }

    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.patch<CartActionResponse>(`${this.baseUrl}/update`, request).pipe(
      tap((response) => {
        this.cartData.set(response.cart);
        this.updateCartProductIds(response.cart);
        this.isLoadingSignal.set(false);
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Incrementa la cantidad de un producto
   */
  incrementQuantity(productId: string, amount: number = 1): Observable<CartActionResponse> {
    return this.updateCart({
      productId,
      quantity: amount,
      action: 'increment'
    });
  }

  /**
   * Decrementa la cantidad de un producto
   */
  decrementQuantity(productId: string, amount: number = 1): Observable<CartActionResponse> {
    return this.updateCart({
      productId,
      quantity: amount,
      action: 'decrement'
    });
  }

  /**
   * Establece una cantidad específica
   */
  setQuantity(productId: string, quantity: number, note?: string): Observable<CartActionResponse> {
    return this.updateCart({
      productId,
      quantity,
      action: 'set',
      note
    });
  }

  /**
   * Elimina un producto del carrito
   */
  removeFromCart(productId: string): Observable<CartActionResponse> {
    if (!this.isProductInCart(productId)) {
      console.warn('⚠️ El producto no está en el carrito');
      return throwError(() => new Error('El producto no está en el carrito'));
    }

    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.delete<CartActionResponse>(`${this.baseUrl}/remove/${productId}`).pipe(
      tap((response) => {
        this.cartData.set(response.cart);
        this.updateCartProductIds(response.cart);
        this.isLoadingSignal.set(false);
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Limpia todo el carrito
   */
  clearCart(): Observable<CartActionResponse> {
    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.delete<CartActionResponse>(`${this.baseUrl}/clear`).pipe(
      tap((response) => {
        this.cartData.set(response.cart);
        this.cartProductIds.set(new Set());
        this.isLoadingSignal.set(false);
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene el resumen del carrito
   */
  getCartSummary(): Observable<CartSummaryResponse> {
    return this.http.get<CartSummaryResponse>(`${this.baseUrl}/summary`).pipe(
      tap((response) => {
        const currentCart = this.cartData();
        if (currentCart) {
          this.cartData.update(cart => {
            if (!cart) return null;
            return { ...cart, summary: response.data };
          });
        }
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene conteo rápido del carrito
   */
  getCartCount(): Observable<CartCountResponse> {
    return this.http.get<CartCountResponse>(`${this.baseUrl}/count`).pipe(
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Valida disponibilidad de productos en el carrito
   */
  validateCart(): Observable<CartValidationResponse> {
    return this.http.get<CartValidationResponse>(`${this.baseUrl}/validate`).pipe(
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene carritos abandonados (Admin)
   */
  getAbandonedCarts(hours: number = 24, params?: CartQueryParams): Observable<AbandonedCartsResponse> {
    let httpParams = new HttpParams().set('hours', hours.toString());

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<AbandonedCartsResponse>(`${this.baseUrl}/abandoned`, { params: httpParams }).pipe(
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Sincroniza con el servidor cuando el usuario se autentica
   */
  private syncWithServer(): void {
    if (!this.authService.hasValidToken()) {
      return;
    }

    this.getCart().subscribe({
      next: () => {},
      error: (err) => {
        console.error('❌ Error al sincronizar carrito:', err);
      }
    });
  }

  /**
   * Actualiza el Set de IDs de productos en carrito
   */
  private updateCartProductIds(cart: CartInterface): void {
    const productIds = new Set(cart.data.map(item => item.product.id));
    this.cartProductIds.set(productIds);
  }

  /**
   * Resetea el estado del servicio
   */
  resetState(): void {
    this.cartData.set(null);
    this.cartProductIds.set(new Set());
    this.isLoadingSignal.set(false);
    this.error.set(null);
  }

  /**
   * Maneja errores de las peticiones HTTP
   */
  private handleError(error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Ha ocurrido un error desconocido';
    this.error.set(errorMessage);
    this.isLoadingSignal.set(false);
    console.error('Error en CartService:', error);
  }
}
