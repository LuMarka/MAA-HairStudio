import { Component, computed, inject } from '@angular/core';
import { WishlistService } from '../../../core/services/wishlistOld.service';
import { ProductCard } from '../../molecules/product-card/product-card';

@Component({
  selector: 'app-admin-wishlist-template',
  imports: [ProductCard],
  templateUrl: './admin-wishlist-template.html',
  styleUrl: './admin-wishlist-template.scss'
})
export class AdminWishlistTemplate {
  /* private readonly wishlist = inject(WishlistService) as WishlistService;
  readonly products = computed(() => this.wishlist.wishlist()); */
}
