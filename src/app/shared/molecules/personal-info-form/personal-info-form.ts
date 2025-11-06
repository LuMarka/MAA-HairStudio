import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-personal-info-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './personal-info-form.html',
  styleUrl: './personal-info-form.scss'
})
export class PersonalInfoForm {
  formGroup = input.required<FormGroup>();
  formChange = output<void>();

  onFieldChange(): void {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.formGroup().controls).forEach(key => {
      const control = this.formGroup().get(key);
      if (control) {
        control.markAsTouched();
        control.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.formChange.emit();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.formGroup().get(fieldName);
    return !!(control?.invalid && (control.dirty || control.touched));
  }

  getFieldError(fieldName: string): string | null {
    const control = this.formGroup().get(fieldName);
    if (!control?.errors || !control?.touched) {
      return null;
    }

    const errors = control.errors;

    if (errors['required']) {
      return 'Este campo es requerido';
    }
    if (errors['email']) {
      return 'Ingresa un email válido';
    }
    if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (errors['pattern']) {
      if (fieldName === 'postalCode') {
        return 'Código postal inválido (ej: 1234 o C1000AAA)';
      }
      if (fieldName === 'phone') {
        return 'Teléfono inválido (ej: +543531111111)';
      }
    }
    return 'Campo inválido';
  }
}
