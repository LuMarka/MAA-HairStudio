import { Injectable, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, switchMap, map, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ProductsService } from './products.service';
import type {
  DataWishlist,
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
  WishlistClearResponse,
} from '../models/interfaces/wishlist.interface';
import type { Datum as ProductDatum } from '../models/interfaces/Product.interface';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly productsService = inject(ProductsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = `${environment.apiUrl}wishlist`;

  // Keys para localStorage
  private readonly WISHLIST_IDS_KEY = 'maa_wishlist_ids';
  private readonly WISHLIST_DATA_KEY = 'maa_wishlist_data';

  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Signals para estado reactivo
  private readonly wishlistData = signal<DataWishlist | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  private readonly wishlistedProductIds = signal<Set<string>>(new Set());

  // ✅ NUEVO: Signal para productos completos (formato Datum)
  private readonly fullProductsSignal = signal<ProductDatum[]>([]);
  private readonly isLoadingProductsSignal = signal<boolean>(false);

  // Computed signals públicos
  readonly wishlist = this.wishlistData.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly totalItems = computed(() => this.wishlistData()?.summary.totalItems ?? 0);
  readonly totalValue = computed(() => this.wishlistData()?.summary.totalValue ?? 0);
  readonly availableItems = computed(() => this.wishlistData()?.summary.availableItems ?? 0);
  readonly itemsOnSale = computed(() => this.wishlistData()?.summary.itemsOnSale ?? 0);

  // ✅ NUEVO: Computed para productos completos
  readonly fullProducts = this.fullProductsSignal.asReadonly();
  readonly isLoadingProducts = this.isLoadingProductsSignal.asReadonly();
  readonly productIds = computed(() =>
    this.wishlistData()?.data.map(item => item.product.id) ?? []
  );

  constructor() {
    if (this.isBrowser) {
      this.restoreStateFromStorage();
    }

    effect(() => {
      if (this.authService.isAuthenticated() && this.isBrowser) {
        this.syncWithServer();
      } else {
        this.resetState();
      }
    });

    effect(() => {
      const ids = this.wishlistedProductIds();
      const data = this.wishlistData();

      if ((ids.size > 0 || data) && this.isBrowser) {
        this.saveStateToStorage();
      }
    });
  }

  // ========== MÉTODOS PÚBLICOS EXISTENTES ==========

  isProductInWishlist(productId: string): boolean {
    return this.wishlistedProductIds().has(productId);
  }

  private syncWithServer(): void {
    if (!this.authService.hasValidToken()) {
      return;
    }

    this.getWishlist().subscribe({
      next: () => {
        console.log('✅ Wishlist sincronizada con servidor');
      },
      error: (err) => {
        console.error('❌ Error al sincronizar wishlist:', err);
      }
    });
  }

  getWishlist(params?: WishlistQueryParams): Observable<DataWishlist> {
    this.isLoadingSignal.set(true);
    this.error.set(null);

    let httpParams = new HttpParams();
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<DataWishlist>(this.baseUrl, { params: httpParams }).pipe(
      tap((data) => {
        this.wishlistData.set(data);
        this.updateWishlistedProductIds(data);
        this.isLoadingSignal.set(false);
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  // ========== ✅ NUEVOS MÉTODOS PARA PRODUCTOS COMPLETOS ==========

  /**
   * ✅ Obtiene la wishlist con productos completos en formato Datum
   * Útil para product-card que espera la interfaz Datum de products
   */
  getWishlistWithFullProducts(params?: WishlistQueryParams): Observable<ProductDatum[]> {
    return this.getWishlist(params).pipe(
      switchMap(wishlistData => {
        const productIds = wishlistData.data.map(item => item.product.id);

        if (productIds.length === 0) {
          this.fullProductsSignal.set([]);
          return new Observable<ProductDatum[]>(observer => {
            observer.next([]);
            observer.complete();
          });
        }

        return this.getFullProductsByIds(productIds);
      })
    );
  }

  /**
   * ✅ Obtiene productos completos por IDs (formato Datum)
   * Usa el endpoint de ProductsService que devuelve productos completos
   */
  getFullProductsByIds(productIds: string[]): Observable<ProductDatum[]> {
    if (productIds.length === 0) {
      this.fullProductsSignal.set([]);
      return new Observable<ProductDatum[]>(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    this.isLoadingProductsSignal.set(true);

    return this.productsService.getProductsByIds(productIds).pipe(
      map(response => response.data),
      tap(products => {
        this.fullProductsSignal.set(products);
        console.log('✅ Productos completos cargados:', products.length);
      }),
      catchError(error => {
        console.error('❌ Error al obtener productos completos:', error);
        this.fullProductsSignal.set([]);
        this.handleError(error);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingProductsSignal.set(false))
    );
  }

  /**
   * ✅ Refresca los productos completos de la wishlist actual
   * Útil después de agregar/eliminar productos
   */
  refreshFullProducts(): Observable<ProductDatum[]> {
    const currentIds = this.productIds();
    return this.getFullProductsByIds(currentIds);
  }

  // ========== MÉTODOS DE ACCIÓN ACTUALIZADOS ==========

  addToWishlist(request: AddToWishlistRequest): Observable<WishlistActionResponse> {
    if (this.isProductInWishlist(request.productId)) {
      console.warn('⚠️ El producto ya está en la wishlist');
      return throwError(() => new Error('El producto ya está en tu wishlist'));
    }

    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.post<WishlistActionResponse>(`${this.baseUrl}/add`, request).pipe(
      tap((response) => {
        this.wishlistData.set(response.wishlist);
        this.updateWishlistedProductIds(response.wishlist);
        this.isLoadingSignal.set(false);

        // ✅ Refrescar productos completos automáticamente
        if (this.fullProducts().length > 0) {
          this.refreshFullProducts().subscribe();
        }
      }),
      catchError((err) => {
        if (err.status === 409) {
          this.wishlistedProductIds.update(ids => {
            const newIds = new Set(ids);
            newIds.add(request.productId);
            return newIds;
          });
        }
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  removeFromWishlist(productId: string): Observable<WishlistActionResponse> {
    if (!this.isProductInWishlist(productId)) {
      console.warn('⚠️ El producto no está en la wishlist');
      return throwError(() => new Error('El producto no está en tu wishlist'));
    }

    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.delete<WishlistActionResponse>(`${this.baseUrl}/remove/${productId}`).pipe(
      tap((response) => {
        this.wishlistData.set(response.wishlist);
        this.updateWishlistedProductIds(response.wishlist);
        this.isLoadingSignal.set(false);

        // ✅ Actualizar productos completos removiendo el eliminado
        this.fullProductsSignal.update(products =>
          products.filter(product => product.id !== productId)
        );
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  moveToCart(request: MoveToCartRequest): Observable<WishlistActionResponse> {
    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.post<WishlistActionResponse>(`${this.baseUrl}/move-to-cart`, request).pipe(
      tap((response) => {
        this.wishlistData.set(response.wishlist);
        this.updateWishlistedProductIds(response.wishlist);
        this.isLoadingSignal.set(false);

        // ✅ Si se remueve de wishlist, actualizar productos completos
        if (request.removeFromWishlist) {
          this.fullProductsSignal.update(products =>
            products.filter(product => product.id !== request.productId)
          );
        }
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  clearWishlist(): Observable<WishlistClearResponse> {
    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.delete<WishlistClearResponse>(`${this.baseUrl}/clear`).pipe(
      tap((response) => {
        this.wishlistData.set(response.wishlist);
        this.wishlistedProductIds.set(new Set());
        this.fullProductsSignal.set([]); // ✅ Limpiar productos completos
        this.isLoadingSignal.set(false);
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  // ========== MÉTODOS EXISTENTES (sin cambios) ==========

  checkProductInWishlist(productId: string): Observable<WishlistCheckResponse> {
    return this.http.get<WishlistCheckResponse>(`${this.baseUrl}/check/${productId}`).pipe(
      tap((response) => {
        if (response.data.inWishlist) {
          this.wishlistedProductIds.update(ids => {
            const newIds = new Set(ids);
            newIds.add(productId);
            return newIds;
          });
        } else {
          this.wishlistedProductIds.update(ids => {
            const newIds = new Set(ids);
            newIds.delete(productId);
            return newIds;
          });
        }
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  getWishlistCount(): Observable<WishlistCountResponse> {
    return this.http.get<WishlistCountResponse>(`${this.baseUrl}/count`).pipe(
      tap((response) => {
        const currentData = this.wishlistData();
        if (currentData) {
          this.wishlistData.update((data) => {
            if (!data) return null;
            return {
              ...data,
              summary: {
                ...data.summary,
                totalItems: response.data.totalItems,
                totalValue: response.data.totalValue,
                availableItems: response.data.availableItems,
                unavailableItems: response.data.unavailableItems,
              },
            };
          });
        }
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  getPriceChanges(): Observable<PriceChangesResponse> {
    return this.http.get<PriceChangesResponse>(`${this.baseUrl}/price-changes`).pipe(
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  viewProduct(productId: string): Observable<ViewProductResponse> {
    return this.http.post<ViewProductResponse>(`${this.baseUrl}/view/${productId}`, {}).pipe(
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  getDebugInfo(): Observable<WishlistDebugResponse> {
    return this.http.get<WishlistDebugResponse>(`${this.baseUrl}/debug/states`).pipe(
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  getAnalytics(): Observable<WishlistAnalyticsResponse> {
    return this.http.get<WishlistAnalyticsResponse>(`${this.baseUrl}/analytics`).pipe(
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  // ========== MÉTODOS PRIVADOS ==========

  private updateWishlistedProductIds(wishlist: DataWishlist): void {
    const productIds = new Set(wishlist.data.map(item => item.product.id));
    this.wishlistedProductIds.set(productIds);
  }

  private saveStateToStorage(): void {
    if (!this.isBrowser) return;

    try {
      const ids = Array.from(this.wishlistedProductIds());
      localStorage.setItem(this.WISHLIST_IDS_KEY, JSON.stringify(ids));

      const data = this.wishlistData();
      if (data) {
        localStorage.setItem(this.WISHLIST_DATA_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error al guardar wishlist en localStorage:', error);
    }
  }

  private restoreStateFromStorage(): void {
    if (!this.isBrowser) return;

    try {
      const idsJson = localStorage.getItem(this.WISHLIST_IDS_KEY);
      if (idsJson) {
        const ids = JSON.parse(idsJson) as string[];
        this.wishlistedProductIds.set(new Set(ids));
      }

      const dataJson = localStorage.getItem(this.WISHLIST_DATA_KEY);
      if (dataJson) {
        const data = JSON.parse(dataJson) as DataWishlist;
        this.wishlistData.set(data);
      }
    } catch (error) {
      console.error('Error al restaurar wishlist desde localStorage:', error);
      this.clearStorage();
    }
  }

  private clearStorage(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(this.WISHLIST_IDS_KEY);
      localStorage.removeItem(this.WISHLIST_DATA_KEY);
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }

  resetState(): void {
    this.wishlistData.set(null);
    this.wishlistedProductIds.set(new Set());
    this.fullProductsSignal.set([]); // ✅ Limpiar productos completos
    this.isLoadingSignal.set(false);
    this.isLoadingProductsSignal.set(false);
    this.error.set(null);
    this.clearStorage();
  }

  private handleError(error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Ha ocurrido un error desconocido';
    this.error.set(errorMessage);
    this.isLoadingSignal.set(false);
    this.isLoadingProductsSignal.set(false);
    console.error('Error en WishlistService:', error);
  }
}
