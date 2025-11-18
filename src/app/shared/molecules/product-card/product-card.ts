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
  readonly isInWishlist = input<boolean>(false);
  readonly isInCart = input<boolean>(false);
  readonly cartQuantity = input<number>(0);
  readonly isWishlistLoading = input<boolean>(false);
  readonly isCartLoading = input<boolean>(false);

  // ========== OUTPUTS ==========
  readonly toggleWishlist = output<string>();
  readonly addToCart = output<string>();
  readonly removeFromWishlist = output<string>();
  readonly moveToCart = output<{ productId: string; quantity: number }>();

  // ========== COMPUTED - Contexto ==========
  readonly isWishlistContext = computed(() => this.context() === 'wishlist');
  readonly isCatalogContext = computed(() => this.context() === 'catalog');

  // ========== COMPUTED - Estado del Cart ==========
  readonly isAddToCartDisabled = computed(() => {
    const product = this.product();
    return !product.isAvailable || 
           product.stock <= 0 || 
           this.isCartLoading();
  });

  readonly showCartButton = computed(() => {
    return this.isCatalogContext() && !this.isWishlistContext();
  });

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

  // ========== MÉTODOS - WISHLIST ==========

  onToggleWishlist(): void {
    console.log('❤️ ProductCard - Toggle Wishlist:', this.product().id);
    this.toggleWishlist.emit(this.product().id);
  }

  onRemoveFromWishlist(): void {
    console.log('🗑️ ProductCard - Remove from Wishlist:', this.product().id);
    this.removeFromWishlist.emit(this.product().id);
  }

  // ========== MÉTODOS - CART ==========

  onAddToCart(): void {
    if (this.isAddToCartDisabled()) {
      console.warn('⚠️ Add to cart deshabilitado');
      return;
    }

    console.log('🛒 ProductCard - Add to Cart:', this.product().id);
    this.addToCart.emit(this.product().id);
  }

  onMoveToCart(): void {
    console.log('🔄 ProductCard - Move to Cart:', this.product().id);
    this.moveToCart.emit({
      productId: this.product().id,
      quantity: 1
    });
  }
}
