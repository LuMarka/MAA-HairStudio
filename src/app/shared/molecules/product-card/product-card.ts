import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
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

  // ========== SIGNALS - Local state ==========
  private readonly _isWishlistLoading = signal(false);
  private readonly _isCartLoading = signal(false);

  // ========== OUTPUTS ==========
  readonly toggleWishlist = output<string>();
  readonly addToCart = output<string>();
  readonly removeFromWishlist = output<string>();
  readonly moveToCart = output<{ productId: string; quantity: number }>();
  readonly consultAvailability = output<string>();

  // ========== COMPUTED - Contexto ==========
  readonly isWishlistContext = computed(() => this.context() === 'wishlist');
  readonly isCatalogContext = computed(() => this.context() === 'catalog');

  // ========== COMPUTED - Loading states (LOCAL) ==========
  readonly isWishlistLoading = this._isWishlistLoading.asReadonly();
  readonly isCartLoading = this._isCartLoading.asReadonly();

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

  // ========== COMPUTED - Formato ==========
  readonly formattedPrice = computed(() => {
    const price = this.product().price;
    return this.formatPrice(price);
  });

  // ========== COMPUTED - Stock ==========
  readonly isOutOfStock = computed(() => this.product().stock <= 0);

  // ========== TEXTOS ==========
  readonly texts = {
    addToWishlistAriaLabel: 'Agregar a lista de favoritos',
    removeFromWishlistAriaLabel: 'Eliminar de lista de favoritos',
    addToCartText: 'Comprar',
    moveToCartText: 'Comprar',
    viewProductDetails: 'Ver detalles del producto',
    productImageAlt: 'Imagen del producto',
    removeFromWishlistText: 'Eliminar'
  };

  // ========== MÉTODOS - WISHLIST ==========

  onToggleWishlist(): void {
    this._isWishlistLoading.set(true);
    this.toggleWishlist.emit(this.product().id);
  }

  onRemoveFromWishlist(): void {
    this._isWishlistLoading.set(true);
    this.removeFromWishlist.emit(this.product().id);
  }

  /**
   * Método público para que el padre controle el loading del wishlist
   */
  setWishlistLoading(isLoading: boolean): void {
    this._isWishlistLoading.set(isLoading);
  }

  // ========== MÉTODOS - CART ==========

  onAddToCart(): void {
    if (this.isAddToCartDisabled()) {
      console.warn('⚠️ Add to cart deshabilitado');
      return;
    }

    this._isCartLoading.set(true);
    this.addToCart.emit(this.product().id);
  }

  onMoveToCart(): void {
    this._isCartLoading.set(true);
    this.moveToCart.emit({
      productId: this.product().id,
      quantity: 1
    });
  }

  /**
   * Método público para que el padre controle el loading del carrito
   */
  setCartLoading(isLoading: boolean): void {
    this._isCartLoading.set(isLoading);
  }

  // ========== MÉTODOS - CONSULTAR DISPONIBILIDAD ==========

  onConsultAvailability(): void {
    const message = this.generateWhatsAppMessage();
    const phoneNumber = '5493534015655';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    this.consultAvailability.emit(this.product().id);
  }

  private generateWhatsAppMessage(): string {
    const product = this.product();
    const productName = product.name || 'Producto sin nombre';
    const productBrand = product.brand || 'Marca no disponible';
    const message = `Hola, quisiera consultar sobre la disponibilidad del producto: ${productName}. Marca: ${productBrand}`;
    return message;
  }

  // ========== MÉTODOS - FORMATO ==========

  private formatPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const integerPart = Math.round(numPrice).toLocaleString('es-AR');
    return integerPart;
  }
}
