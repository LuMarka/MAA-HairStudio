import {
  AfterViewInit,
  Component,
  OnDestroy,
  inject,
  PLATFORM_ID,
  DestroyRef,
  input,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError, finalize } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { Products } from '../../organisms/products/products';
import { ScrollAnimationService } from '../../../core/services/scroll-animation.service';
import { ProductsService, Product, ProductsApiResponse, ProductFilters } from '../../../core/services/products.service';
import { PaginationEvent } from '../../molecules/paginator/paginator';

@Component({
  selector: 'app-products-template',
  imports: [Products],
  templateUrl: './products-template.html',
  styleUrl: './products-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsTemplate implements AfterViewInit, OnDestroy, OnInit {
  private readonly scrollAnimationService = inject(ScrollAnimationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);

  // State management con signals
  private readonly _productsData = signal<ProductsApiResponse | null>(null);
  private readonly _localLoading = signal(false);
  private readonly _localError = signal<string | null>(null);

  // Computed values
  readonly productsData = computed(() => this._productsData());
  readonly productsList = computed(() => this._productsData()?.data || []);
  readonly meta = computed(() => this._productsData()?.meta);
  readonly filters = signal<ProductFilters | null>(null);
  readonly isLoading = computed(() => this._localLoading() || this.productsService.loading());
  readonly error = computed(() => this._localError() || this.productsService.error());
  readonly hasProducts = computed(() => this.productsList().length > 0);

  // Inputs usando input()
  title = input.required<string>();
  products = signal<ProductsApiResponse | null>(null);
  showFilters = input(true);
  limit = input(2);

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeScrollAnimations();
    }
  }

  ngOnDestroy(): void {
    // takeUntilDestroyed maneja la limpieza automáticamente
  }

  private loadProducts(): void {
    this._localLoading.set(true);
    this._localError.set(null);

    this.productsService.getProducts({
      limit: this.limit(),
      isFeatured: true // O cualquier filtro que necesites
    })
    .pipe(
      tap((response: ProductsApiResponse) => {
        this._productsData.set(response);
        // Actualizar el estado del servicio también
        this.products.set(response);
        console.log('Productos cargados exitosamente:', response);
      }),
      catchError((error) => {
        const errorMessage = error?.error?.message || 'Error al cargar productos';
        this._localError.set(errorMessage);
        this.productsService.setError(errorMessage);
        console.error('Error al cargar productos:', error);
        return EMPTY;
      }),
      finalize(() => {
        this._localLoading.set(false);
      }),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe();
  }

  // Método para recargar productos
  reloadProducts(): void {
    this.loadProducts();
  }

  onPageChange(event: PaginationEvent): void {
    const currentFilters = this.getCurrentFilters(); // Obtén tus filtros actuales

    this.loadProductsWithFilters({
      ...currentFilters,
      page: event.page,
      limit: event.limit
    });
  }

  private getCurrentFilters(): Partial<any> {
    // Retorna los filtros actuales basados en el estado de los filtros
    return this.filters() || {};
  }

  // Método para cargar productos con filtros específicos
  loadProductsWithFilters(filters: Partial<any>): void {
    this._localLoading.set(true);
    this._localError.set(null);

    this.productsService.getProducts(filters)
    .pipe(
      tap((response: ProductsApiResponse) => {
        this._productsData.set(response);
        this.products.set(response);
        console.log('Productos cargados exitosamente:', response);
      }),
      catchError((error) => {
        const errorMessage = error?.error?.message || 'Error al cargar productos';
        this._localError.set(errorMessage);
        this.productsService.setError(errorMessage);
        return EMPTY;
      }),
      finalize(() => {
        this._localLoading.set(false);
      }),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe();
  }

  // Método para limpiar errores
  clearError(): void {
    this._localError.set(null);
    this.productsService.clearError();
  }

  private initializeScrollAnimations(): void {
    if (!this.hasProducts()) return;

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

  // Métodos para manejar eventos de UI
  onRetry(): void {
    this.reloadProducts();
  }

  onFilterChange(filters: any): void {
    this.loadProductsWithFilters(filters);
  }
}

