import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchBar } from '../search-bar/search-bar';
import { SearchResult } from '../../../core/models/interfaces/SearchResult.interface';
import { SearchSuggestion } from '../../../core/models/interfaces/SearchSuggestion.interface';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchBar, CommonModule],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})

export class Search {
  readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly whatsappNumber = '5493534015655';
  private readonly whatsappMessage = 'Hola! Quisiera agendar un turno';

  // Contador del carrito
  cartItemCount = this.cartService.totalItems;
  isAuthenticated = this.authService.isAuthenticated;
  isUserMenuOpen = signal(false);

  searchSuggestions = signal<SearchSuggestion[]>([]);
  isLoading = signal<boolean>(false);

  readonly icons = {
    favorites: '❤️',
    user: '👤',
    cart: '🛍️',
    whatsapp: '📞'
  };

  get actions(): { icon: string; label: string; action: () => void }[] {
    return [
      {
        icon: this.icons.favorites,
        label: 'Favoritos',
        action: () => this.router.navigate(['/wishlist'])
      },
      {
        icon: this.icons.user,
        label: this.isAuthenticated() ? 'Cuenta' : 'Mi Cuenta',
        action: () => this.toggleUserMenu()
      },
      {
        icon: this.icons.cart,
        label: 'Carrito',
        action: () => this.router.navigate(['/cart'])
      },
      {
        icon: this.icons.whatsapp,
        label: 'Agendar (WhatsApp)',
        action: () => this.openWhatsApp()
      }
    ];
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(open => !open);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  private handleUserAction(): void {
    if (this.isAuthenticated()) {
      // Si está autenticado, cerrar sesión
      this.authService.logout().subscribe({
        next: () => {
          console.log('Sesión cerrada exitosamente');
          this.closeUserMenu();
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Error al cerrar sesión:', err);
        },
      });
    } else {
      // Si no está autenticado, ir al login
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.handleUserAction();
  }

  onSearch(result: { query: string; timestamp: number }): void {
    console.log('Búsqueda realizada:', result.query);
  }

  openWhatsApp(): void {
    const encodedMessage = encodeURIComponent(this.whatsappMessage);
    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  onSearchPerformed(result: SearchResult): void {
    console.log('Search performed:', result);
  }

  onSearchValueChanged(value: string): void {
    if (value.length >= 2) {
      this.loadSuggestions(value);
    } else {
      this.searchSuggestions.set([]);
    }
  }

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
