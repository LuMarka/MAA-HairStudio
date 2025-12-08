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
  readonly pageSubtitle = 'Estamos aquí para ayudarte con cualquier consulta sobre nuestros servicios';
  readonly formTitle = 'Envianos un mensaje';
  readonly mapTitle = 'Nuestra ubicación';
  readonly address = 'Lugones 299, Villa María, Córdoba';
  readonly mapUrl = 'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d841.9623072384342!2d-63.2375713!3d-32.4231965!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95cc43fe63b02fb1%3A0xb95b048c19728c64!2sHAIR%20STUDIO%20Maria%20Alejandra%20Alan%C3%ADz!5e0!3m2!1ses!2sar!4v1765228872642!5m2!1ses!2sar';
  readonly whatsappNumber = '+5493534015655'; // MAA Hair Studio WhatsApp

  readonly serviceOptions = signal<ServiceOption[]>([
    { value: 'corte', label: 'Corte de cabello' },
    { value: 'coloracion', label: 'Coloración' },
    { value: 'tratamiento', label: 'Tratamientos capilares' },
    { value: 'peinado', label: 'Peinados y styling' },
    { value: 'BeautyScan', label: 'Beauty Scan' },
    { value: 'diagnostico', label: 'Diagnóstico de cabello' },
    { value: 'productos', label: 'Consulta sobre productos' },
    { value: 'otro', label: 'Otro servicio' }
  ]);

  handleFormSubmit(formData: ContactFormData): void {
    console.log('Formulario enviado:', formData);
    // You can add additional handling here if needed
  }
}
