import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ContactForm, type ContactFormData, type ServiceOption } from '../../molecules/contact-form/contact-form';
import { ContactMap } from '../../molecules/contact-map/contact-map';

@Component({
  selector: 'app-contact-template',
  imports: [ContactForm, ContactMap],
  templateUrl: './contact-template.html',
  styleUrl: './contact-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactTemplate {
  // Page inputs
  pageTitle = input<string>('Contactanos');
  pageSubtitle = input<string>('Estamos aquí para ayudarte');

  // Form inputs
  formTitle = input<string>('Envianos un mensaje');
  serviceOptions = input<ServiceOption[]>([]);
  whatsappNumber = input<string>('+5493534015655');

  // Map inputs
  mapTitle = input<string>('Nuestra ubicación');
  address = input<string>('');
  mapUrl = input<string>('');

  // Outputs
  formSubmitted = output<ContactFormData>();
}




