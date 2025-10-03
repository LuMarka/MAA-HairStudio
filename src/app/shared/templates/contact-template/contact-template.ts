import { ChangeDetectionStrategy, Component, input, output, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { ContactForm, type ContactFormData, type ServiceOption } from '../../molecules/contact-form/contact-form';
import { ContactMap } from '../../molecules/contact-map/contact-map';
import { ScrollAnimationService } from '../../../core/services/scroll-animation.service';
import { LocationVideo } from "../../molecules/location-video/location-video";

@Component({
  selector: 'app-contact-template',
  imports: [ContactForm, ContactMap, LocationVideo],
  templateUrl: './contact-template.html',
  styleUrl: './contact-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactTemplate implements AfterViewInit, OnDestroy {
  private scrollAnimationService = inject(ScrollAnimationService);
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

  // Video section inputs (can be overridden by page that uses this template)
  videoSrc = input<string>('/videos/ubicacion.mp4');
  videoAlt = input<string>('Video ubicación');
  videoTitle = input<string>('Aquí estamos');
  videoSubtitle = input<string>('Vení a conocernos');

  // Outputs
  formSubmitted = output<ContactFormData>();

  ngAfterViewInit(): void {
    // Inicializar animaciones de scroll para elementos principales
    this.scrollAnimationService.observeElements('.contact-template__hero');
    this.scrollAnimationService.observeElements('.contact-template__form-section');
    this.scrollAnimationService.observeElements('.contact-template__map-section');
  }

  ngOnDestroy(): void {
    // El servicio se encarga de limpiar sus propios recursos
  }
}




