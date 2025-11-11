import { Component, ChangeDetectionStrategy, inject, input, output, OnInit, signal, computed, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCard } from '../../molecules/product-card/product-card';
import { ProductsApiResponse } from '../../../core/services/products.service';
import { PaginationEvent, Paginator } from "../../molecules/paginator/paginator";
import { CategoryService } from '../../../core/services/category.service';
import { SubCategoryService } from '../../../core/services/subcategory.service';
import { ActivatedRoute, Router } from '@angular/router';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';

// Enum para los tipos de productos
export enum ProductType {
  TODOS = '',
  SHAMPOO = 'Shampoo',
  ACONDICIONADOR = 'Acondicionador',
  MASCARILLA = 'Mascarilla',
  SERUM = 'Serum',
  ACEITE = 'Oleo',
  CREMA = 'Crema para peinar',
  GEL = 'Gel',
  MOUSSE = 'Mousse',
  CERA = 'Cera',
  PROTECTOR_TERMICO = 'Crema termoprotectora',
  LEAVE_IN = 'Leave-in',
}

interface SelectOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly color?: string;
  readonly icon?: string;
}

interface SortOption {
  readonly label: string;
  readonly value: string;
  readonly sortBy: 'name' | 'price' | 'finalPrice' | 'rating' | 'popularity' | 'createdAt' | 'updatedAt' | 'brand' | 'viewCount';
  readonly sortOrder: 'ASC' | 'DESC';
}

interface ProductTypeOption {
  readonly label: string;
  readonly value: ProductType;
  readonly icon?: string;
}

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, ProductCard, Paginator],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly subCategoryService = inject(SubCategoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly wishlistService = inject(WishlistService);
  private readonly authService = inject(AuthService);

  // ========== INPUTS ==========
  readonly dataApi = input<ProductsApiResponse | null>();
  readonly inputPaginated = input<PaginationEvent | null>(null);
  readonly searchQuery = input<string>('');

  // ========== OUTPUTS ==========
  readonly paginated = output<PaginationEvent>();
  readonly categoryFilterChanged = output<string>();
  readonly subCategoryFilterChanged = output<string>();
  readonly sortChanged = output<{ sortBy: string; sortOrder: string }>();
  readonly productTypeFilterChanged = output<string>();
  readonly searchChanged = output<string>();

  // ========== SIGNALS ==========
  readonly selectedCategory = signal<string>('');
  readonly selectedSubCategory = signal<string>('');
  readonly selectedSort = signal<string>('name-ASC');
  readonly selectedProductType = signal<ProductType>(ProductType.TODOS);

  // ========== COMPUTED - Categorías ==========
  readonly categoryOptions = computed(() => this.categoryService.categorySelectOptions());
  readonly isLoadingCategories = computed(() => this.categoryService.isLoading());
  readonly categoryError = computed(() => this.categoryService.error());
  readonly activeCategories = computed(() => this.categoryService.activeCategories());
  readonly hasCategoriesAvailable = computed(() => this.activeCategories().length > 0);

  // ========== COMPUTED - Subcategorías ==========
  readonly subCategoryOptions = computed((): SelectOption[] => {
    const categoryId = this.selectedCategory();
    if (!categoryId) return [];
    return this.subCategoryService.subCategorySelectOptionsByCategory()(categoryId);
  });

  readonly isLoadingSubCategories = computed(() => this.subCategoryService.isLoading());
  readonly subCategoryError = computed(() => this.subCategoryService.error());
  readonly hasSubCategoriesAvailable = computed(() => {
    const options = this.subCategoryOptions();
    return options.length > 1 && !options[0]?.disabled;
  });
  readonly shouldShowSubCategorySelect = computed(() => Boolean(this.selectedCategory()));

  // ========== COMPUTED - Wishlist ==========
  readonly isWishlistLoading = computed(() => this.wishlistService.isLoading());

  // ========== COMPUTED - Opciones ==========
  readonly productTypeOptions = computed((): ProductTypeOption[] => [
    { label: 'Todos', value: ProductType.TODOS },
    { label: 'Shampoo', value: ProductType.SHAMPOO },
    { label: 'Acondicionador', value: ProductType.ACONDICIONADOR },
    { label: 'Mascarilla', value: ProductType.MASCARILLA },
    { label: 'Serum', value: ProductType.SERUM },
    { label: 'Oleo', value: ProductType.ACEITE },
    { label: 'Mousse', value: ProductType.MOUSSE },
    { label: 'Gel', value: ProductType.GEL },
    { label: 'Crema para peinar', value: ProductType.CREMA },
    { label: 'Termoprotector', value: ProductType.PROTECTOR_TERMICO },
  ]);

  readonly sortOptions = computed((): SortOption[] => [
    { label: 'Nombre (A-Z)', value: 'name-ASC', sortBy: 'name', sortOrder: 'ASC' },
    { label: 'Nombre (Z-A)', value: 'name-DESC', sortBy: 'name', sortOrder: 'DESC' },
    { label: 'Precio (Menor a Mayor)', value: 'price-ASC', sortBy: 'price', sortOrder: 'ASC' },
    { label: 'Precio (Mayor a Menor)', value: 'price-DESC', sortBy: 'price', sortOrder: 'DESC' },
    { label: 'Mejor Valorados', value: 'rating-DESC', sortBy: 'rating', sortOrder: 'DESC' },
    { label: 'Más Populares', value: 'popularity-DESC', sortBy: 'popularity', sortOrder: 'DESC' },
    { label: 'Más Recientes', value: 'createdAt-DESC', sortBy: 'createdAt', sortOrder: 'DESC' }
  ]);

  // ========== COMPUTED - UI ==========
  readonly currentTitle = computed(() => {
    const searchQuery = this.searchQuery();
    if (searchQuery) return `Resultados para "${searchQuery}"`;

    const subCategory = this.selectedSubCategoryData();
    const category = this.selectedCategoryData();
    const productType = this.selectedProductTypeData();

    if (subCategory) return subCategory.name;
    if (category) return category.name;
    if (productType && productType.value !== ProductType.TODOS) return productType.label;

    return 'Todos los productos';
  });

  readonly searchInfo = computed(() => {
    const query = this.searchQuery();
    const hasResults = this.dataApi()?.data?.length || 0;
    const total = this.dataApi()?.meta?.total || 0;

    if (!query) return null;

    return {
      query,
      hasResults: hasResults > 0,
      resultsCount: hasResults,
      totalCount: total,
      message: hasResults > 0
        ? `${total} productos encontrados para "${query}"`
        : `No se encontraron productos para "${query}"`
    };
  });

  readonly hasActiveSearch = computed(() => Boolean(this.searchQuery().trim()));
  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.searchQuery() ||
      this.selectedCategory() ||
      this.selectedSubCategory() ||
      this.selectedProductType() !== ProductType.TODOS
    )
  );

  readonly selectedCategoryData = computed(() => {
    const selectedId = this.selectedCategory();
    return selectedId ? this.categoryService.getCategoryFromCache(selectedId) : null;
  });

  readonly selectedSubCategoryData = computed(() => {
    const selectedId = this.selectedSubCategory();
    return selectedId ? this.subCategoryService.getSubCategoryFromCache(selectedId) : null;
  });

  readonly selectedSortOption = computed(() => {
    const currentValue = this.selectedSort();
    return this.sortOptions().find(option => option.value === currentValue);
  });

  readonly selectedProductTypeData = computed(() => {
    const selectedType = this.selectedProductType();
    return this.productTypeOptions().find(option => option.value === selectedType);
  });

  // ========== EFFECTS ==========
  private readonly categoryChangeEffect = effect(() => {
    const categoryId = this.selectedCategory();
    if (categoryId) {
      this.loadSubCategoriesByCategory(categoryId);
    } else {
      this.selectedSubCategory.set('');
    }
  });

  // ========== LIFECYCLE ==========
  ngOnInit(): void {
    this.loadCategories();
  }

  // ========== MÉTODOS PÚBLICOS - WISHLIST ==========
  
  /**
   * ✅ Verifica si un producto está en wishlist
   */
  isProductInWishlist(productId: string): boolean {
    return this.wishlistService.isProductInWishlist(productId);
  }

  /**
   * ✅ Maneja el toggle de wishlist con toda la lógica
   */
  handleToggleWishlist(productId: string): void {
    // 1️⃣ Verificar autenticación
    if (!this.authService.isAuthenticated() || !this.authService.hasValidToken()) {
      console.warn('❌ Usuario NO autenticado');
      // TODO: Mostrar modal de login o redirigir
      this.router.navigate(['/login']);
      return;
    }

    // 2️⃣ Verificar estado actual
    const isInWishlist = this.wishlistService.isProductInWishlist(productId);

    // 3️⃣ Ejecutar acción
    if (isInWishlist) {
      this.removeFromWishlist(productId);
    } else {
      this.addToWishlist(productId);
    }
  }

  // ========== MÉTODOS PRIVADOS - WISHLIST ==========

  private addToWishlist(productId: string): void {
    const products = this.dataApi()?.data || [];
    const product = products.find(p => p.id === productId);

    this.wishlistService.addToWishlist({
      productId,
      note: product ? `Me gusta ${product.name}` : '',
      visibility: 'private'
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        console.log('✅ Producto agregado:', response.message);
      },
      error: (error) => {
        console.error('❌ Error al agregar:', error);
      }
    });
  }

  private removeFromWishlist(productId: string): void {
    this.wishlistService.removeFromWishlist(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('✅ Producto removido:', response.message);
        },
        error: (error) => {
          console.error('❌ Error al remover:', error);
        }
      });
  }

  // ========== MÉTODOS PÚBLICOS - FILTROS ==========

  onPageChange(event: PaginationEvent): void {
    this.paginated.emit(event);
  }

  onCategoryChange(categoryId: string): void {
    if (categoryId === this.selectedCategory()) return;
    this.selectedCategory.set(categoryId);
    this.selectedSubCategory.set('');
    this.categoryFilterChanged.emit(categoryId);
    this.subCategoryFilterChanged.emit('');
  }

  onSubCategoryChange(subCategoryId: string): void {
    if (subCategoryId === this.selectedSubCategory()) return;
    this.selectedSubCategory.set(subCategoryId);
    this.subCategoryFilterChanged.emit(subCategoryId);
  }

  onSortChange(sortValue: string): void {
    if (sortValue === this.selectedSort()) return;
    this.selectedSort.set(sortValue);
    const selectedOption = this.sortOptions().find(option => option.value === sortValue);
    if (selectedOption) {
      this.sortChanged.emit({
        sortBy: selectedOption.sortBy,
        sortOrder: selectedOption.sortOrder
      });
    }
  }

  onProductTypeChange(productType: string): void {
    const typeValue = productType as ProductType;
    if (typeValue === this.selectedProductType()) return;
    this.selectedProductType.set(typeValue);
    this.productTypeFilterChanged.emit(productType);
  }

  clearCategorySelection(): void {
    this.onCategoryChange('');
  }

  clearSubCategorySelection(): void {
    this.onSubCategoryChange('');
  }

  clearProductTypeSelection(): void {
    this.onProductTypeChange(ProductType.TODOS);
  }

  resetSort(): void {
    this.onSortChange('name-ASC');
  }

  clearSearch(): void {
    this.searchChanged.emit('');
    this.removeSearchParam();
  }

  clearAllFilters(): void {
    this.selectedCategory.set('');
    this.selectedSubCategory.set('');
    this.selectedSort.set('name-ASC');
    this.selectedProductType.set(ProductType.TODOS);
    this.categoryFilterChanged.emit('');
    this.subCategoryFilterChanged.emit('');
    this.sortChanged.emit({ sortBy: 'name', sortOrder: 'ASC' });
    this.productTypeFilterChanged.emit('');
    this.searchChanged.emit('');
    this.clearAllQueryParams();
  }

  refreshCategories(): void {
    this.loadCategories();
  }

  refreshSubCategories(): void {
    const categoryId = this.selectedCategory();
    if (categoryId) {
      this.loadSubCategoriesByCategory(categoryId);
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

  private removeSearchParam(): void {
    const currentUrl = this.router.url;
    const urlTree = this.router.parseUrl(currentUrl);
    delete urlTree.queryParams['search'];
    this.router.navigateByUrl(urlTree, { replaceUrl: true });
  }

  private clearAllQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          console.log('Categories loaded:', categories.length);
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  private loadSubCategoriesByCategory(categoryId: string): void {
    const cachedSubCategories = this.subCategoryService
      .getSubCategoriesByCategoryFromCache(categoryId);

    if (cachedSubCategories.length === 0) {
      this.subCategoryService.getSubCategoriesByCategory(categoryId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (subCategories) => {
            console.log(`Subcategories loaded for category ${categoryId}:`, subCategories.length);
          },
          error: (error) => {
            console.error('Error loading subcategories:', error);
          }
        });
    }
  }
}

