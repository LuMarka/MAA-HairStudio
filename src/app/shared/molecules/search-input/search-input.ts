import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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
  placeholder = input<string>('Busca por producto, servicio, marca...');
  ariaLabel = input<string>('Campo de búsqueda');
  isDisabled = input<boolean>(false);
  initialValue = input<string>('');

  searchValue = output<string>();
  searchSubmit = output<string>();

  searchControl = new FormControl('', { nonNullable: true });
  isFocused = input<boolean>(false);

  constructor() {
    // Set initial value
    effect(() => {
      if (this.initialValue()) {
        this.searchControl.setValue(this.initialValue());
      }
    });

    // Emit value changes
    effect(() => {
      this.searchControl.valueChanges.subscribe(value => {
        this.searchValue.emit(value);
      });
    });
  }

  onFocusIn(): void {
    // Focus state handled by CSS :focus-within
  }

  onFocusOut(): void {
    // Focus state handled by CSS :focus-within
  }

  onSubmit(): void {
    const value = this.searchControl.value.trim();
    if (value) {
      this.searchSubmit.emit(value);
    }
  }
}
