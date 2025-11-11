import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Datum } from '../../../core/models/interfaces/Product.interface';

type ProductCardContext = 'catalog' | 'wishlist';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCard {
  // ========== INPUTS ==========
  readonly product = input.required<Datum>();
  readonly context = input<ProductCardContext>('catalog');
  readonly showWishlistButton = input(true);
  
  // ✅ Estado de wishlist desde el padre
  readonly isInWishlist = input<boolean>(false);
  readonly isWishlistLoading = input<boolean>(false);

  // ========== OUTPUTS ==========
  readonly toggleWishlist = output<string>();
  readonly addToCart = output<string>();
  readonly removeFromWishlist = output<string>();
  readonly moveToCart = output<{ productId: string; quantity: number }>();

  // ========== COMPUTED ==========
  readonly isWishlistContext = computed(() => this.context() === 'wishlist');
  readonly isCatalogContext = computed(() => this.context() === 'catalog');

  // ========== TEXTOS ==========
  readonly texts = {
    addToWishlistAriaLabel: 'Agregar a lista de favoritos',
    removeFromWishlistAriaLabel: 'Eliminar de lista de favoritos',
    addToCartText: 'Agregar al carrito',
    moveToCartText: 'Mover al carrito',
    viewProductDetails: 'Ver detalles del producto',
    productImageAlt: 'Imagen del producto',
    removeFromWishlistText: 'Eliminar'
  };

  // ========== MÉTODOS - SOLO EMITEN ==========
  
  onToggleWishlist(): void {
    this.toggleWishlist.emit(this.product().id);
  }

  onRemoveFromWishlist(): void {
    this.removeFromWishlist.emit(this.product().id);
  }

  onAddToCart(): void {
    this.addToCart.emit(this.product().id);
  }

  onMoveToCart(): void {
    this.moveToCart.emit({
      productId: this.product().id,
      quantity: 1
    });
  }
}
