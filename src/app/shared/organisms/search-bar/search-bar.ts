import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { SearchResult } from '../../../core/models/interfaces/SearchResult.interface';
import { SearchSuggestion } from '../../../core/models/interfaces/SearchSuggestion.interface';
import { SearchInput } from '../../molecules/search-input/search-input';
import { SearchSuggestions } from '../../molecules/search-suggestions/search-suggestions';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchInput, SearchSuggestions, ReactiveFormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
  host: {
    '(click)': 'onHostClick($event)',
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class SearchBar {
  placeholder = input<string>('Busca por producto, servicio, marca...');
  initialValue = input<string>('');
  suggestions = input<SearchSuggestion[]>([]);
  isLoading = input<boolean>(false);
  minSearchLength = input<number>(2);
  debounceTime = input<number>(300);

  searchPerformed = output<SearchResult>();
  searchValueChanged = output<string>();

  private searchValue = signal<string>('');
  private isFocused = signal<boolean>(false);
  highlightedIndex = signal<number>(-1);

  showSuggestions = computed(() =>
    this.isFocused() &&
    this.searchValue().length >= this.minSearchLength() &&
    this.suggestions().length > 0 &&
    !this.isLoading()
  );

  constructor() {
    // Setup debounced search
    effect(() => {
      const value = this.searchValue();
      if (value.length >= this.minSearchLength()) {
        setTimeout(() => {
          this.searchValueChanged.emit(value);
        }, this.debounceTime());
      }
    });
  }

  onSearchValueChange(value: string): void {
    this.searchValue.set(value);
    this.highlightedIndex.set(-1);

    if (value.length < this.minSearchLength()) {
      this.isFocused.set(false);
    } else {
      this.isFocused.set(true);
    }
  }

  onDirectSearch(query: string): void {
    if (query.trim()) {
      this.performSearch({
        query: query.trim(),
        type: 'direct'
      });
    }
  }

  onSuggestionSelected(suggestion: SearchSuggestion): void {
    this.performSearch({
      query: suggestion.text,
      type: 'suggestion',
      suggestion
    });
  }

  onSuggestionHovered(index: number): void {
    this.highlightedIndex.set(index);
  }

  onKeyboardNavigation(direction: 'up' | 'down' | 'enter' | 'escape'): void {
    const currentIndex = this.highlightedIndex();
    const suggestionsLength = this.suggestions().length;

    switch (direction) {
      case 'down':
        if (currentIndex < suggestionsLength - 1) {
          this.highlightedIndex.set(currentIndex + 1);
        } else {
          this.highlightedIndex.set(0);
        }
        break;

      case 'up':
        if (currentIndex > 0) {
          this.highlightedIndex.set(currentIndex - 1);
        } else {
          this.highlightedIndex.set(suggestionsLength - 1);
        }
        break;

      case 'enter':
        if (currentIndex >= 0 && currentIndex < suggestionsLength) {
          const selectedSuggestion = this.suggestions()[currentIndex];
          this.onSuggestionSelected(selectedSuggestion);
        } else {
          this.onDirectSearch(this.searchValue());
        }
        break;

      case 'escape':
        this.closeSuggestions();
        break;
    }
  }

  onFormSubmit(): void {
    this.onDirectSearch(this.searchValue());
  }

  onHostClick(event: Event): void {
    event.stopPropagation();
  }

  onDocumentClick(event: Event): void {
    this.closeSuggestions();
  }

  private performSearch(result: SearchResult): void {
    this.closeSuggestions();
    this.searchPerformed.emit(result);
  }

  private closeSuggestions(): void {
    this.isFocused.set(false);
    this.highlightedIndex.set(-1);
  }
}
