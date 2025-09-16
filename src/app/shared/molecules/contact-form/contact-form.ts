import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface ContactFormData {
  name: string;
  //lastName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

export interface ServiceOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactForm {
  // Inputs using new signal-based API
  title = input<string>('Envianos un mensaje');
  serviceOptions = input<ServiceOption[]>([]);

  // Output for form submission
  formSubmit = output<ContactFormData>();

  // Local state using signals
  private readonly isDropdownOpen = signal(false);

  // Form instance
  readonly contactForm: FormGroup;

  // Computed values
  readonly selectedServiceLabel = computed(() => {
    const serviceValue = this.contactForm.get('service')?.value;
    const selected = this.serviceOptions().find(option => option.value === serviceValue);
    return selected ? selected.label : 'Selecciona un servicio';
  });

  readonly dropdownOpen = computed(() => this.isDropdownOpen());

  constructor() {
    const fb = new FormBuilder();

    this.contactForm = fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
      ]],
 /*      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
      ]], */
/*       email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]], */
      phone: ['', [
        Validators.required,
        Validators.pattern(/^\+?[0-9\s-]+$/)
      ]],
      service: ['', [Validators.required]],
      message: ['', [
        Validators.required,
        Validators.minLength(10)
      ]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData: ContactFormData = this.contactForm.value;
      this.formSubmit.emit(formData);
      this.contactForm.reset();
    } else {
      this.contactForm.markAllAsTouched();
    }
  }

  selectService(service: ServiceOption): void {
    this.contactForm.patchValue({ service: service.value });
    this.isDropdownOpen.set(false);
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(value => !value);
  }

  // Utility methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (!field?.errors) return '';

    const fieldNames: Record<string, string> = {
      'name': 'Nombre y Apellido',
      //'lastName': 'Apellidos',
      'email': 'Correo',
      'phone': 'Número de teléfono',
      'service': 'Servicio',
      'message': 'Mensaje'
    };

    const fieldDisplayName = fieldNames[fieldName] || fieldName;

    if (field.errors['required']) {
      return `${fieldDisplayName} es requerido`;
    }

    if (field.errors['pattern']) {
      return this.getPatternError(fieldName, fieldDisplayName);
    }

    if (field.errors['minlength']) {
      const requiredLength = field.errors['minlength'].requiredLength;
      const actualLength = field.errors['minlength'].actualLength;
      return `${fieldDisplayName} debe tener al menos ${requiredLength} caracteres (actual: ${actualLength})`;
    }

    if (field.errors['email']) {
      return 'Por favor ingresa un correo válido';
    }

    return '';
  }

  private getPatternError(fieldName: string, fieldDisplayName: string): string {
    const patternErrors: Record<string, string> = {
      'name': `${fieldDisplayName} solo puede contener letras y espacios`,
      /* 'lastName': `${fieldDisplayName} solo puede contener letras y espacios`,
      'email': 'Por favor ingresa un correo válido (ej., usuario@dominio.com)', */
      'phone': 'Por favor ingresa un número de teléfono válido (ej., +54 9 353 123-4567)',
      'service': 'Por favor selecciona una opción de servicio válida',
      'message': `${fieldDisplayName} contiene caracteres inválidos`
    };

    return patternErrors[fieldName] || `${fieldDisplayName} formato es inválido`;
  }
}
