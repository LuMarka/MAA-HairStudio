import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
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
  readonly consultAvailability = output<string>();

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

  // ========== MÉTODOS - CONSULTAR DISPONIBILIDAD ==========

  onConsultAvailability(): void {
    console.log('💬 ProductCard - Consult Availability:', this.product().id);
    const message = this.generateWhatsAppMessage();
    console.log('📝 Mensaje generado:', message);
    const phoneNumber = '5492616984285';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    console.log('🔗 URL de WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
    this.consultAvailability.emit(this.product().id);
  }

  private generateWhatsAppMessage(): string {
    const product = this.product();
    console.log('📦 Producto capturado:', product);
    console.log('📦 Nombre:', product.name);
    console.log('📦 Marca:', product.brand);
    const productName = product.name || 'Producto sin nombre';
    const productBrand = product.brand || 'Marca no disponible';
    const message = `Hola, quisiera consultar sobre la disponibilidad del producto: ${productName}. Marca: ${productBrand}`;
    console.log('✅ Mensaje final:', message);
    return message;
  }

  // ========== MÉTODOS - FORMATO ==========

  private formatPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const integerPart = Math.round(numPrice).toLocaleString('es-AR');
    return integerPart;
  }
}
