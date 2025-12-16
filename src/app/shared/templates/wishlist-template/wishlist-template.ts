import {
  Component,
  OnInit,
  inject,
  DestroyRef,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError, finalize } from 'rxjs/operators';
import { EMPTY, throwError } from 'rxjs';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service'; // ✅ Agregar import
import { ProductCard } from '../../molecules/product-card/product-card';
import { Paginator, PaginationEvent } from '../../molecules/paginator/paginator';
import type { DataWishlist, WishlistQueryParams } from '../../../core/models/interfaces/wishlist.interface';
import type { Datum as ProductDatum } from '../../../core/models/interfaces/Product.interface';

@Component({
  selector: 'app-wishlist-template',
  imports: [ProductCard, Paginator],
  templateUrl: './wishlist-template.html',
  styleUrl: './wishlist-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistTemplate implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly wishlistService = inject(WishlistService);
  private readonly cartService = inject(CartService); // ✅ Inyectar CartService
  private readonly router = inject(Router);

  // State management con signals
  private readonly _wishlistData = signal<DataWishlist | null>(null);
  private readonly _fullProducts = signal<ProductDatum[]>([]);
  private readonly _localLoading = signal(false);
  private readonly _localError = signal<string | null>(null);
  private readonly _currentParams = signal<WishlistQueryParams>({ page: 1, limit: 10 });
  private readonly _isProcessing = signal(false);
  private readonly _processingProductId = signal<string | null>(null);

  // Computed values
  readonly wishlistData = computed(() => this._wishlistData());
  readonly fullProducts = computed(() => this._fullProducts());
  readonly items = computed(() => this._wishlistData()?.data || []);
  readonly meta = computed(() => this._wishlistData()?.meta);
  readonly summary = computed(() => this._wishlistData()?.summary);
  readonly currentParams = computed(() => this._currentParams());

  readonly isLoading = computed(() =>
    this._localLoading() ||
    this.wishlistService.isLoading() ||
    this.wishlistService.isLoadingProducts()
  );

  readonly error = computed(() => this._localError() || this.wishlistService.errorMessage());
  readonly hasItems = computed(() => this.fullProducts().length > 0);
  readonly isEmpty = computed(() => !this.hasItems());

  readonly itemCount = computed(() => this.summary()?.totalItems ?? 0);
  readonly totalValue = computed(() => this.summary()?.totalValue ?? 0);
  readonly availableItems = computed(() => this.summary()?.availableItems ?? 0);
  readonly itemsOnSale = computed(() => this.summary()?.itemsOnSale ?? 0);

  readonly texts = {
    title: 'Mis Productos Favoritos',
    titleIcon: '💝',
    countSingular: 'producto',
    countPlural: 'productos',
    clearButtonText: 'Limpiar todo',
    clearButtonAriaLabel: 'Limpiar lista de favoritos',
    exploreText: '¿Buscas algo más especial?',
    exploreButtonText: 'Descubrir más productos',
    exploreIcon: '✨',
    exploreArrow: '→',
    emptyIcon: '❤️',
    emptyTitle: 'Tu lista de favoritos está vacía',
    emptyDescription: 'Explora nuestros productos y marca como favoritos los que más te gusten',
    emptyButtonText: 'Explorar productos',
    loadingText: 'Cargando tus productos favoritos...',
    errorTitle: 'Error al cargar favoritos',
    retryButtonText: 'Intentar nuevamente',
    clearConfirmMessage: '¿Estás seguro de que quieres eliminar todos los productos de tu lista de favoritos?',
    clearingText: 'Limpiando lista...'
  };

  ngOnInit(): void {
    this.loadWishlist();
  }

  // ========== MÉTODOS PÚBLICOS - PAGINACIÓN ==========

  onPageChange(event: PaginationEvent): void {
    this.updateParams({
      page: event.page,
      limit: event.limit
    });

    this.loadWishlistWithParams(this.currentParams());
  }

  // ========== MÉTODOS PÚBLICOS - ACCIONES ==========

  handleRemove(productId: string): void {

    this._localLoading.set(true);

    this.wishlistService.removeFromWishlist(productId)
      .pipe(
        tap((response) => {
          this._wishlistData.set(response.wishlist);
          this._fullProducts.update(products =>
            products.filter(p => p.id !== productId)
          );        }),
        catchError((error) => {
          console.error('❌ Error al remover:', error);
          this._localError.set('No se pudo eliminar el producto');
          return EMPTY;
        }),
        finalize(() => this._localLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  handleMoveToCart(data: { productId: string; quantity: number }): void {
    this._isProcessing.set(true);
    this._processingProductId.set(data.productId);

    this.wishlistService
      .moveToCart({
        productId: data.productId,
        quantity: data.quantity,
        removeFromWishlist: true,
      })
      .pipe(
        tap((response) => {
          // Actualizar wishlist local
          this._wishlistData.set(response.wishlist);
          this._fullProducts.update((products) =>
            products.filter((p) => p.id !== data.productId)
          );

          // ✅ NUEVO: Recargar el carrito para actualizar el badge
          this.cartService.getCart().subscribe({
            next: () => {},
            error: (err) => console.error('❌ Error al actualizar carrito:', err)
          });
        }),
        catchError((error) => {
          console.error('❌ Error al mover al carrito:', error);
          this._localError.set(
            error?.message || 'Error al mover el producto al carrito'
          );
          return throwError(() => error);
        }),
        finalize(() => {
          this._isProcessing.set(false);
          this._processingProductId.set(null);
        })
      )
      .subscribe();
  }

  clearWishlist(): void {
    if (!confirm(this.texts.clearConfirmMessage)) {
      return;
    }

    this._localLoading.set(true);

    this.wishlistService.clearWishlist()
      .pipe(
        tap((response) => {
          this._wishlistData.set(response.wishlist);
          this._fullProducts.set([]);
        }),
        catchError((error) => {
          console.error('❌ Error al limpiar wishlist:', error);
          this._localError.set('No se pudo limpiar la wishlist');
          return EMPTY;
        }),
        finalize(() => this._localLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  retryLoad(): void {
    this.clearError();
    this.reloadWishlist();
  }

  reloadWishlist(): void {
    this.loadWishlist();
  }

  clearError(): void {
    this._localError.set(null);
  }

  // ========== MÉTODOS PRIVADOS ==========

  private initializeParams(): void {
    this._currentParams.set({ page: 1, limit: 10 });
  }

  private loadWishlist(): void {
    this.initializeParams();
    this.loadWishlistWithParams(this.currentParams());
  }

  private updateParams(newParams: WishlistQueryParams): void {
    this._currentParams.set({ ...this._currentParams(), ...newParams });
  }

  private loadWishlistWithParams(params: WishlistQueryParams): void {
    this._localLoading.set(true);
    this._localError.set(null);

    this.wishlistService.getWishlistWithFullProducts(params)
      .pipe(
        tap((products: ProductDatum[]) => {
          const wishlistData = this.wishlistService.wishlist();
          this._wishlistData.set(wishlistData);
          this._fullProducts.set(products);
        }),
        catchError((error) => {
          const errorMessage = error?.error?.message || 'Error al cargar la wishlist';
          this._localError.set(errorMessage);
          console.error('❌ Error al cargar wishlist:', error);
          return EMPTY;
        }),
        finalize(() => this._localLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
