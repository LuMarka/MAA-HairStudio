import { Component, ChangeDetectionStrategy, inject, input, output, OnInit, signal, computed, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCard } from '../../molecules/product-card/product-card';
import { ProductsApiResponse } from '../../../core/services/products.service';
import { PaginationEvent, Paginator } from "../../molecules/paginator/paginator";
import { CategoryService } from '../../../core/services/category.service';
import { SubCategoryService } from '../../../core/services/subcategory.service';

interface SelectOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly color?: string;
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

  // Outputs - nombres consistentes
  readonly paginated = output<PaginationEvent>();
  readonly categoryFilterChanged = output<string>();
  readonly subCategoryFilterChanged = output<string>();

  // Signals para el estado local
  readonly selectedCategory = signal<string>('');
  readonly selectedSubCategory = signal<string>('');

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

  // Computed para obtener los datos seleccionados
  readonly selectedCategoryData = computed(() => {
    const selectedId = this.selectedCategory();
    return selectedId ? this.categoryService.getCategoryFromCache(selectedId) : null;
  });

  readonly selectedSubCategoryData = computed(() => {
    const selectedId = this.selectedSubCategory();
    return selectedId ? this.subCategoryService.getSubCategoryFromCache(selectedId) : null;
  });

  // Computed para el título dinámico
  readonly currentTitle = computed(() => {
    const subCategory = this.selectedSubCategoryData();
    const category = this.selectedCategoryData();

    return subCategory?.name ?? category?.name ?? 'Todos los productos';
  });

  readonly hasActiveFilters = computed(() =>
    Boolean(this.selectedCategory() || this.selectedSubCategory())
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

  // Métodos de utilidad
  clearCategorySelection(): void {
    this.onCategoryChange('');
  }

  clearSubCategorySelection(): void {
    this.onSubCategoryChange('');
  }

  clearAllFilters(): void {
    this.selectedCategory.set('');
    this.selectedSubCategory.set('');
    this.categoryFilterChanged.emit('');
    this.subCategoryFilterChanged.emit('');
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

