import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { GalleryCards, type GalleryImage } from '../../molecules/gallery-cards/gallery-cards';
import { ScrollAnimationService } from '../../../core/services/scroll-animation.service';

@Component({
  selector: 'app-gallery-template',
  imports: [GalleryCards],
  templateUrl: './gallery-template.html',
  styleUrl: './gallery-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryTemplate implements AfterViewInit, OnDestroy {
  private readonly scrollAnimationService = new ScrollAnimationService();
  readonly imagenesParaLaGaleria = signal<GalleryImage[]>([
    { id: '1', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '2', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '3', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '4', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '5', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '6', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '7', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '8', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '9', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '10', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '11', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '12', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '13', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '14', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '15', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '16', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
  ]);

  ngAfterViewInit(): void {
    // Observar elementos principales de la galería
    this.scrollAnimationService.observeElements('.gallery-template__title');
    this.scrollAnimationService.observeElements('.gallery-template__subtitle');

    // Observar las cards de la galería individualmente para efecto escalonado
    // Solo ejecutar en el browser, no en SSR
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      setTimeout(() => {
        const galleryItems = document.querySelectorAll('.gallery-cards__item');
        galleryItems.forEach((item, index) => {
          // Agregar delay escalonado
          (item as HTMLElement).style.transitionDelay = `${index * 0.1}s`;
          this.scrollAnimationService.observeElements('.gallery-cards__item');
        });
      }, 200);
    }
  }

  ngOnDestroy(): void {
    // El servicio maneja su propia limpieza
  }
}
