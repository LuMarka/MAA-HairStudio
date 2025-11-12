import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss'
})
export class FormField {
  // Inputs
  name = input.required<string>();
  label = input.required<string>();
  type = input<string>('text');
  placeholder = input<string>('');
  required = input<boolean>(false);
  formGroup = input.required<FormGroup>();

  // Outputs
  fieldChange = output<any>();

  get control() {
    return this.formGroup().get(this.name());
  }

  get hasError() {
    return this.control?.invalid && (this.control?.dirty || this.control?.touched);
  }

  get errorMessage() {
    if (this.control?.errors) {
      const errors = this.control.errors;

      if (errors['required']) {
        return `${this.label()} es requerido`;
      }

      if (errors['email']) {
        return 'Por favor ingresa un correo válido';
      }

      if (errors['minlength']) {
        return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
      }

      if (errors['pattern']) {
        if (this.type() === 'tel') {
          return 'Ingresa un teléfono válido (ej: +5411234567890)';
        }
        if (this.name() === 'postalCode') {
          return 'Ingresa un código postal válido (ej: 1234 o C1000AAA)';
        }
        return 'Formato inválido';
      }
    }

    return '';
  }

  onFieldChange() {
    this.fieldChange.emit(this.control?.value);
  }
}
