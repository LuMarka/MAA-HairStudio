import { Component, computed, inject, input, output, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Datum } from '../../../core/models/interfaces/Product.interface';

type ProductCardContext = 'catalog' | 'wishlist';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCard {
  private readonly wishlistService = inject(WishlistService);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  readonly product = input.required<Datum>();
  readonly context = input<ProductCardContext>('catalog');
  readonly showWishlistButton = input(true);

  // Outputs
  readonly addToCart = output<string>();
  readonly moveToCart = output<string>();

  // Computed values
  readonly isWishlisted = computed(() => 
    this.wishlistService.isProductInWishlist(this.product().id)
  );
  
  readonly isWishlistContext = computed(() => this.context() === 'wishlist');
  readonly isCatalogContext = computed(() => this.context() === 'catalog');
  readonly isWishlistLoading = computed(() => this.wishlistService.isLoading());

  // ✅ Configuración por defecto para notas
  private readonly defaultWishlistNote = computed(() => 
    `Me gusta ${this.product().name} de ${this.product().brand}`
  );

  // Textos reutilizables
  readonly texts = {
    addToWishlistAriaLabel: 'Agregar a lista de favoritos',
    removeFromWishlistAriaLabel: 'Eliminar de lista de favoritos',
    wishlistProcessing: 'Procesando...',
    addToCartText: 'Agregar al carrito',
    moveToCartText: 'Mover al carrito',
    buyButtonText: 'Comprar',
    viewProductDetails: 'Ver detalles del producto',
    productImageAlt: 'Imagen del producto',
    removeFromWishlistText: 'Eliminar'
  };

  /**
   * ✅ Toggle wishlist con nota por defecto
   */
  toggleWishlist(): void {
    const productId = this.product().id;
    
    if (this.isWishlisted()) {
      // Remover de wishlist
      this.wishlistService.removeFromWishlist(productId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            console.log('Producto removido de wishlist:', this.product().name);
          },
          error: (error) => {
            console.error('Error al remover de wishlist:', error);
          }
        });
    } else {
      // ✅ Agregar a wishlist con nota por defecto
      this.wishlistService.addToWishlist({
        productId,
        note: this.defaultWishlistNote(), // ✅ Nota generada automáticamente
        visibility: 'private'
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('Producto agregado a wishlist:', this.product().name);
        },
        error: (error) => {
          console.error('Error al agregar a wishlist:', error);
        }
      });
    }
  }

  /**
   * ✅ Remover producto de wishlist (solo en contexto wishlist)
   */
  removeFromWishlist(): void {
    const productId = this.product().id;
    
    this.wishlistService.removeFromWishlist(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('Producto eliminado de wishlist:', this.product().name);
        },
        error: (error) => {
          console.error('Error al eliminar de wishlist:', error);
        }
      });
  }

  /**
   * ✅ Agregar al carrito (emite evento para manejo externo)
   */
  onAddToCart(): void {
    this.addToCart.emit(this.product().id);
  }

  /**
   * ✅ Mover al carrito (emite evento para manejo externo)
   */
  onMoveToCart(): void {
    this.moveToCart.emit(this.product().id);
  }

  /**
   * ✅ Mover al carrito y eliminar de wishlist con nota por defecto
   */
  moveToCartAndRemove(): void {
    const productId = this.product().id;
    
    this.wishlistService.moveToCart({
      productId,
      quantity: 1,
      removeFromWishlist: true,
      note: `Comprado: ${this.product().name}` // ✅ Nota por defecto para carrito
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        console.log('Producto movido al carrito y eliminado de wishlist:', this.product().name);
      },
      error: (error) => {
        console.error('Error al mover al carrito:', error);
        // Fallback: emitir evento para manejo externo
        this.moveToCart.emit(productId);
      }
    });
  }
}
