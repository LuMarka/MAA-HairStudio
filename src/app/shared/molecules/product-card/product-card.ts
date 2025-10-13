import { Component, Input, computed, inject } from '@angular/core';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Product } from '../../../core/models/interfaces/Product.interface';

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input() product!: Product;
  private readonly wishlist = inject(WishlistService) as WishlistService;

  readonly isWishlisted = computed(() => this.wishlist.isInWishlist(this.product));

  // Textos reutilizables
  readonly texts = {
    wishlistButtonAriaLabel: 'Agregar a favoritos',
    buyButtonText: 'Comprar'
  };

  toggleWishlist() {
    this.wishlist.toggle(this.product);
  }
}
