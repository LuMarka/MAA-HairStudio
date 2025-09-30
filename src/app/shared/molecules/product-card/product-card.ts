import { Component, Input, computed, inject } from '@angular/core';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Product } from '../../../core/models/interfaces/Product.interface';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input() product!: Product;
  private readonly wishlist = inject(WishlistService) as WishlistService;

  readonly isWishlisted = computed(() => this.wishlist.isInWishlist(this.product));

  toggleWishlist() {
    this.wishlist.toggle(this.product);
  }
}
