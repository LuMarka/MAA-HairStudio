import { Component, signal, computed, ChangeDetectionStrategy, effect, OnDestroy, afterNextRender, inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface CarouselMedia {
  type: 'image' | 'video';
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  poster?: string;
}

@Component({
  selector: 'app-header',
  //imports: [NgOptimizedImage],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly activeIndexSignal = signal(0);
  private readonly isAutoPlayActiveSignal = signal(true);
  private intervalId: number | null = null;

  readonly activeIndex = this.activeIndexSignal.asReadonly();
  readonly isAutoPlayActive = this.isAutoPlayActiveSignal.asReadonly();

  readonly mediaItems = signal<CarouselMedia[]>([
    {
      type: 'image',
      src: '/images/pelu-interior.jpg',
      alt: 'Servicios de peluquería profesional',
      title: 'Bienvenidos a MAA Hair Studio',
      subtitle: 'Somos expertas en vos'
    },
    {
      type: 'image',
      src: '/images/ale-pelu.jpg',
      alt: 'Cortes modernos y estilismo',
      title: 'Beauty Scan',
      subtitle: 'Diagnósticos personalizados para tu cabello online'
    },
    {
      type: 'video',
      src: '/videos/vitaminoColorSpectrum.mp4',
      poster: '/images/pelu-productos.jpg', // Usando imagen existente como poster
      alt: 'Tratamientos capilares Vitamino Color Spectrum',
      title: 'Tratamientos Vitamino Color Spectrum',
      subtitle: 'Cuida tu cabello con los mejores productos'
    },
    {
      type: 'image',
      src: '/images/alejandra.jpg',
      alt: 'Tratamientos capilares premium',
      title: 'Rituales Premium',
      subtitle: 'Cuidado de tu cuero cabelludo y cabello'
    },
    {
      type: 'video',
      src: '/videos/kerastaseGloss.mp4',
      poster: '/images/pelu-productos.jpg', // Usando imagen existente como poster
      alt: 'Kerastace Gloss',
      title: 'Kerastase Gloss',
      subtitle: 'Linea completa para el cuidado del cabello'
    },
  /*   {
      type: 'video',
      src: '/videos/ubicacion.mp4',
      poster: '/images/pelu-productos.jpg', // Usando imagen existente como poster
      alt: 'video ubicacion',
      title: 'Aquí estamos',
      subtitle: 'Vení a conocernos'
    } */
  ]);

  readonly trackTransform = computed(() => -this.activeIndex() * 100);

  constructor() {
    afterNextRender(() => {
      this.startAutoPlay();
    });

    effect(() => {
      if (isPlatformBrowser(this.platformId) && this.isAutoPlayActive()) {
        this.startAutoPlay();
      } else {
        this.stopAutoPlay();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  next(): void {
    const maxIndex = this.mediaItems().length - 1;
    const nextIndex = this.activeIndex() >= maxIndex ? 0 : this.activeIndex() + 1;
    this.activeIndexSignal.set(nextIndex);
  }

  previous(): void {
    const maxIndex = this.mediaItems().length - 1;
    const prevIndex = this.activeIndex() <= 0 ? maxIndex : this.activeIndex() - 1;
    this.activeIndexSignal.set(prevIndex);
    this.pauseAutoPlayTemporarily();
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.mediaItems().length) {
      this.activeIndexSignal.set(index);
      this.pauseAutoPlayTemporarily();
    }
  }

  private startAutoPlay(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.stopAutoPlay();
    this.intervalId = window.setInterval(() => {
      this.next();
    }, 5000); //tiempo entre transiciones
  }

  private stopAutoPlay(): void {
    if (!isPlatformBrowser(this.platformId) || this.intervalId === null) {
      return;
    }

    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private pauseAutoPlayTemporarily(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isAutoPlayActiveSignal.set(false);
    this.stopAutoPlay();

    setTimeout(() => {
      this.isAutoPlayActiveSignal.set(true);
    }, 10000);
  }
}
