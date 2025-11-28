import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
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
      src: '/images/pelu-int.1.jpg',
      alt: 'Vista interior del salón de MAA Hair Studio',
      caption: '',
    },
    {
      id: '2',
      src: '/images/galeria/1.jpg',
      alt: 'Trabajo realizado',
      /* caption: 'Estilo moderno', */
    },
    {
      id: '3',
      src: '/images/galeria/2.jpg',
      alt: 'Nuestros Productos',
      /* caption : 'Nuestro salón',*/
    },
    {
      id: '4',
      src: '/images/galeria/3.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Ambiente acogedor',*/
    },
    {
      id: '5',
      src: '/images/galeria/4.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Productos premium',*/
    },
    {
      id: '6',
      src: '/images/galeria/5.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Nuestra historia',*/
    },
    {
      id: '7',
      src: '/images/galeria/6.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Trabajo profesional',*/
    },
    {
      id: '8',
      src: '/images/galeria/7.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Cuidado capilar',*/
    },
    {
      id: '9',
      src: '/images/galeria/8.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Línea Kérastase',*/
    },
    {
      id: '10',
      src: '/images/galeria/9.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Resultado profesional',*/
    },
    {
      id: '11',
      src: '/images/galeria/10.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'MAA Hair Studio',*/
    },
    {
      id: '12',
      src: '/images/galeria/11.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Experiencia y dedicación',*/
    },
    {
      id: '13',
      src: '/images/galeria/12.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Resultado increíble',*/
    },
    {
      id: '14',
      src: '/images/galeria/13.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Innovación constante',*/
    },
    {
      id: '15',
      src: '/images/galeria/14.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Ambiente único',*/
    },
    {
      id: '16',
      src: '/images/galeria/15.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '17',
      src: '/images/galeria/16.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '18',
      src: '/images/galeria/17.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '19',
      src: '/images/galeria/18.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '20',
      src: '/images/galeria/19.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '21',
      src: '/images/galeria/20.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '22',
      src: '/images/galeria/21.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '23',
      src: '/images/galeria/22.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '24',
      src: '/images/galeria/23.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '25',
      src: '/images/galeria/24.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '26',
      src: '/images/galeria/25.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '27',
      src: '/images/galeria/26.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '28',
      src: '/images/galeria/27.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '29',
      src: '/images/galeria/28.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '30',
      src: '/images/galeria/29.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '31',
      src: '/images/galeria/30.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '32',
      src: '/images/galeria/31.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '33',
      src: '/images/galeria/32.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '34',
      src: '/images/galeria/33.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '35',
      src: '/images/galeria/34.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '36',
      src: '/images/galeria/35.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '37',
      src: '/images/galeria/36.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '38',
      src: '/images/galeria/37.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '39',
      src: '/images/galeria/38.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '40',
      src: '/images/galeria/39.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '41',
      src: '/images/galeria/40.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '42',
      src: '/images/galeria/41.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '43',
      src: '/images/galeria/42.jpg',
      alt: 'Trabajo realizado',
      /* caption : 'Dedicación total',*/
    },
    {
      id: '44',
      src: '/images/galeria/43.jpg',
      alt: 'Trabajo realizado',
      /*  caption : 'Dedicación total',*/
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
