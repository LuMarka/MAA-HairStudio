import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-input',
  imports: [ReactiveFormsModule],
  templateUrl: './search-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './search-input.scss',
  host: {
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut()'
  }
})
export class SearchInput {
  private readonly router = inject(Router);

  // Inputs
  readonly placeholder = input('Busca por producto, servicio, marca...');
  readonly ariaLabel = input('Campo de búsqueda');
  readonly isDisabled = input(false);
  readonly initialValue = input('');
  readonly navigateOnSearch = input(true); // Nueva opción para controlar navegación

  // Outputs
  readonly searchValue = output<string>();
  readonly searchSubmit = output<string>();

  // State
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly isFocused = signal(false);
  readonly hasValue = signal(false);

  constructor() {
    // Set initial value
    effect(() => {
      const initial = this.initialValue();
      if (initial) {
        this.searchControl.setValue(initial);
        this.hasValue.set(true);
      }
    });

    // Handle disabled state
    effect(() => {
      const disabled = this.isDisabled();
      if (disabled) {
        this.searchControl.disable();
      } else {
        this.searchControl.enable();
      }
    });

    // Emit value changes
    effect(() => {
      this.searchControl.valueChanges.subscribe(value => {
        this.hasValue.set(value.length > 0);
        this.searchValue.emit(value);
      });
    });
  }

  onFocusIn(): void {
    this.isFocused.set(true);
  }

  onFocusOut(): void {
    this.isFocused.set(false);
  }

  onSubmit(): void {
    const value = this.searchControl.value.trim();
    if (value) {
      this.searchSubmit.emit(value);

      // Navegar solo si está habilitado
      if (this.navigateOnSearch()) {
        this.navigateToProducts(value);
      }
    }
  }

  onSearch(result: { query: string; timestamp: number }): void {
    console.log('Búsqueda realizada:', result.query);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.hasValue.set(false);
  }

  private navigateToProducts(query: string): void {
    this.router.navigate(['/products'], {
      queryParams: { search: query }
    });
  }
}
