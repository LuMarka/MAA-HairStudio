import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { SearchInput } from '../../molecules/search-input/search-input';

interface SearchResult {
  query: string;
  timestamp: number;
}

@Component({
  selector: 'app-search-bar',
  imports: [SearchInput],
  templateUrl: './search-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './search-bar.scss'
})
export class SearchBar {
  // Inputs
  readonly placeholder = input('Buscar productos...');
  readonly initialValue = input('');
  readonly showSuggestions = input(false);
  readonly isLoading = input(false);

  // Outputs
  readonly searchPerformed = output<SearchResult>();

  // State
  private readonly currentQuery = signal('');

  // Computed
  readonly hasQuery = computed(() => this.currentQuery().length > 0);

  onSearchValueChange(value: string): void {
    this.currentQuery.set(value);
  }

  onSearchSubmit(query: string): void {
    const result: SearchResult = {
      query,
      timestamp: Date.now()
    };

    this.searchPerformed.emit(result);
  }
}
