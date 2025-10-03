import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, signal, computed } from '@angular/core';
import { GalleryImageComponent } from '../../organisms/gallery-image/gallery-image';
import { ScrollAnimationService } from '../../../core/services/scroll-animation.service';

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}


@Component({
  selector: 'app-gallery-template',
  imports: [GalleryImageComponent],
  templateUrl: './gallery-template.html',
  styleUrl: './gallery-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryTemplate implements AfterViewInit, OnDestroy {
  private readonly scrollAnimationService = new ScrollAnimationService();
  private resizeListener?: () => void;

  // Gallery functionality
  private readonly currentPageSignal = signal(0);
  readonly currentPage = this.currentPageSignal.asReadonly();

  // Items por página (responsivo): 2 en mobile, 4 en tablet/desktop
  private readonly itemsPerPageSignal = signal(4);
  private readonly itemsPerPage = this.itemsPerPageSignal.asReadonly();

  private readonly modalImageSignal = signal<GalleryImage | null>(null);
  readonly modalImage = this.modalImageSignal.asReadonly();

  readonly imagenesParaLaGaleria = signal<GalleryImage[]>([
    {
      id: '1',
      src: '/images/ale-pelu.jpg',
      alt: 'Trabajo de peinado profesional',
      caption: 'Peinado elegante',
    },
    {
      id: '2',
      src: '/images/alejandra.jpg',
      alt: 'Corte y peinado moderno',
      caption: 'Estilo moderno',
    },
    {
      id: '3',
      src: '/images/pelu-interior.jpg',
      alt: 'Interior del salón',
      caption: 'Nuestro salón',
    },
    {
      id: '4',
      src: '/images/pelu-int.1.jpg',
      alt: 'Ambiente del salón',
      caption: 'Ambiente acogedor',
    },
    {
      id: '5',
      src: '/images/pelu-productos.jpg',
      alt: 'Productos profesionales',
      caption: 'Productos premium',
    },
    {
      id: '6',
      src: '/images/miHistoria.jpg',
      alt: 'Historia del salón',
      caption: 'Nuestra historia',
    },
    {
      id: '7',
      src: '/images/ale.jpg',
      alt: 'Profesional trabajando',
      caption: 'Trabajo profesional',
    },
    {
      id: '8',
      src: '/images/ker_nutritive.jpg',
      alt: 'Tratamiento nutritivo',
      caption: 'Cuidado capilar',
    },
    {
      id: '9',
      src: '/images/kerastase.png',
      alt: 'Productos Kérastase',
      caption: 'Línea Kérastase',
    },
    {
      id: '10',
      src: '/images/1757106933.png',
      alt: 'Trabajo realizado',
      caption: 'Resultado profesional',
    },
    {
      id: '11',
      src: '/images/IsologoBlanco.png',
      alt: 'Logo del salón',
      caption: 'MAA Hair Studio',
    },
    {
      id: '12',
      src: '/images/mi_Historia.png',
      alt: 'Nuestra trayectoria',
      caption: 'Experiencia y dedicación',
    },
    {
      id: '13',
      src: '/images/ale-pelu.jpg',
      alt: 'Transformación capilar',
      caption: 'Resultado increíble',
    },
    {
      id: '14',
      src: '/images/alejandra.jpg',
      alt: 'Técnica avanzada',
      caption: 'Innovación constante',
    },
    {
      id: '15',
      src: '/images/pelu-interior.jpg',
      alt: 'Espacio moderno',
      caption: 'Ambiente único',
    },
    {
      id: '16',
      src: '/images/pelu-int.1.jpg',
      alt: 'Experiencia completa',
      caption: 'Dedicación total',
    },
    {
      id: '17',
      src: '/images/pelu-int.1.jpg',
      alt: 'Experiencia completa',
      caption: 'Dedicación total',
    },
    {
      id: '18',
      src: '/images/pelu-int.1.jpg',
      alt: 'Experiencia completa',
      caption: 'Dedicación total',
    },
    {
      id: '19',
      src: '/images/pelu-int.1.jpg',
      alt: 'Experiencia completa',
      caption: 'Dedicación total',
    },
    {
      id: '20',
      src: '/images/pelu-int.1.jpg',
      alt: 'Experiencia completa',
      caption: 'Dedicación total',
    },
    {
      id: '21',
      src: '/images/pelu-int.1.jpg',
      alt: 'Experiencia completa',
      caption: 'Dedicación total',
    },
    {
      id: '22',
      src: '/images/pelu-int.1.jpg',
      alt: 'Experiencia completa',
      caption: 'Dedicación total',
    },
    {
      id: '23',
      src: '/images/pelu-int.1.jpg',
      alt: 'Experiencia completa',
      caption: 'Dedicación total',
    },
    {
      id: '24',
      src: '/images/pelu-int.1.jpg',
      alt: 'Experiencia completa',
      caption: 'Dedicación total',
    },
  ]);

  // Método para cargar más imágenes en el futuro
  loadMoreImages(newImages: GalleryImage[]): void {
    this.imagenesParaLaGaleria.update((current) => [...current, ...newImages]);
  }

  readonly hasImages = computed(() => this.imagenesParaLaGaleria().length > 0);

  // Paginación: imágenes por página según ancho de pantalla
  readonly totalPages = computed(() => {
    const images = this.imagenesParaLaGaleria();
    const perPage = this.itemsPerPage();
    return Math.max(1, Math.ceil(images.length / perPage));
  });

  readonly currentPageImages = computed(() => {
    const images = this.imagenesParaLaGaleria();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const startIndex = page * perPage;
    return images.slice(startIndex, startIndex + perPage);
  });

  openModal(image: GalleryImage): void {
    this.modalImageSignal.set(image);
  }

  closeModal(): void {
    this.modalImageSignal.set(null);
  }

  nextPage(): void {
    const nextPageIndex = this.currentPageSignal() + 1;
    console.log(
      'nextPage - current:',
      this.currentPageSignal(),
      'next:',
      nextPageIndex,
      'totalPages:',
      this.totalPages()
    );
    if (nextPageIndex < this.totalPages()) {
      this.currentPageSignal.set(nextPageIndex);
    }
  }

  previousPage(): void {
    const prevPageIndex = this.currentPageSignal() - 1;
    console.log('previousPage - current:', this.currentPageSignal(), 'prev:', prevPageIndex);
    if (prevPageIndex >= 0) {
      this.currentPageSignal.set(prevPageIndex);
    }
  }

  ngAfterViewInit(): void {
    // Observar elementos principales de la galería
    this.scrollAnimationService.observeElements('.gallery-template__title');
    this.scrollAnimationService.observeElements('.gallery-template__subtitle');

    // Observar la grilla de imágenes
    // Solo ejecutar en el browser, no en SSR
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const applyItemsPerPage = () => {
        // móvil: <= 600px (ajustable)
        const isMobile = window.matchMedia('(max-width: 600px)').matches;
        const desired = isMobile ? 2 : 4;
        if (this.itemsPerPageSignal() !== desired) {
          this.itemsPerPageSignal.set(desired);
          // Ajustar página actual si queda fuera de rango
          const total = this.totalPages();
          const current = this.currentPageSignal();
          if (current > total - 1) {
            this.currentPageSignal.set(Math.max(0, total - 1));
          }
        }
      };

      // Inicial
      applyItemsPerPage();

      // Resize listener
      const onResize = () => applyItemsPerPage();
      window.addEventListener('resize', onResize);
      this.resizeListener = () => window.removeEventListener('resize', onResize);

      setTimeout(() => {
        this.scrollAnimationService.observeElements('.gallery-template__grid');
        this.scrollAnimationService.observeElements('.gallery-template__grid-item');
      }, 200);
    }
  }

  ngOnDestroy(): void {
    // El servicio maneja su propia limpieza
    if (this.resizeListener) {
      this.resizeListener();
      this.resizeListener = undefined;
    }
  }
}
