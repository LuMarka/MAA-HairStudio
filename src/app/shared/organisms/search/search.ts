
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchBar } from '../search-bar/search-bar';
import { SearchResult } from '../../../core/models/interfaces/SearchResult.interface';
import { SearchSuggestion } from '../../../core/models/interfaces/SearchSuggestion.interface';

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchBar, CommonModule],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})
export class Search {
  readonly whatsappIcon = 'bi bi-whatsapp';
  // Para el template: texto + flecha + ícono WhatsApp
  readonly comunicateLabel = 'Comuniquémonos';
  readonly comunicateArrow = '→';
  private readonly router = inject(Router);
  private readonly whatsappNumber = '5493534015655'; // Replace with your actual number
  private readonly whatsappMessage = 'Hola! Quisiera agendar un turno'; // Customize message

  searchSuggestions = signal<SearchSuggestion[]>([]);
  isLoading = signal<boolean>(false);

  readonly icons = {
    favorites: '❤️',
    user: '👤',
    cart: '🛍️',
    calendar: '📅'
  };

  // readonly actions = [
  //   {
  //     icon: this.icons.favorites,
  //     label: 'Favoritos',
  //     action: () => this.router.navigate(['/wishlist'])
  //   },
  //   {
  //     icon: this.icons.user,
  //     label: 'Mi Cuenta',
  //     action: () => this.router.navigate(['/login'])
  //   },
  //   {
  //     icon: this.icons.cart,
  //     label: 'Carrito',
  //     action: () => this.router.navigate(['/cart'])
  //   },
  //   {
  //     icon: this.icons.calendar,
  //     label: 'Agendar',
  //     action: () => this.openWhatsApp()
  //   }
  // ];




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
