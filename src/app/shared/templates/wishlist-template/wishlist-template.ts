import { Component, computed, inject } from '@angular/core';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ProductCard } from '../../molecules/product-card/product-card';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wishlist-template',
  standalone: true,
  imports: [ProductCard, CommonModule],
  templateUrl: './wishlist-template.html',
  styleUrl: './wishlist-template.scss'
})
export class WishlistTemplate {
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);

  readonly products = computed(() => this.wishlistService.wishlist());
  readonly itemCount = computed(() => this.wishlistService.count);

  // Textos reutilizables
  readonly texts = {
    // Header
    title: 'Mis Productos Favoritos',
    titleIcon: '💝',
    countSingular: 'producto',
    countPlural: 'productos',
    clearButtonText: 'Limpiar todo',
    clearButtonAriaLabel: 'Limpiar lista de favoritos',

    // Explore section
    exploreText: '¿Buscas algo más especial?',
    exploreButtonText: 'Descubrir más productos',
    exploreIcon: '✨',
    exploreArrow: '→',

    // Empty state
    emptyIcon: '❤️',
    emptyTitle: 'Tu lista de favoritos está vacía',
    emptyDescription: 'Explora nuestros productos y marca como favoritos los que más te gusten',
    emptyButtonText: 'Explorar productos',

    // Confirmations
    clearConfirmMessage: '¿Estás seguro de que quieres eliminar todos los productos de tu lista de favoritos?'
  };

  navigateToProducts() {
    this.router.navigate(['/products']);
  }

  clearWishlist() {
    if (confirm(this.texts.clearConfirmMessage)) {
      this.wishlistService.clear();
    }
  }
}
