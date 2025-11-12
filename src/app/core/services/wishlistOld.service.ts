import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, combineLatest } from 'rxjs';
import { catchError, tap, finalize, switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProductsService, Product } from './products.service';
import {
  DataWishlist,
  DatumWishlist,
  SummaryWishlist,
  AddToWishlistRequest,
  MoveToCartRequest,
  WishlistQueryParams,
  WishlistActionResponse,
  WishlistCheckResponse,
  WishlistCountResponse,
  PriceChangesResponse,
  ViewProductResponse,
  WishlistDebugResponse,
  WishlistAnalyticsResponse,
  WishlistClearResponse
} from '../models/interfaces/wishlist.interface';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly productsService = inject(ProductsService);
  
  // URLs de la API
  private readonly wishlistUrl = `${environment.apiUrl}wishlist`;
  
  // Signals para estado reactivo
  private readonly wishlistDataSignal = signal<DataWishlist | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly quickCountSignal = signal<WishlistCountResponse['data'] | null>(null);
  
  // NUEVO: Signal para productos completos obtenidos por IDs
  private readonly fullProductsSignal = signal<Product[]>([]);
  private readonly isLoadingProductsSignal = signal(false);

  // Computed values públicos existentes
  readonly wishlistData = this.wishlistDataSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly quickCount = this.quickCountSignal.asReadonly();
  
  // Computed para datos derivados existentes
  readonly items = computed(() => this.wishlistDataSignal()?.data ?? []);
  readonly summary = computed(() => this.wishlistDataSignal()?.summary ?? null);
  readonly meta = computed(() => this.wishlistDataSignal()?.meta ?? null);
  readonly totalItems = computed(() => this.summary()?.totalItems ?? 0);
  readonly totalValue = computed(() => this.summary()?.totalValue ?? 0);
  readonly availableItems = computed(() => this.summary()?.availableItems ?? 0);
  readonly isEmpty = computed(() => this.totalItems() === 0);
  readonly hasItems = computed(() => this.totalItems() > 0);

  // NUEVOS: Computed para productos completos
  readonly fullProducts = this.fullProductsSignal.asReadonly();
  readonly isLoadingProducts = this.isLoadingProductsSignal.asReadonly();
  readonly productIds = computed(() => 
    this.items().map(item => item.product.id)
  );

  // ========== MÉTODOS EXISTENTES (mantengo los principales) ==========

  /**
   * 1. Obtener Wishlist con Paginación - GET /api/v1/wishlist
   */
  getWishlist(params: WishlistQueryParams = {}): Observable<DataWishlist> {
    this.isLoadingSignal.set(true);
    this.clearError();

    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<DataWishlist>(this.wishlistUrl, { params: httpParams }).pipe(
      tap(response => {
        this.wishlistDataSignal.set(response);
        this.syncQuickCount(response.summary);
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  /**
   * NUEVO: Obtener wishlist con productos completos usando getProductsByIds
   */
  getWishlistWithFullProducts(params: WishlistQueryParams = {}): Observable<Product[]> {
    return this.getWishlist(params).pipe(
      switchMap(wishlistData => {
        const productIds = wishlistData.data.map(item => item.product.id);
        
        if (productIds.length === 0) {
          this.fullProductsSignal.set([]);
          return [];
        }

        return this.getFullProductsByIds(productIds);
      })
    );
  }

  /**
   * NUEVO: Obtener productos completos por IDs de la wishlist
   */
  getFullProductsByIds(productIds: string[]): Observable<Product[]> {
    if (productIds.length === 0) {
      this.fullProductsSignal.set([]);
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    this.isLoadingProductsSignal.set(true);
    
    return this.productsService.getProductsByIds(productIds).pipe(
      map(response => response.data),
      tap(products => {
        this.fullProductsSignal.set(products);
      }),
      catchError(error => {
        console.error('Error al obtener productos completos:', error);
        this.fullProductsSignal.set([]);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingProductsSignal.set(false))
    );
  }

  /**
   * NUEVO: Refrescar productos completos de la wishlist actual
   */
  refreshFullProducts(): Observable<Product[]> {
    const currentIds = this.productIds();
    return this.getFullProductsByIds(currentIds);
  }

  // ========== MÉTODOS DE ACCIÓN ACTUALIZADOS ==========

  /**
   * 2. Agregar Producto a la Wishlist - POST /api/v1/wishlist/add
   */
  addToWishlist(request: AddToWishlistRequest): Observable<WishlistActionResponse> {
    this.isLoadingSignal.set(true);
    this.clearError();

    return this.http.post<WishlistActionResponse>(`${this.wishlistUrl}/add`, request).pipe(
      tap(response => {
        this.wishlistDataSignal.set(response.wishlist);
        this.syncQuickCount(response.wishlist.summary);
        // Refrescar productos completos automáticamente
        this.refreshFullProducts().subscribe();
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  /**
   * 3. Eliminar Producto de la Wishlist - DELETE /api/v1/wishlist/remove/{productId}
   */
  removeFromWishlist(productId: string): Observable<WishlistActionResponse> {
    this.isLoadingSignal.set(true);
    this.clearError();

    return this.http.delete<WishlistActionResponse>(`${this.wishlistUrl}/remove/${productId}`).pipe(
      tap(response => {
        this.wishlistDataSignal.set(response.wishlist);
        this.syncQuickCount(response.wishlist.summary);
        // Actualizar productos completos removiendo el eliminado
        const currentProducts = this.fullProductsSignal();
        const updatedProducts = currentProducts.filter(product => product.id !== productId);
        this.fullProductsSignal.set(updatedProducts);
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  /**
   * 4. Mover Producto al Carrito - POST /api/v1/wishlist/move-to-cart
   */
  moveToCart(request: MoveToCartRequest): Observable<WishlistActionResponse> {
    this.isLoadingSignal.set(true);
    this.clearError();

    return this.http.post<WishlistActionResponse>(`${this.wishlistUrl}/move-to-cart`, request).pipe(
      tap(response => {
        this.wishlistDataSignal.set(response.wishlist);
        this.syncQuickCount(response.wishlist.summary);
        
        if (request.removeFromWishlist) {
          const currentProducts = this.fullProductsSignal();
          const updatedProducts = currentProducts.filter(product => product.id !== request.productId);
          this.fullProductsSignal.set(updatedProducts);
        }
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  /**
   * 5. Limpiar Toda la Wishlist - DELETE /api/v1/wishlist/clear
   */
  clearWishlist(): Observable<WishlistClearResponse> {
    this.isLoadingSignal.set(true);
    this.clearError();

    return this.http.delete<WishlistClearResponse>(`${this.wishlistUrl}/clear`).pipe(
      tap(response => {
        this.wishlistDataSignal.set(response.wishlist);
        this.quickCountSignal.set({
          totalItems: 0,
          totalValue: 0,
          availableItems: 0,
          unavailableItems: 0
        });
        // Limpiar productos completos
        this.fullProductsSignal.set([]);
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  // ========== MÉTODOS UTILITARIOS ACTUALIZADOS ==========

  /**
   * Resetea todo el estado del servicio
   */
  resetState(): void {
    this.wishlistDataSignal.set(null);
    this.quickCountSignal.set(null);
    this.fullProductsSignal.set([]);
    this.clearError();
  }

  // ========== MÉTODOS PRIVADOS ==========

  private syncQuickCount(summary: SummaryWishlist): void {
    this.quickCountSignal.set({
      totalItems: summary.totalItems,
      totalValue: summary.totalValue,
      availableItems: summary.availableItems,
      unavailableItems: summary.unavailableItems
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      const apiError = error.error;
      
      switch (error.status) {
        case 400:
          errorMessage = apiError?.message || 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Producto no encontrado';
          break;
        case 409:
          errorMessage = apiError?.message || 'El producto ya está en tu lista de deseos';
          break;
        case 422:
          errorMessage = apiError?.message || 'Datos de validación incorrectos';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta nuevamente más tarde.';
          break;
        default:
          errorMessage = apiError?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    this.errorSignal.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  // ========== MÉTODOS ADICIONALES PARA MANTENER COMPATIBILIDAD ==========

  checkProductInWishlist(productId: string): Observable<WishlistCheckResponse> {
    return this.http.get<WishlistCheckResponse>(`${this.wishlistUrl}/check/${productId}`);
  }

  getWishlistCount(): Observable<WishlistCountResponse> {
    return this.http.get<WishlistCountResponse>(`${this.wishlistUrl}/count`).pipe(
      tap(response => this.quickCountSignal.set(response.data))
    );
  }

  incrementViewCount(productId: string): Observable<ViewProductResponse> {
    return this.http.post<ViewProductResponse>(`${this.wishlistUrl}/view/${productId}`, {});
  }

  isProductInWishlist(productId: string): boolean {
    return this.items().some(item => item.product.id === productId);
  }
}
