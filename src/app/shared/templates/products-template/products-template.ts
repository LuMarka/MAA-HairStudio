import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { Products } from '../../organisms/products/products';
import { ScrollAnimationService } from '../../../core/services/scroll-animation.service';

interface Product {
  id: number;
  name: string;
  brand: 'Loreal' | 'Kerastase';
  collection: string; // en lugar de familia
  type: string;       // shampoo, conditioner, etc.
  description: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-products-template',
  imports: [Products],
  templateUrl: './products-template.html',
  styleUrl: './products-template.scss'
})
export class ProductsTemplate implements AfterViewInit, OnDestroy {
  private readonly scrollAnimationService = new ScrollAnimationService();

  @Input() title!: string;
  @Input() products: Product[] = [];

  ngAfterViewInit(): void {
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

  ngOnDestroy(): void {
    // El servicio maneja su propia limpieza
  }
}

