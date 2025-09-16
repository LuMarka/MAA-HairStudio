import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ContactTemplate } from '../../shared/templates/contact-template/contact-template';
import { type ContactFormData, type ServiceOption } from '../../shared/molecules/contact-form/contact-form';

@Component({
  selector: 'app-contact',
  imports: [ContactTemplate],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contact {
 readonly pageTitle = 'Contactanos';
  readonly pageSubtitle = 'Estamos aquí para ayudarte con cualquier consulta sobre nuestros servicios.';
  readonly formTitle = 'Envianos un mensaje';
  readonly mapTitle = 'Nuestra ubicación';
  readonly address = 'Lugones 299, Villa María, Córdoba';
  readonly mapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3353.953792490634!2d-63.24353768484787!3d-32.40908198093571!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95cc4270e6c6c4ad%3A0x5c4e8e4a8b8b4b8b!2sLugones%20299%2C%20Villa%20Mar%C3%ADa%2C%20C%C3%B3rdoba%2C%20Argentina!5e0!3m2!1ses!2sar!4v1700000000000!5m2!1ses!2sar';

  readonly serviceOptions = signal<ServiceOption[]>([
    { value: 'corte', label: 'Corte de cabello' },
    { value: 'coloracion', label: 'Coloración' },
    { value: 'tratamiento', label: 'Tratamientos capilares' },
    { value: 'peinado', label: 'Peinados y styling' },
    { value: 'diagnóstico de cabello', label: 'Diagnóstico de cabello' },
    { value: 'productos', label: 'Consulta sobre productos' },
    { value: 'otro', label: 'Otro servicio' }
  ]);

  handleFormSubmit(formData: ContactFormData): void {
    console.log('Datos del formulario:', formData);
    alert('¡Mensaje enviado correctamente! Te contactaremos pronto.');
  }
}
