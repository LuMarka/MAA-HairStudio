import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ContactForm, type ContactFormData, type ServiceOption } from '../../molecules/contact-form/contact-form';
import { ContactMap } from '../../molecules/contact-map/contact-map';

@Component({
  selector: 'app-contact-template',
  imports: [ContactForm, ContactMap ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-template.html',
  styleUrls: ['./contact-template.scss']
})
export class ContactTemplate {title = input<string>('Contactanos');
  subtitle = input<string>('Estamos aquí para ayudarte con cualquier consulta');
  formTitle = input<string>('Envianos un mensaje');
  mapTitle = input<string>('Nuestra ubicación');
  address = input<string>('Lugones 299, Villa María, Córdoba');
  mapUrl = input<string>('');
  serviceOptions = input<ServiceOption[]>([]);

  formSubmit = output<ContactFormData>();

  onFormSubmit(formData: ContactFormData): void {
    this.formSubmit.emit(formData);
  }
}




