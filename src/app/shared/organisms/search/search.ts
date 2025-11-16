import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SearchBar } from '../search-bar/search-bar';
import { SearchResult } from '../../../core/models/interfaces/SearchResult.interface';
import { SearchSuggestion } from '../../../core/models/interfaces/SearchSuggestion.interface';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';


@Component({
  selector: 'app-search',
  imports: [SearchBar],
  templateUrl: './search.html',
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Search {
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  
  private readonly whatsappNumber = '5493534015655';
  private readonly whatsappMessage = 'Hola! Quisiera agendar un turno';

  // ========== SIGNALS ==========
  readonly searchSuggestions = signal<SearchSuggestion[]>([]);
  readonly isLoading = signal<boolean>(false);

  // ========== COMPUTED - Contadores ==========
  readonly cartItemCount = computed(() => this.cartService.cart()?.summary.totalItems ?? 0);
  readonly wishlistItemCount = computed(() => this.wishlistService.totalItems());

  // ========== COMPUTED - Badges ==========
  readonly showCartBadge = computed(() => this.cartItemCount() > 0);
  readonly showWishlistBadge = computed(() => this.wishlistItemCount() > 0);

  readonly icons = {
    favorites: '❤️',
    user: '👤',
    cart: '🛍️',
    admin: '⚙️',
    whatsapp: '📞'
  };

  // ========== ACTIONS ==========
  readonly actions = computed(() => [
    {
      icon: this.icons.favorites,
      label: 'Favoritos',
      badge: this.wishlistItemCount(),
      showBadge: this.showWishlistBadge(),
      action: () => this.router.navigate(['/wishlist'])
    },
    {
      icon: this.icons.user,
      label: 'Mi Cuenta',
      badge: 0,
      showBadge: false,
      action: () => this.router.navigate(['/login'])
    },
    {
      icon: this.icons.cart,
      label: 'Carrito',
      badge: this.cartItemCount(),
      showBadge: this.showCartBadge(),
      action: () => this.router.navigate(['/cart'])
    },
    {
      icon: this.icons.admin,
      label: 'Admin',
      badge: 0,
      showBadge: false,
      action: () => this.router.navigate(['/admin'])
    },
    {
      icon: this.icons.whatsapp,
      label: 'Agendar (WhatsApp)',
      badge: 0,
      showBadge: false,
      action: () => this.openWhatsApp()
    }
  ]);

  // ========== MÉTODOS PÚBLICOS ==========

  onSearch(result: { query: string; timestamp: number }): void {
    console.log('🔍 Búsqueda realizada:', result.query);
  }

  onSearchPerformed(result: SearchResult): void {
    console.log('🔍 Search performed:', result);
  }

  onSearchValueChanged(value: string): void {
    if (value.length >= 2) {
      this.loadSuggestions(value);
    } else {
      this.searchSuggestions.set([]);
    }
  }

  openWhatsApp(): void {
    const encodedMessage = encodeURIComponent(this.whatsappMessage);
    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  // ========== MÉTODOS PRIVADOS ==========

  private loadSuggestions(query: string): void {
    this.isLoading.set(true);
    
    setTimeout(() => {
      const mockSuggestions: SearchSuggestion[] = [
        { id: '1', text: 'Corte de cabello', type: 'service' as const, icon: '✂️' },
        { id: '2', text: 'Shampoo Loreal', type: 'product' as const, icon: '🧴' },
      ].filter(s => s.text.toLowerCase().includes(query.toLowerCase()));

      this.searchSuggestions.set(mockSuggestions);
      this.isLoading.set(false);
    }, 500);
  }
}
