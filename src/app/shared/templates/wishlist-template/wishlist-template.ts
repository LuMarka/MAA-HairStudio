import { Component, computed, inject, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ProductCard } from '../../molecules/product-card/product-card';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../../core/services/products.service';

@Component({
  selector: 'app-wishlist-template',
  imports: [ProductCard, CommonModule],
  templateUrl: './wishlist-template.html',
  styleUrl: './wishlist-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistTemplate implements OnInit {
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ACTUALIZADO: Usar productos completos en lugar de items de wishlist
  readonly products = computed(() => this.wishlistService.fullProducts());
  readonly isLoadingProducts = computed(() => this.wishlistService.isLoadingProducts());
  
  // Mantener computed values existentes para compatibilidad
  readonly itemCount = computed(() => this.wishlistService.totalItems());
  readonly isLoading = computed(() => this.wishlistService.isLoading());
  readonly error = computed(() => this.wishlistService.error());
  readonly isEmpty = computed(() => this.wishlistService.isEmpty());

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
    this.loadWishlistWithProducts();
  }

  private loadWishlistWithProducts(): void {
    // ACTUALIZADO: Cargar wishlist con productos completos
    this.wishlistService.getWishlistWithFullProducts({ page: 1, limit: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products: Product[]) => {
          console.log('Wishlist con productos completos cargada:', products.length);
        },
        error: (error) => {
          console.error('Error al cargar wishlist con productos:', error);
        }
      });
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  clearWishlist(): void {
    if (confirm(this.texts.clearConfirmMessage)) {
      this.wishlistService.clearWishlist()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            console.log('Wishlist limpiada exitosamente');
          },
          error: () => {
            console.error('Error al limpiar wishlist');
          }
        });
    }
  }

  retryLoad(): void {
    this.wishlistService.clearError();
    this.loadWishlistWithProducts();
  }

  onProductRemove(productId: string): void {
    this.wishlistService.removeFromWishlist(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('Producto eliminado de wishlist');
        },
        error: () => {
          console.error('Error al eliminar producto');
        }
      });
  }

  onProductMoveToCart(productId: string): void {
    this.wishlistService.moveToCart({
      productId,
      quantity: 1,
      removeFromWishlist: true
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        console.log('Producto movido al carrito');
      },
      error: () => {
        console.error('Error al mover producto al carrito');
      }
    });
  }

  // NUEVO: Método para agregar a carrito sin remover de wishlist
  onAddToCart(productId: string): void {
    // Aquí puedes implementar la lógica para agregar al carrito
    // sin usar el servicio de wishlist
    console.log('Agregando producto al carrito:', productId);
  }
}
