import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

interface Producto {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: string;
  image: string;
}

@Component({
  selector: 'app-productos',
  imports: [NgOptimizedImage],
  template: `
    <section class="featured" aria-labelledby="productos-title">
      <div class="featured__container">
        <div class="featured__header">
          <div class="featured__badge">En venta</div>
          <h2 id="productos-title" class="featured__title">Productos en venta</h2>
          <p class="featured__subtitle">Descubre lo mejor para tu cabello</p>
          <div class="featured__decoration"></div>
        </div>
        <div class="featured__carousel">
          <button
            class="featured__arrow featured__arrow--prev"
            [class.featured__arrow--disabled]="isFirstPage()"
            (click)="previousPage()"
            aria-label="Ver productos anteriores">
            <span class="featured__arrow-icon">❮</span>
          </button>
          <div class="featured__grid" #productGrid>
            @for (product of visibleProducts(); track product.id) {
              <article
                class="product-card"
                [class.product-card--visible]="isProductVisible(product.id)"
                [attr.data-product-id]="product.id"
                #productCard>
                <div class="product-card__image-container">
                  <div class="product-card__image-skeleton"></div>
                  @if (currentPage() === 0) {
                    <img
                      [ngSrc]="product.image"
                      [alt]="product.name"
                      class="product-card__image"
                      width="220"
                      height="220"
                      priority
                      (load)="onImageLoad(product.id)"
                    />
                  } @else {
                    <img
                      [ngSrc]="product.image"
                      [alt]="product.name"
                      class="product-card__image"
                      width="220"
                      height="220"
                      loading="lazy"
                      (load)="onImageLoad(product.id)"
                    />
                  }
                  <div class="product-card__badge">Top</div>
                </div>
                <div class="product-card__content">
                  <p class="product-card__brand">{{ product.brand }}</p>
                  <h3 class="product-card__name">{{ product.name }}</h3>
                  <p class="product-card__description">{{ product.description }}</p>
                  <div class="product-card__footer">
                    <span class="product-card__price">{{ product.price }}</span>
                    <button class="product-card__button">
                      <span class="product-card__button-text">Comprar</span>
                    </button>
                  </div>
                </div>
              </article>
            }
          </div>
          <button
            class="featured__arrow featured__arrow--next"
            [class.featured__arrow--disabled]="isLastPage()"
            (click)="nextPage()"
            aria-label="Ver más productos">
            <span class="featured__arrow-icon">❯</span>
          </button>
        </div>
        <div class="featured__pagination">
          @for (page of pageIndicators(); track page) {
            <button
              class="featured__page-dot"
              [class.featured__page-dot--active]="currentPage() === page"
              (click)="goToPage(page)"
              aria-label="Ir a página {{page + 1}}">
            </button>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductosComponent {
  productos = signal<Producto[]>([
    {
      id: 1,
      name: 'Shampoo Nutritivo',
      brand: 'Kérastase',
      description: 'Nutre y fortalece el cabello.',
      price: '$3200',
      image: '/assets/shampoo-kerastase.jpg'
    },
    {
      id: 2,
      name: 'Acondicionador Reparador',
      brand: "L'Oréal",
      description: 'Repara y suaviza el cabello.',
      price: '$2800',
      image: '/assets/acondicionador-loreal.jpg'
    }
    // Agrega más productos aquí
  ]);

  pageSize = 3;
  currentPage = signal(0);

  totalPages = computed(() => Math.ceil(this.productos().length / this.pageSize));

  visibleProducts = computed(() =>
    this.productos().slice(
      this.currentPage() * this.pageSize,
      (this.currentPage() + 1) * this.pageSize
    )
  );

  pageIndicators = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  isFirstPage = (): boolean => this.currentPage() === 0;
  isLastPage = (): boolean => this.currentPage() === this.totalPages() - 1;

  previousPage(): void {
    if (!this.isFirstPage()) this.currentPage.update(p => p - 1);
  }
  nextPage(): void {
    if (!this.isLastPage()) this.currentPage.update(p => p + 1);
  }
  goToPage(page: number): void {
    this.currentPage.set(page);
  }
  isProductVisible(id: number): boolean {
    return this.visibleProducts().some(product => product.id === id);
  }
  onImageLoad(_id: number): void {
    // Puedes agregar lógica de animación aquí si lo deseas
  }
}
