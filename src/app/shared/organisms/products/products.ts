import { Component, ChangeDetectionStrategy, inject, input, output, OnInit, signal, computed, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCard } from '../../molecules/product-card/product-card';
import { ProductsApiResponse } from '../../../core/services/products.service';
import { PaginationEvent, Paginator } from "../../molecules/paginator/paginator";
import { CategoryService } from '../../../core/services/category.service';
import { SubCategoryService } from '../../../core/services/subcategory.service';


// Enum para los tipos de productos
export enum ProductType {
  TODOS = '',
  SHAMPOO = 'Shampoo',
  ACONDICIONADOR = 'Acondicionador',
  MASCARILLA = 'Mascarilla',
  SERUM = 'Serum',
  ACEITE = 'Aceite',
  SPRAY = 'Spray',
  CREMA = 'Crema',
  GEL = 'Gel',
  MOUSSE = 'Mousse',
  CERA = 'Cera',
  POMADA = 'Pomada',
  TRATAMIENTO = 'Tratamiento',
  TINTE = 'Tinte',
  DECOLORANTE = 'Decolorante',
  PROTECTOR_TERMICO = 'Protector Térmico',
  LEAVE_IN = 'Leave-in',
  AMPOLLA = 'Ampolla',
  TONICO = 'Tónico',
  EXFOLIANTE = 'Exfoliante',
}


interface SelectOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly color?: string;
  readonly icon?: string;
}

// Agregar interface para las opciones de ordenamiento
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

  // Inputs
  readonly dataApi = input<ProductsApiResponse | null>();
  readonly inputPaginated = input<PaginationEvent | null>(null);

  // Outputs
  readonly paginated = output<PaginationEvent>();
  readonly categoryFilterChanged = output<string>();
  readonly subCategoryFilterChanged = output<string>();
  readonly sortChanged = output<{ sortBy: string; sortOrder: string }>();
  readonly productTypeFilterChanged = output<string>();

  // Signals para el estado local
  readonly selectedCategory = signal<string>('');
  readonly selectedSubCategory = signal<string>('');
  readonly selectedSort = signal<string>('name-ASC');
  readonly selectedProductType = signal<ProductType>(ProductType.TODOS);

  // Computed values para categorías
  readonly categoryOptions = computed(() => this.categoryService.categorySelectOptions());
  readonly isLoadingCategories = computed(() => this.categoryService.isLoading());
  readonly categoryError = computed(() => this.categoryService.error());
  readonly activeCategories = computed(() => this.categoryService.activeCategories());
  readonly hasCategoriesAvailable = computed(() => this.activeCategories().length > 0);

  // Computed values para subcategorías
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

  // Computed para opciones de tipo de producto
  readonly productTypeOptions = computed((): ProductTypeOption[] => [
    { label: 'Todos los productos', value: ProductType.TODOS },
    { label: 'Shampoo', value: ProductType.SHAMPOO, icon: 'shampoo-bottle' },
    { label: 'Acondicionador', value: ProductType.ACONDICIONADOR, icon: 'bottle-droplet' },
    { label: 'Mascarilla', value: ProductType.MASCARILLA, icon: 'mask' },
    { label: 'Serum', value: ProductType.SERUM, icon: 'droplet' },
    { label: 'Aceite', value: ProductType.ACEITE, icon: 'oil-bottle' },
    { label: 'Spray', value: ProductType.SPRAY, icon: 'spray-can' },
    { label: 'Crema', value: ProductType.CREMA, icon: 'jar' },
    { label: 'Gel', value: ProductType.GEL, icon: 'gel-tube' },
    { label: 'Mousse', value: ProductType.MOUSSE, icon: 'mousse-bottle' },
    { label: 'Cera', value: ProductType.CERA, icon: 'wax-pot' },
    { label: 'Pomada', value: ProductType.POMADA, icon: 'pomade-jar' },
    { label: 'Tratamiento', value: ProductType.TRATAMIENTO, icon: 'treatment-tube' },
    { label: 'Tinte', value: ProductType.TINTE, icon: 'hair-dye' },
    { label: 'Decolorante', value: ProductType.DECOLORANTE, icon: 'bleach-bottle' },
    { label: 'Protector Térmico', value: ProductType.PROTECTOR_TERMICO, icon: 'heat-protector' },
    { label: 'Leave-in', value: ProductType.LEAVE_IN, icon: 'leave-in-bottle' },
    { label: 'Ampolla', value: ProductType.AMPOLLA, icon: 'ampolla' },
    { label: 'Tónico', value: ProductType.TONICO, icon: 'tonic-bottle' },
    { label: 'Exfoliante', value: ProductType.EXFOLIANTE, icon: 'scrub-jar' },
  ]);

  // Computed para las opciones de ordenamiento
  readonly sortOptions = computed((): SortOption[] => [
    {
      label: 'Nombre (A-Z)',
      value: 'name-ASC',
      sortBy: 'name',
      sortOrder: 'ASC'
    },
    {
      label: 'Nombre (Z-A)',
      value: 'name-DESC',
      sortBy: 'name',
      sortOrder: 'DESC'
    },
    {
      label: 'Precio (Menor a Mayor)',
      value: 'price-ASC',
      sortBy: 'price',
      sortOrder: 'ASC'
    },
    {
      label: 'Precio (Mayor a Menor)',
      value: 'price-DESC',
      sortBy: 'price',
      sortOrder: 'DESC'
    },
    {
      label: 'Mejor Valorados',
      value: 'rating-DESC',
      sortBy: 'rating',
      sortOrder: 'DESC'
    },
    {
      label: 'Más Populares',
      value: 'popularity-DESC',
      sortBy: 'popularity',
      sortOrder: 'DESC'
    },
    {
      label: 'Más Recientes',
      value: 'createdAt-DESC',
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    }
  ]);

  // Computed para obtener los datos seleccionados
  readonly selectedCategoryData = computed(() => {
    const selectedId = this.selectedCategory();
    return selectedId ? this.categoryService.getCategoryFromCache(selectedId) : null;
  });

  readonly selectedSubCategoryData = computed(() => {
    const selectedId = this.selectedSubCategory();
    return selectedId ? this.subCategoryService.getSubCategoryFromCache(selectedId) : null;
  });

  // Computed para obtener la opción actual seleccionada
  readonly selectedSortOption = computed(() => {
    const currentValue = this.selectedSort();
    return this.sortOptions().find(option => option.value === currentValue);
  });

  readonly selectedProductTypeData = computed(() => {
    const selectedType = this.selectedProductType();
    return this.productTypeOptions().find(option => option.value === selectedType);
  });

  // Computed para el título dinámico
  readonly currentTitle = computed(() => {
    const subCategory = this.selectedSubCategoryData();
    const category = this.selectedCategoryData();
    const productType = this.selectedProductTypeData();

    if (subCategory) return subCategory.name;
    if (category) return category.name;
    if (productType && productType.value !== ProductType.TODOS) return productType.label;

    return 'Todos los productos';
  });

  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.selectedCategory() ||
      this.selectedSubCategory() ||
      this.selectedProductType() !== ProductType.TODOS
    )
  );

  // Effect para cargar subcategorías automáticamente cuando cambie la categoría
  private readonly categoryChangeEffect = effect(() => {
    const categoryId = this.selectedCategory();

    if (categoryId) {
      this.loadSubCategoriesByCategory(categoryId);
    } else {
      // Limpiar subcategoría cuando no hay categoría seleccionada
      this.selectedSubCategory.set('');
    }
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  // Métodos de manejo de eventos
  onPageChange(event: PaginationEvent): void {
    this.paginated.emit(event);
  }

  onCategoryChange(categoryId: string): void {
    if (categoryId === this.selectedCategory()) return; // Evitar re-renders innecesarios

    // Actualizar estado local
    this.selectedCategory.set(categoryId);
    this.selectedSubCategory.set(''); // Limpiar subcategoría al cambiar categoría

    // Emitir cambios al componente padre
    this.categoryFilterChanged.emit(categoryId);
    this.subCategoryFilterChanged.emit(''); // Notificar que se limpió la subcategoría
  }

  onSubCategoryChange(subCategoryId: string): void {
    if (subCategoryId === this.selectedSubCategory()) return; // Evitar re-renders innecesarios

    this.selectedSubCategory.set(subCategoryId);
    this.subCategoryFilterChanged.emit(subCategoryId);
  }

  onSortChange(sortValue: string): void {
    if (sortValue === this.selectedSort()) return; // Evitar re-renders innecesarios

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

  // Métodos de utilidad
  clearCategorySelection(): void {
    this.onCategoryChange('');
  }

  clearSubCategorySelection(): void {
    this.onSubCategoryChange('');
  }

  clearProductTypeSelection(): void {
    this.onProductTypeChange(ProductType.TODOS);
  }

  // Método de utilidad para resetear ordenamiento
  resetSort(): void {
    this.onSortChange('name-ASC');
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

  // Métodos privados
  private loadCategories(): void {
    this.categoryService.getAllCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          console.log('Categories loaded successfully:', categories.length, 'categories');
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  private loadSubCategoriesByCategory(categoryId: string): void {
    // Solo cargar si no están en cache
    const cachedSubCategories = this.subCategoryService
      .getSubCategoriesByCategoryFromCache(categoryId);

    if (cachedSubCategories.length === 0) {
      this.subCategoryService.getSubCategoriesByCategory(categoryId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (subCategories) => {
            console.log(`Subcategories loaded for category ${categoryId}:`, subCategories.length, 'subcategories');
          },
          error: (error) => {
            console.error('Error loading subcategories:', error);
          }
        });
    }
  }
}

