import { ChangeDetectionStrategy, Component, input, OnInit, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { ScrollAnimationService } from '../../../core/services/scroll-animation.service';

export interface ServiceStep {
  title: string;
  description: string;
}

export interface ServiceBenefit {
  title: string;
  description: string;
}

@Component({
  selector: 'app-services-template',
  templateUrl: './services-template.html',
  styleUrl: './services-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicesTemplate implements AfterViewInit, OnDestroy {
  private scrollAnimationService = inject(ScrollAnimationService);

  title = input<string>('');
  subtitle = input<string>('');
  descriptionParagraph1 = input<string>('');
  descriptionParagraph2 = input<string>('');
  descriptionParagraph3 = input<string>('');
  image = input<string>('');
  imageAlt = input<string>('');

  // Sección de cómo funciona
  howItWorksTitle = input<string>('');
  steps = input<ServiceStep[]>([]);

  // Sección de beneficios
  benefitsTitle = input<string>('');
  benefits = input<ServiceBenefit[]>([]);

  // Sección adicional de beneficios
  additionalBenefitsTitle = input<string>('');
  additionalBenefits = input<ServiceBenefit[]>([]);

  // Mensaje final
  finalMessage = input<string>('');

  ngAfterViewInit(): void {
    // Inicializar animaciones de scroll para elementos principales
    this.scrollAnimationService.observeElements('.services-template__hero');
    this.scrollAnimationService.observeElements('.services-template__intro');
    this.scrollAnimationService.observeElements('.services-template__section');
    this.scrollAnimationService.observeElements('.services-template__final-message');

    // Inicializar animaciones para elementos de listas con delay
    this.scrollAnimationService.observeListItems('.services-template__steps-list');
    this.scrollAnimationService.observeListItems('.services-template__benefits-list');
  }

  ngOnDestroy(): void {
    // El servicio se encarga de limpiar sus propios recursos
  }
}
