import { Component, ChangeDetectionStrategy, inject, input, output, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCard } from '../../molecules/product-card/product-card';
import { ProductsApiResponse } from '../../../core/services/products.service';
import { PaginationEvent, Paginator } from "../../molecules/paginator/paginator";
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, ProductCard, Paginator],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  readonly dataApi = input<ProductsApiResponse | null>();
  readonly inputPaginated = input<PaginationEvent | null>(null);

  // Outputs - nombres consistentes
  readonly paginated = output<PaginationEvent>();
  readonly categoryFilterChanged = output<string>();

  // Signals para el estado local
  readonly selectedCategory = signal<string>('');

  // Computed values - optimizados
  readonly categoryOptions = computed(() => this.categoryService.categorySelectOptions());
  readonly isLoadingCategories = computed(() => this.categoryService.isLoading());
  readonly categoryError = computed(() => this.categoryService.error());
  readonly activeCategories = computed(() => this.categoryService.activeCategories());

  // Computed para obtener la categoría seleccionada
  readonly selectedCategoryData = computed(() => {
    const selectedId = this.selectedCategory();
    return selectedId ? this.categoryService.getCategoryFromCache(selectedId) : null;
  });

  // Computed para verificar si hay categorías disponibles
  readonly hasCategoriesAvailable = computed(() => this.activeCategories().length > 0);

  ngOnInit(): void {
    this.loadCategories();
  }

  // Métodos de manejo de eventos - nombres consistentes
  onPageChange(event: PaginationEvent): void {
    this.paginated.emit(event);
  }

  onCategoryChange(categoryId: string): void {
    // Actualizar estado local
    this.selectedCategory.set(categoryId);
    // Emitir cambio al componente padre
    this.categoryFilterChanged.emit(categoryId);
  }

  // Método para limpiar la selección de categoría
  clearCategorySelection(): void {
    this.onCategoryChange('');
  }

  // Método para refrescar categorías
  refreshCategories(): void {
    this.loadCategories();
  }

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
}

