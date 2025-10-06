import {
  AfterViewInit,
  Component,
  OnDestroy,
  inject,
  PLATFORM_ID,
  DestroyRef,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Products } from '../../organisms/products/products';
import { ScrollAnimationService } from '../../../core/services/scroll-animation.service';

interface Product {
  id: number;
  name: string;
  brand: 'Loreal' | 'Kerastase';
  collection: string;
  type: string;
  description: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-products-template',
  imports: [Products],
  templateUrl: './products-template.html',
  styleUrl: './products-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsTemplate implements AfterViewInit, OnDestroy {
  private readonly scrollAnimationService = inject(ScrollAnimationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  // Usar input() en lugar de @Input()
  title = input.required<string>();
  products = input<Product[]>([]);

  ngAfterViewInit(): void {
    // Solo ejecutar en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.initializeScrollAnimations();
    }
  }

  ngOnDestroy(): void {
    // takeUntilDestroyed maneja la limpieza automáticamente
  }

  private initializeScrollAnimations(): void {
    // Observar elementos principales de productos
    this.scrollAnimationService.observeElements('.products-type-filter');
    this.scrollAnimationService.observeElements('.products-filter');
    this.scrollAnimationService.observeElements('.products__brand-group');

    // Observar las cards de productos con efecto escalonado
    setTimeout(() => {
      const productCards = document.querySelectorAll('.product-card');
      productCards.forEach((card, index) => {
        // Agregar delay escalonado
        (card as HTMLElement).style.transitionDelay = `${index * 0.05}s`;
      });
      this.scrollAnimationService.observeElements('.product-card');
    }, 300);
  }
}

