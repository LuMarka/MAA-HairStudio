import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

/**
 * Organismo para el formulario de datos personales y dirección de entrega
 * 
 * @responsibility Capturar información del cliente y dirección según tipo de entrega
 * @input deliveryOption - Tipo de entrega ('pickup' | 'delivery')
 * @input initialData - Datos iniciales del formulario (opcional)
 * @output formDataChange - Emite cuando los datos del formulario cambian
 * @output formValidChange - Emite cuando cambia la validez del formulario
 * @output editCart - Emite cuando se presiona volver al carrito
 * @output continue - Emite cuando se presiona continuar (formulario válido)
 */
@Component({
  selector: 'app-form-personal-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-personal-data.html',
  styleUrl: './form-personal-data.scss'
})
export class FormPersonalData {
  private readonly fb = new FormBuilder();

  // ========== INPUTS ==========
  readonly deliveryOption = input.required<'pickup' | 'delivery'>();
  
  readonly initialData = input<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    notes?: string;
  }>({});

  // ========== OUTPUTS ==========
  readonly formDataChange = output<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    postalCode?: string;
    notes?: string;
  }>();

  readonly formValidChange = output<boolean>();
  readonly editCart = output<void>();
  readonly continue = output<void>();

  // ========== SIGNALS ==========
  readonly formValid = signal(false);

  // ========== COMPUTED ==========
  readonly selectedDeliveryOption = computed(() => this.deliveryOption());
  
  readonly deliveryOptionText = computed(() => 
    this.deliveryOption() === 'pickup' ? 'Retiro en tienda' : 'Envío a domicilio'
  );

  readonly isStep1Valid = computed(() => this.formValid());

  // ========== FORM ==========
  readonly orderForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[\d\s\+\-\(\)]+$/)]],
    address: [''],
    city: [''],
    postalCode: [''],
    notes: ['']
  });

  // ========== CONSTRUCTOR ==========
  constructor() {
    // Effect para actualizar validadores según tipo de entrega
    effect(() => {
      const deliveryOption = this.deliveryOption();
      this.updateFormValidators(deliveryOption);
    });

    // Effect para cargar datos iniciales
    effect(() => {
      const data = this.initialData();
      if (data && Object.keys(data).length > 0) {
        this.orderForm.patchValue(data, { emitEvent: false });
      }
    });

    // Subscribe a cambios del formulario
    this.orderForm.valueChanges.subscribe(() => {
      this.checkFormValidity();
      this.emitFormData();
    });

    // Subscribe a cambios de estado del formulario
    this.orderForm.statusChanges.subscribe(() => {
      this.checkFormValidity();
    });
  }

  // ========== MÉTODOS PRIVADOS ==========
  private updateFormValidators(deliveryOption: 'pickup' | 'delivery'): void {
    const addressControl = this.orderForm.get('address');
    const cityControl = this.orderForm.get('city');

    if (deliveryOption === 'delivery') {
      addressControl?.setValidators([Validators.required, Validators.minLength(5)]);
      cityControl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      addressControl?.clearValidators();
      cityControl?.clearValidators();
    }

    addressControl?.updateValueAndValidity({ emitEvent: false });
    cityControl?.updateValueAndValidity({ emitEvent: false });
  }

  private checkFormValidity(): void {
    const form = this.orderForm;
    const deliveryOption = this.deliveryOption();

    // Campos básicos requeridos
    const firstNameValid = form.get('firstName')?.valid ?? false;
    const lastNameValid = form.get('lastName')?.valid ?? false;
    const emailValid = form.get('email')?.valid ?? false;
    const phoneValid = form.get('phone')?.valid ?? false;

    let isValid = firstNameValid && lastNameValid && emailValid && phoneValid;

    // Para delivery, validar también dirección
    if (deliveryOption === 'delivery') {
      const addressValid = form.get('address')?.valid ?? false;
      const cityValid = form.get('city')?.valid ?? false;
      isValid = isValid && addressValid && cityValid;
    }

    const previousValid = this.formValid();
    this.formValid.set(isValid);

    // Solo emitir si cambió el estado de validez
    if (previousValid !== isValid) {
      this.formValidChange.emit(isValid);
    }
  }

  private emitFormData(): void {
    if (this.formValid()) {
      const formValue = this.orderForm.value;
      this.formDataChange.emit({
        firstName: formValue.firstName || '',
        lastName: formValue.lastName || '',
        email: formValue.email || '',
        phone: formValue.phone || '',
        address: formValue.address || undefined,
        city: formValue.city || undefined,
        postalCode: formValue.postalCode || undefined,
        notes: formValue.notes || undefined
      });
    }
  }

  // ========== MÉTODOS PÚBLICOS - VALIDACIÓN ==========
  isFieldInvalid(fieldName: string): boolean {
    const field = this.orderForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.orderForm.get(fieldName);
    
    if (!field?.errors || (!field.dirty && !field.touched)) {
      return '';
    }

    const fieldLabels: Record<string, string> = {
      firstName: 'El nombre',
      lastName: 'El apellido',
      email: 'El email',
      phone: 'El teléfono',
      address: 'La dirección',
      city: 'La ciudad'
    };

    const fieldLabel = fieldLabels[fieldName] || 'Este campo';

    if (field.errors['required']) {
      return `${fieldLabel} es requerido`;
    }
    
    if (field.errors['email']) {
      return 'Ingresa un email válido';
    }
    
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `${fieldLabel} debe tener al menos ${minLength} caracteres`;
    }
    
    if (field.errors['pattern']) {
      return 'Formato de teléfono inválido';
    }

    return 'Campo inválido';
  }

  // ========== MÉTODOS PÚBLICOS - EVENTOS ==========
  onEditCart(): void {
    this.editCart.emit();
  }

  onNextStep(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.orderForm.markAllAsTouched();
    this.checkFormValidity();

    if (!this.formValid()) {
      return;
    }

    this.continue.emit();
  }

  // ========== MÉTODOS PÚBLICOS - API ==========
  /**
   * Resetea el formulario a su estado inicial
   */
  reset(): void {
    this.orderForm.reset();
    this.formValid.set(false);
  }

  /**
   * Marca todos los campos como touched (útil para validación)
   */
  markAllAsTouched(): void {
    this.orderForm.markAllAsTouched();
    this.checkFormValidity();
  }

  /**
   * Obtiene los valores actuales del formulario
   */
  getFormValue() {
    return this.orderForm.value;
  }

  /**
   * Establece valores en el formulario
   */
  setFormValue(data: Partial<typeof this.initialData>): void {
    this.orderForm.patchValue(data);
  }
}
