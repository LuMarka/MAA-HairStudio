import { Component, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface PaymentMethod { id: number; title: string; icon?: string; img?: string }

@Component({
  selector: 'app-payments-methods',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payments-methods.html',
  styleUrls: ['./payments-methods.scss'],
})
export class PaymentsMethods {
  medios = signal<PaymentMethod[]>([
    { id: 1, title: 'TRANSFERENCIA BANCARIA', icon: 'bi bi-bank' },
    { id: 2, title: 'EFECTIVO', icon: 'bi bi-cash' },
    { id: 3, title: 'TARJETAS DE CREDITO', icon: 'bi bi-credit-card' },
    { id: 4, title: 'TARJETAS DE DÉBITO', icon: 'bi bi-credit-card-2-back' },
    /* { id: 5, title: 'MODO', img: '/images/modo.png' }, */
    { id: 6, title: 'MERCADO PAGO', img: '/images/mercadoPago.jpg' },
  ]);

  @ViewChild('track', { read: ElementRef }) track!: ElementRef<HTMLElement>;

  private autoScrollInterval = 3000; // ms
  private autoScrollTimer: any = null;
  private isPaused = false;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    // start auto scroll outside angular to avoid change detection churn
    this.ngZone.runOutsideAngular(() => this.startAutoScroll());
  }

  ngOnDestroy(): void {
    this.clearAutoScroll();
  }

  private startAutoScroll(): void {
    this.clearAutoScroll();
    this.autoScrollTimer = setInterval(() => {
      if (this.isPaused) {
        return;
      }
      const el = this.track?.nativeElement;
      if (!el) {
        return;
      }
      // scroll by one card width (approx)
      const child = el.querySelector('.payments-methods__card');
      const step = child ? child.clientWidth + parseInt(getComputedStyle(el).gap || '16') : 140;
      el.scrollBy({ left: step, behavior: 'smooth' });
      // if we reached end, go to start
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 400);
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
