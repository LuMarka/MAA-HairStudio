import { Injectable, signal } from '@angular/core';
import { Product } from '../../core/models/interfaces/Product.interface';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly _wishlist = signal<Product[]>([]);

  get wishlist() {
    return this._wishlist.asReadonly();
  }

  isInWishlist(product: Product): boolean {
    return this._wishlist().some(p => p.id === product.id);
  }

  toggle(product: Product): void {
    this._wishlist.update(list => {
      const exists = list.some(p => p.id === product.id);
      if (exists) {
        return list.filter(p => p.id !== product.id);
      } else {
        return [...list, product];
      }
    });
  }
}
