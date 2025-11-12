import { Component, Input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { Datum } from '../../../core/models/interfaces/Product.interface';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  @Input() product!: Datum;
  private readonly wishlist = inject(WishlistService) as WishlistService;
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly isWishlisted = computed(() => this.wishlist.isInWishlist(this.product));

  // Textos reutilizables
  readonly texts = {
    wishlistButtonAriaLabel: 'Agregar a favoritos',
    buyButtonText: 'Comprar'
  };

  toggleWishlist() {
    this.wishlist.toggle(this.product);
  }

  goToProductDetail() {
    this.router.navigate(['/details', this.product.id]);
  }

  addToCart() {
    const cartItem = {
      id: this.product.id.toString(),
      name: this.product.name,
      brand: this.product.brand,
      price: this.product.price,
      quantity: 1,
      image: this.product.image,
      description: this.product.description,
      shortDescription: this.product.shortDescription,
      inStock: true,
      maxQuantity: 10
    };

    this.cartService.addItem(cartItem);
  }
}
