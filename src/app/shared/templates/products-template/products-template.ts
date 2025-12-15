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
import { ActivatedRoute } from '@angular/router';
import { Products } from '../../organisms/products/products';
import { ScrollAnimationService } from '../../../core/services/scroll-animation.service';
import { ProductsService, ProductsApiResponse, ProductFilters } from '../../../core/services/products.service';
import { PaginationEvent } from '../../molecules/paginator/paginator';

@Component({
  selector: 'app-products-template',
  imports: [Products],
  templateUrl: './products-template.html',
  styleUrl: './products-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsTemplate implements AfterViewInit, OnDestroy, OnInit {
  // Dependencias inyectadas
  private readonly scrollAnimationService = inject(ScrollAnimationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);

  // Inputs
  readonly title = input.required<string>();
  readonly showFilters = input(true);
  readonly limit = input(10);

  // State management con signals
  private readonly _productsData = signal<ProductsApiResponse | null>(null);
  private readonly _localLoading = signal(false);
  private readonly _localError = signal<string | null>(null);
  private readonly _currentFilters = signal<Partial<ProductFilters>>({});
  private readonly _searchQuery = signal<string>('');

  // Computed values - estado derivado
  readonly productsData = computed(() => this._productsData());
  readonly productsList = computed(() => this._productsData()?.data || []);
  readonly meta = computed(() => this._productsData()?.meta);
  readonly currentFilters = computed(() => this._currentFilters());
  readonly searchQuery = computed(() => this._searchQuery());
  readonly isLoading = computed(() => this._localLoading() || this.productsService.loading());
  readonly error = computed(() => this._localError() || this.productsService.error());
  readonly hasProducts = computed(() => this.productsList().length > 0);
  readonly allFilters = computed(() => this._productsData()?.filters || {});

  // Computed para verificar si hay filtros activos (incluyendo búsqueda)
  readonly hasActiveFilters = computed(() => {
    const filters = this.getCurrentFilters();
    const baseFilters = ['limit', 'page'];

    return Object.keys(filters).some(key =>
      !baseFilters.includes(key) && filters[key as keyof ProductFilters]
    );
  });

  // Computed para el título dinámico (incluyendo búsquedas)
  readonly dynamicTitle = computed(() => {
    const searchQuery = this.searchQuery();
    if (searchQuery) {
      return `Resultados para "${searchQuery}"`;
    }
    return this.title();
  });

  ngOnInit(): void {
    // Escuchar cambios en los query parameters
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const searchParam = params['search'] || '';
        const brandParam = params['brand'] || '';
        this._searchQuery.set(searchParam);

        // Inicializar filtros con búsqueda y marca si existen
        this.initializeFilters(searchParam, brandParam);
        this.loadProducts();
      });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeScrollAnimations();
    }
  }

  ngOnDestroy(): void {
    // takeUntilDestroyed maneja la limpieza automáticamente
  }

  // Métodos públicos para manejo de eventos
  onPageChange(event: PaginationEvent): void {
    const newFilters = {
      page: event.page,
      limit: event.limit
    };

    this.updateFilters(newFilters, false);
    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  onCategoryFilterChange(categoryId: string): void {
    const categoryFilter = categoryId ? { categoryId } : {};
    if (!categoryId || categoryId.trim() === '') {
      this.clearFilter('categoryId');
      return;
    }
    this.updateFilters(categoryFilter, true);
    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  onSubCategoryFilterChange(subcategoryId: string): void {
    if (!subcategoryId || subcategoryId.trim() === '') {
      this.clearFilter('subcategoryId' as keyof ProductFilters);
      return;
    }

    const subcategoryFilter: Partial<ProductFilters> = { subcategoryId };
    this.updateFilters(subcategoryFilter, true);
    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  onSearchChange(searchTerm: string): void {
    this._searchQuery.set(searchTerm);
    const searchFilter = searchTerm ? { search: searchTerm } : {};

    this.updateFilters(searchFilter, true);
    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  onPriceFilterChange(minPrice?: number, maxPrice?: number): void {
    const priceFilters: Partial<ProductFilters> = {};

    if (minPrice !== undefined) priceFilters.minPrice = minPrice;
    if (maxPrice !== undefined) priceFilters.maxPrice = maxPrice;

    this.updateFilters(priceFilters, true);
    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  onSortChange(sortData: { sortBy: string; sortOrder: string }): void {
    const sortFilter = {
      sortBy: sortData.sortBy as ProductFilters['sortBy'],
      sortOrder: sortData.sortOrder as ProductFilters['sortOrder']
    };

    this.updateFilters(sortFilter, true);
    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  onProductTypeFilterChange(type: ProductFilters['type_product']): void {
    if (!type || type.trim() === '') {
      this.clearFilter('type_product');
      return;
    }

    const productTypeFilter: Partial<ProductFilters> = { type_product: type };
    this.updateFilters(productTypeFilter, true);
    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  // Métodos públicos para control de filtros
  clearAllFilters(): void {
    this._searchQuery.set('');
    this.initializeFilters();
    this.loadProducts();
  }

  clearFilter(filterKey: keyof ProductFilters): void {
    if (filterKey === 'search') {
      this._searchQuery.set('');
    }

    this._currentFilters.update(current => {
      const updated = { ...current };
      delete updated[filterKey];
      return updated;
    });

    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  reloadProducts(): void {
    this.loadProducts();
  }

  clearError(): void {
    this._localError.set(null);
    this.productsService.clearError();
  }

  onFilterChange(filters: Partial<ProductFilters>): void {
    this.updateFilters(filters, true);
    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  // Métodos privados - lógica interna
  private initializeFilters(searchQuery?: string, brandQuery?: string): void {
    const baseFilters: Partial<ProductFilters> = {
      limit: this.limit(),
      page: 1
    };

    if (searchQuery) {
      baseFilters.search = searchQuery;
    }

    if (brandQuery) {
      baseFilters.brand = brandQuery;
    }

    this._currentFilters.set(baseFilters);
  }

  private loadProducts(): void {
    this.loadProductsWithFilters(this.getCurrentFilters());
  }

  private getCurrentFilters(): Partial<ProductFilters> {
    return this._currentFilters();
  }

  private updateFilters(newFilters: Partial<ProductFilters>, resetPage = true): void {
    this._currentFilters.update(current => ({
      ...current,
      ...newFilters,
      ...(resetPage && { page: 1 })
    }));
  }

  private loadProductsWithFilters(filters: Partial<ProductFilters>): void {
    this._localLoading.set(true);
    this._localError.set(null);

    this.productsService.getProducts(filters)
      .pipe(
        tap((response: ProductsApiResponse) => {
          this._productsData.set(response);
        }),
        catchError((error) => {
          const errorMessage = error?.error?.message || 'Error al cargar productos';
          this._localError.set(errorMessage);
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

  private initializeScrollAnimations(): void {
    if (!this.hasProducts()) return;

    this.scrollAnimationService.observeElements('.products-type-filter');
    this.scrollAnimationService.observeElements('.products-filter');
    this.scrollAnimationService.observeElements('.products__brand-group');

    setTimeout(() => {
      const productCards = document.querySelectorAll('.product-card');
      productCards.forEach((card, index) => {
        (card as HTMLElement).style.transitionDelay = `${index * 0.05}s`;
      });
      this.scrollAnimationService.observeElements('.product-card');
    }, 300);
  }

  onRetry(): void {
    this.reloadProducts();
  }
}

