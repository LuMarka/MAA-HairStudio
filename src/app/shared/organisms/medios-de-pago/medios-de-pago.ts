import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  signal,
  viewChild,
  OnDestroy,
  AfterViewInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';

export interface Promotion {
  id: number;
  title: string;
  logoSrc: string;
  description: string[];
  detailsUrl: string;
  theme: {
    '--bg-color': string;
    '--text-color': string;
  };
}

@Component({
  selector: 'app-medios-de-pago',
  templateUrl: './medios-de-pago.html',
  styleUrl: './medios-de-pago.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
})
export class MediosDePago implements OnDestroy, AfterViewInit {
  private readonly promotionsCarousel =
    viewChild.required<ElementRef<HTMLElement>>('promotionsCarousel');

  private autoScrollInterval: ReturnType<typeof setInterval> | undefined;
  private readonly isHovering = signal(false);
  private readonly platformId = inject(PLATFORM_ID);

  readonly promotions = signal<Promotion[]>([
    {
      id: 1,
      title: 'SANTANDER WOMEN',
      logoSrc: 'assets/images/logos/santander.svg',
      description: ['10% de reintegro + hasta 6 cuotas sin interés', '¡Todos los días!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#E60000', '--text-color': '#fff' },
    },
    {
      id: 2,
      title: 'VISA + MASTERCARD',
      logoSrc: 'assets/images/logos/visa-mastercard.svg',
      description: ['Hasta 6 cuotas sin interés', '¡Todos los días!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#1a1a1a', '--text-color': '#fff' },
    },
    {
      id: 3,
      title: 'AMERICAN EXPRESS',
      logoSrc: 'assets/images/logos/amex.svg',
      description: ['Hasta 6 cuotas sin interés', '¡Todos los días!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#016fcf', '--text-color': '#fff' },
    },
    {
      id: 4,
      title: 'SANTANDER',
      logoSrc: 'assets/images/logos/santander.svg',
      description: ['Hasta 12 cuotas sin interés', '¡Todos los días!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#E60000', '--text-color': '#fff' },
    },
    {
      id: 5,
      title: 'MERCADO PAGO',
      logoSrc: 'assets/images/logos/mercado-pago.svg',
      description: ['Hasta 6 cuotas sin interés', '¡Todos los días!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#00AEEF', '--text-color': '#fff' },
    },
    {
      id: 6,
      title: 'BBVA',
      logoSrc: 'assets/images/logos/bbva.svg',
      description: ['3 cuotas sin interés', '¡Todos los Martes!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#004481', '--text-color': '#fff' },
    },
    {
      id: 7,
      title: 'BANCO GALICIA',
      logoSrc: 'assets/images/logos/galicia.svg',
      description: ['20% de ahorro', '¡Todos los Jueves!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#F36F21', '--text-color': '#fff' },
    },
    {
      id: 8,
      title: 'BANCO PATAGONIA',
      logoSrc: 'assets/images/logos/patagonia.svg',
      description: ['Hasta 12 cuotas sin interés', '¡Todos los días!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#009A4D', '--text-color': '#fff' },
    },
  ]);

   private readonly scrollPosition = signal(0);
  readonly canScrollLeft = computed(() => this.scrollPosition() > 0);
  readonly canScrollRight = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return false;
    const el = this.promotionsCarousel()?.nativeElement;
    if (!el) return false;
    const maxScroll = el.scrollWidth - el.clientWidth;
    return this.scrollPosition() < maxScroll - 1;
  });

  ngAfterViewInit(): void {
    // Asegura que la lógica del carrusel solo se ejecute en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoScroll();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  onScroll(): void {
    const el = this.promotionsCarousel().nativeElement;
    this.scrollPosition.set(el.scrollLeft);
  }

  scroll(direction: 'left' | 'right'): void {
    this.stopAutoScroll();
    const el = this.promotionsCarousel().nativeElement;
    const scrollAmount = el.clientWidth * 0.8;
    const newPosition =
      direction === 'left'
        ? el.scrollLeft - scrollAmount
        : el.scrollLeft + scrollAmount;

    el.scrollTo({ left: newPosition, behavior: 'smooth' });
    if (!this.isHovering()) {
      setTimeout(() => this.startAutoScroll(), 5000); // Reanuda después de 5s
    }
  }

  onMouseEnter(): void {
    this.isHovering.set(true);
    this.stopAutoScroll();
  }

  onMouseLeave(): void {
    this.isHovering.set(false);
    this.startAutoScroll();
  }

  private startAutoScroll(): void {
    this.stopAutoScroll(); // Asegura que no haya múltiples intervalos
    this.autoScrollInterval = setInterval(() => {
      const el = this.promotionsCarousel().nativeElement;
      if (this.canScrollRight()) {
        // Llama al método scroll en lugar de scrollTo directamente
        this.scroll('right');
      } else {
        // Vuelve al principio para un bucle infinito
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, 3000); // Cambia de tarjeta cada 3 segundos
  }

  private stopAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }
}
