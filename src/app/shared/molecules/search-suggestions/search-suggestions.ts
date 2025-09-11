import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SearchSuggestion } from '../../../core/models/interfaces/SearchSuggestion.interface';

@Component({
  selector: 'app-search-suggestions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './search-suggestions.html',
  styleUrl: './search-suggestions.scss',
  host: {
    '(keydown.arrowdown)': 'onArrowDown($event)',
    '(keydown.arrowup)': 'onArrowUp($event)',
    '(keydown.enter)': 'onEnter($event)',
    '(keydown.escape)': 'onEscape($event)'
  }
})
export class SearchSuggestions {
  suggestions = input.required<SearchSuggestion[]>();
  isVisible = input<boolean>(false);
  highlightedIndex = input<number>(-1);

  suggestionSelected = output<SearchSuggestion>();
  suggestionHovered = output<number>();
  keyboardNavigation = output<'up' | 'down' | 'enter' | 'escape'>();

  onSuggestionClick(suggestion: SearchSuggestion): void {
    this.suggestionSelected.emit(suggestion);
  }

  onSuggestionHover(index: number): void {
    this.suggestionHovered.emit(index);
  }

  onArrowDown(event: Event): void {
    event.preventDefault();
    this.keyboardNavigation.emit('down');
  }

  onArrowUp(event: Event): void {
    event.preventDefault();
    this.keyboardNavigation.emit('up');
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.keyboardNavigation.emit('enter');
  }

  onEscape(event: Event): void {
    event.preventDefault();
    this.keyboardNavigation.emit('escape');
  }

  getTypeLabel(type: SearchSuggestion['type']): string {
    const labels = {
      product: 'Producto',
      service: 'Servicio',
      brand: 'Marca',
      category: 'Categoría'
    };
    return labels[type];
  }
}
