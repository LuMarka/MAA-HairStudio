import { ChangeDetectionStrategy, Component, input, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { ScrollAnimationService } from '../../../core/services/scroll-animation.service';

@Component({
  selector: 'app-about-template',
  templateUrl: './about-template.html',
  styleUrl: './about-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutTemplate implements AfterViewInit, OnDestroy {
  private scrollAnimationService = inject(ScrollAnimationService);

  title = input<string>('Mi Historia');
  subtitle = input<string>('');
  image = input<string>('');
  imageAlt = input<string>('');
  textParagraphs = input<string[]>([]);
  signature = input<string>('');

  ngAfterViewInit(): void {
    // Inicializar animaciones de scroll para elementos principales
    this.scrollAnimationService.observeElements('.about-template__hero');
    this.scrollAnimationService.observeElements('.about-template__image-section');
    this.scrollAnimationService.observeElements('.about-template__text-section');
  }

  ngOnDestroy(): void {
    // El servicio se encarga de limpiar sus propios recursos
  }
}
