import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface ContactFormData {
  name: string;
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
  private readonly formBuilder = inject(FormBuilder);

  // Inputs
  title = input<string>('Contáctanos');
  serviceOptions = input<ServiceOption[]>([]);
  whatsappNumber = input<string>('+5493534015655'); // MAA Hair Studio number

  // Outputs
  formSubmitted = output<ContactFormData>();

  // State
  private readonly dropdownOpenState = signal(false);
  private readonly submittingState = signal(false);
  private readonly selectedService = signal<ServiceOption | null>(null);

  // Computed
  readonly dropdownOpen = this.dropdownOpenState.asReadonly();
  readonly isSubmitting = this.submittingState.asReadonly();
  readonly selectedServiceLabel = computed(() =>
    this.selectedService()?.label ?? 'Selecciona un servicio'
  );

  // Form
  readonly contactForm: FormGroup = this.formBuilder.group({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    ]),
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(\+54\s?9?\s?)?[\d\s\-()]{8,15}$/)
    ]),
    service: new FormControl('', [Validators.required]),
    message: new FormControl('', [
      Validators.required,
      Validators.minLength(10)
    ])
  });

  toggleDropdown(): void {
    this.dropdownOpenState.update(open => !open);
  }

  selectService(option: ServiceOption): void {
    this.selectedService.set(option);
    this.contactForm.patchValue({ service: option.value });
    this.dropdownOpenState.set(false);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (!field?.errors) return '';

    const errors = field.errors;

    switch (fieldName) {
      case 'name':
        if (errors['required']) return 'El nombre es obligatorio';
        if (errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
        if (errors['pattern']) return 'El nombre solo puede contener letras';
        break;
      case 'phone':
        if (errors['required']) return 'El teléfono es obligatorio';
        if (errors['pattern']) return 'Formato de teléfono inválido';
        break;
      case 'service':
        if (errors['required']) return 'Debes seleccionar un servicio';
        break;
      case 'message':
        if (errors['required']) return 'El mensaje es obligatorio';
        if (errors['minlength']) return 'El mensaje debe tener al menos 10 caracteres';
        break;
    }

    return 'Campo inválido';
  }

  onSubmit(): void {
    if (this.contactForm.valid && !this.isSubmitting()) {
      this.submittingState.set(true);

      const formData = this.contactForm.value as ContactFormData;

      // Generate WhatsApp message
      const whatsappMessage = this.generateWhatsAppMessage(formData);

      // Send to WhatsApp
      this.sendToWhatsApp(whatsappMessage);

      // Emit form data
      this.formSubmitted.emit(formData);

      // Reset form after short delay
      setTimeout(() => {
        this.contactForm.reset();
        this.selectedService.set(null);
        this.submittingState.set(false);
      }, 1000);
    } else {
      // Mark all fields as touched to show errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  private generateWhatsAppMessage(formData: ContactFormData): string {
    const serviceLabel = this.serviceOptions()
      .find(option => option.value === formData.service)?.label || formData.service;

    return `*Nueva consulta desde MAA Hair Studio*\n\n` +
           `👤 *Nombre:* ${formData.name}\n` +
           `📞 *Teléfono:* ${formData.phone}\n` +
           `💇 *Servicio:* ${serviceLabel}\n` +
           `💬 *Mensaje:* ${formData.message}\n\n` +
           `_Enviado desde el sitio web_`;
  }

  private sendToWhatsApp(message: string): void {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${this.whatsappNumber().replace(/[^0-9]/g, '')}?text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}
