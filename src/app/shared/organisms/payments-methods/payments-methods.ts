import {
  Component,
  signal,
  viewChild,
  afterNextRender,
  inject,
  PLATFORM_ID,
  DestroyRef,
  ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface PaymentMethod {
  readonly id: number;
  readonly title: string;
  readonly icon?: string;
  readonly img?: string;
}

@Component({
  selector: 'app-payments-methods',
  imports: [RouterModule],
  templateUrl: './payments-methods.html',
  styleUrls: ['./payments-methods.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsMethods {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly medios = signal<readonly PaymentMethod[]>([
    { id: 1, title: 'TRANSFERENCIA BANCARIA', icon: 'bi bi-bank' },
    { id: 2, title: 'EFECTIVO', icon: 'bi bi-cash' },
    { id: 3, title: 'TARJETAS DE CREDITO', icon: 'bi bi-credit-card' },
    { id: 4, title: 'TARJETAS DE DÉBITO', icon: 'bi bi-credit-card-2-back' },
    { id: 5, title: 'MERCADO PAGO', img: '/images/mercadoPago.jpg' },
  ]);

  readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  private readonly autoScrollInterval = 3000;
  private autoScrollTimer: ReturnType<typeof setInterval> | null = null;
  private isPaused = false;

  constructor() {
    if (!this.isBrowser) return;

    afterNextRender(() => {
      this.startAutoScroll();
    });

    this.destroyRef.onDestroy(() => {
      this.clearAutoScroll();
    });
  }

  private startAutoScroll(): void {
    if (!this.isBrowser) return;

    this.clearAutoScroll();

    this.autoScrollTimer = setInterval(() => {
      if (this.isPaused) return;

      const el = this.track().nativeElement;
      const child = el.querySelector('.payments-methods__card') as HTMLElement;
      if (!child) return;

      const gap = parseInt(getComputedStyle(el).gap || '16', 10);
      const step = child.clientWidth + gap;

      el.scrollBy({ left: step, behavior: 'smooth' });

      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        setTimeout(() => {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        }, 400);
      }
    }, this.autoScrollInterval);
  }

  private clearAutoScroll(): void {
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }

  pauseAutoScroll(): void {
    this.isPaused = true;
  }

  resumeAutoScroll(): void {
    this.isPaused = false;
  }
}
