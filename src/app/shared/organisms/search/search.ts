import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SearchBar } from '../search-bar/search-bar';
import type { SearchResult } from '../../../core/models/interfaces/SearchResult.interface';
import type { SearchSuggestion } from '../../../core/models/interfaces/SearchSuggestion.interface';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { WishlistService } from '../../../core/services/wishlist.service';

/**
 * Interfaz para las acciones del header
 */
interface HeaderAction {
  icon: string;
  label: string;
  badge: number;
  showBadge: boolean;
  action: () => void;
}

@Component({
  selector: 'app-search',
  imports: [SearchBar],
  templateUrl: './search.html',
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Search {
  readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly wishlistService = inject(WishlistService);

  // ========== CONSTANTES ==========
  private readonly whatsappNumber = '5493534015655';
  private readonly whatsappMessage = 'Hola! Quisiera agendar un turno';

  readonly icons = {
    favorites: '❤️',
    user: '👤',
    cart: '🛍️',
    whatsapp: '📞'
  } as const;

  // ========== SIGNALS ==========
  readonly searchSuggestions = signal<SearchSuggestion[]>([]);
  readonly isLoading = signal(false);
  readonly isUserMenuOpen = signal(false);

  // ========== COMPUTED - Estado de autenticación ==========
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  // ========== COMPUTED - Contadores ==========
  readonly cartItemCount = computed(() => this.cartService.cart()?.summary.totalQuantity ?? 0);
  readonly wishlistItemCount = computed(() => this.wishlistService.totalItems());

  // ========== COMPUTED - Badges ==========
  readonly showCartBadge = computed(() => this.cartItemCount() > 0);
  readonly showWishlistBadge = computed(() => this.wishlistItemCount() > 0);

  // ========== COMPUTED - Acciones del header ==========
  readonly actions = computed<HeaderAction[]>(() => [
    {
      icon: this.icons.favorites,
      label: 'Favoritos',
      badge: this.wishlistItemCount(),
      showBadge: this.showWishlistBadge(),
      action: () => this.router.navigate(['/wishlist'])
    },
    {
      icon: this.icons.user,
      label: this.isAuthenticated() ? 'Cuenta' : 'Mi Cuenta',
      badge: 0,
      showBadge: false,
      action: () => this.toggleUserMenu()
    },
    {
      icon: this.icons.cart,
      label: 'Carrito',
      badge: this.cartItemCount(),
      showBadge: this.showCartBadge(),
      action: () => this.router.navigate(['/cart'])
    },
    {
      icon: this.icons.whatsapp,
      label: 'Agendar (WhatsApp)',
      badge: 0,
      showBadge: false,
      action: () => this.openWhatsApp()
    }
  ]);

  // ========== MÉTODOS PÚBLICOS - Menú de usuario ==========

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(open => !open);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Sesión cerrada exitosamente');
        this.closeUserMenu();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('❌ Error al cerrar sesión:', err);
      }
    });
  }

  // ========== MÉTODOS PÚBLICOS - Búsqueda ==========

  onSearch(result: { query: string; timestamp: number }): void {
    // TODO: Implementar navegación a resultados de búsqueda
    // this.router.navigate(['/search'], { queryParams: { q: result.query } });
  }

  onSearchPerformed(result: SearchResult): void {
    // TODO: Implementar lógica de búsqueda avanzada
  }

  onSearchValueChanged(value: string): void {
    if (value.length >= 2) {
      this.loadSuggestions(value);
    } else {
      this.searchSuggestions.set([]);
    }
  }

  // ========== MÉTODOS PÚBLICOS - WhatsApp ==========

  openWhatsApp(): void {
    const encodedMessage = encodeURIComponent(this.whatsappMessage);
    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  // ========== MÉTODOS PRIVADOS ==========

  private loadSuggestions(query: string): void {
    this.isLoading.set(true);

    // TODO: Reemplazar con llamada real al servicio de búsqueda
    setTimeout(() => {
      const mockSuggestions: SearchSuggestion[] = [
        { id: '1', text: 'Corte de cabello', type: 'service' as const, icon: '✂️' },
        { id: '2', text: 'Shampoo Loreal', type: 'product' as const, icon: '🧴' },
        { id: '3', text: 'Coloración profesional', type: 'service' as const, icon: '🎨' },
        { id: '4', text: 'Tratamiento capilar', type: 'product' as const, icon: '💆' }
      ].filter(s => s.text.toLowerCase().includes(query.toLowerCase()));

      this.searchSuggestions.set(mockSuggestions);
      this.isLoading.set(false);
    }, 500);
  }
}
