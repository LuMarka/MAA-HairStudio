import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SearchBar } from '../search-bar/search-bar';
import { SearchResult } from '../../../core/models/interfaces/SearchResult.interface';
import { SearchSuggestion } from '../../../core/models/interfaces/SearchSuggestion.interface';

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchBar],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})
export class Search {
  searchSuggestions = signal<SearchSuggestion[]>([]);
  isLoading = signal<boolean>(false);
  recentSearches = signal<string[]>(['Corte de cabello', 'Shampoo', 'Tratamiento']);

  onSearchPerformed(result: SearchResult): void {
    console.log('Search performed:', result);

    // Aquí implementarías la lógica de búsqueda
    // Por ejemplo, navegación a página de resultados
    this.performActualSearch(result);
  }

  onSearchValueChanged(value: string): void {
    if (value.length >= 2) {
      this.loadSuggestions(value);
    } else {
      this.searchSuggestions.set([]);
    }
  }

  onRecentSearchClick(search: string): void {
    this.performActualSearch({
      query: search,
      type: 'direct'
    });
  }

  private loadSuggestions(query: string): void {
    this.isLoading.set(true);

    // Simular carga de sugerencias (reemplazar con servicio real)
    setTimeout(() => {
      const mockSuggestions: SearchSuggestion[] = [
        { id: '1', text: 'Corte de cabello', type: 'service' as const, icon: '✂️' },
        { id: '2', text: 'Shampoo Loreal', type: 'product' as const, icon: '🧴' },
        { id: '3', text: 'Loreal', type: 'brand' as const, icon: '🏷️' },
        { id: '4', text: 'Cuidado capilar', type: 'category' as const, icon: '💇‍♀️' },
      ].filter(s => s.text.toLowerCase().includes(query.toLowerCase()));

      this.searchSuggestions.set(mockSuggestions);
      this.isLoading.set(false);
    }, 500);
  }

  private performActualSearch(result: SearchResult): void {
    // Aquí implementarías la navegación real
    console.log('Performing search for:', result.query);

    // Agregar a búsquedas recientes
    const recent = this.recentSearches();
    if (!recent.includes(result.query)) {
      this.recentSearches.set([result.query, ...recent.slice(0, 4)]);
    }
  }
}
