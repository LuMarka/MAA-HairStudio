import { Injectable, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
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

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID); // ✅ Inyectar PLATFORM_ID
  private readonly baseUrl = `${environment.apiUrl}wishlist`;

  // Keys para localStorage
  private readonly WISHLIST_IDS_KEY = 'maa_wishlist_ids';
  private readonly WISHLIST_DATA_KEY = 'maa_wishlist_data';

  // ✅ Verificar si estamos en el navegador
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Signals para estado reactivo
  private readonly wishlistData = signal<DataWishlist | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  private readonly wishlistedProductIds = signal<Set<string>>(new Set());

  // Computed signals públicos
  readonly wishlist = this.wishlistData.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly totalItems = computed(() => this.wishlistData()?.summary.totalItems ?? 0);
  readonly totalValue = computed(() => this.wishlistData()?.summary.totalValue ?? 0);
  readonly availableItems = computed(() => this.wishlistData()?.summary.availableItems ?? 0);
  readonly itemsOnSale = computed(() => this.wishlistData()?.summary.itemsOnSale ?? 0);

  constructor() {
    // ✅ Solo restaurar en el navegador
    if (this.isBrowser) {
      this.restoreStateFromStorage();
    }

    // ✅ Sincronizar con servidor cuando el usuario esté autenticado
    effect(() => {
      if (this.authService.isAuthenticated() && this.isBrowser) {
        this.syncWithServer();
      } else {
        this.resetState();
      }
    });

    // ✅ Persistir cambios en localStorage (solo en navegador)
    effect(() => {
      const ids = this.wishlistedProductIds();
      const data = this.wishlistData();

      if ((ids.size > 0 || data) && this.isBrowser) {
        this.saveStateToStorage();
      }
    });
  }

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
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

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

  moveToCart(request: MoveToCartRequest): Observable<WishlistActionResponse> {
    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.post<WishlistActionResponse>(`${this.baseUrl}/move-to-cart`, request).pipe(
      tap((response) => {
        this.wishlistData.set(response.wishlist);
        this.updateWishlistedProductIds(response.wishlist);
        this.isLoadingSignal.set(false);
      }),
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

  clearWishlist(): Observable<WishlistClearResponse> {
    this.isLoadingSignal.set(true);
    this.error.set(null);

    return this.http.delete<WishlistClearResponse>(`${this.baseUrl}/clear`).pipe(
      tap((response) => {
        this.wishlistData.set(response.wishlist);
        this.wishlistedProductIds.set(new Set());
        this.isLoadingSignal.set(false);
      }),
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

  private updateWishlistedProductIds(wishlist: DataWishlist): void {
    const productIds = new Set(wishlist.data.map(item => item.product.id));
    this.wishlistedProductIds.set(productIds);
  }

  // ✅ Solo guarda si estamos en el navegador
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

  // ✅ Solo restaura si estamos en el navegador
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

  // ✅ Solo limpia si estamos en el navegador
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
    this.isLoadingSignal.set(false);
    this.error.set(null);
    this.clearStorage();
  }

  private handleError(error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Ha ocurrido un error desconocido';
    this.error.set(errorMessage);
    this.isLoadingSignal.set(false);
    console.error('Error en WishlistService:', error);
  }
}