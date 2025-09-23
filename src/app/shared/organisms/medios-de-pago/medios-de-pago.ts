import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';


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
export class MediosDePago {
  private readonly promotionsCarousel =
    viewChild.required<ElementRef<HTMLElement>>('promotionsCarousel');

  readonly promotions = signal<Promotion[]>([
    {
      id: 1,
      title: 'MERCADO PAGO',
      logoSrc: 'assets/images/logos/mercado-pago.svg',
      description: ['Hasta 6 cuotas sin interés', '¡Todos los días!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#00AEEF', '--text-color': '#fff' },
    },
    {
      id: 2,
      title: 'BANCO NACIÓN - EXCLUSIVO MODO',
      logoSrc: 'assets/images/logos/banco-nacion.svg',
      description: [
        '15% de reintegro + hasta 9 c/s interés ó hasta 12 c/s interés',
        'Viernes, Sábados y Domingos',
      ],
      detailsUrl: '#',
      theme: { '--bg-color': '#004B8D', '--text-color': '#fff' },
    },
    {
      id: 3,
      title: 'NARANJA X',
      logoSrc: 'assets/images/logos/naranja-x.svg',
      description: [
        '10% de reintegro + hasta 6 c/s interés ó 10 c/s interés',
        '¡Todos los días!',
      ],
      detailsUrl: '#',
      theme: { '--bg-color': '#FF6600', '--text-color': '#fff' },
    },
    {
      id: 4,
      title: 'BANCO SANTA FE',
      logoSrc: 'assets/images/logos/banco-santa-fe.svg',
      description: [
        '10% de reintegro + hasta 12 cuotas sin interés',
        '¡Todos los días!',
      ],
      detailsUrl: '#',
      theme: { '--bg-color': '#00A551', '--text-color': '#fff' },
    },
    {
      id: 5,
      title: 'SANTANDER WOMEN',
      logoSrc: 'assets/images/logos/santander.svg',
      description: ['10% de reintegro + hasta 6 cuotas sin interés', '¡Todos los días!'],
      detailsUrl: '#',
      theme: { '--bg-color': '#E60000', '--text-color': '#fff' },
    },
  ]);

  private readonly scrollPosition = signal(0);
  readonly canScrollLeft = computed(() => this.scrollPosition() > 0);
  readonly canScrollRight = computed(() => {
    const el = this.promotionsCarousel()?.nativeElement;
    if (!el) return false;
    // Corrección: Se añade una tolerancia de 1px al cálculo para evitar
    // problemas de redondeo de píxeles en el navegador.
    const maxScroll = el.scrollWidth - el.clientWidth;
    return this.scrollPosition() < maxScroll - 1;
  });

  onScroll(): void {
    const el = this.promotionsCarousel().nativeElement;
    this.scrollPosition.set(el.scrollLeft);
  }

  scroll(direction: 'left' | 'right'): void {
    const el = this.promotionsCarousel().nativeElement;
    const scrollAmount = el.clientWidth * 0.8; // Scroll by 80% of the visible width
    const newPosition =
      direction === 'left'
        ? el.scrollLeft - scrollAmount
        : el.scrollLeft + scrollAmount;

    el.scrollTo({ left: newPosition, behavior: 'smooth' });
  }
}
