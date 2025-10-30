import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Category,
  DatumCategory,
  CategoryFilters,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ReorderCategoryRequest,
  CategoryStatistics,
  CategoryError
} from '../models/interfaces/category.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}categories`;

  // Signals para el estado
  private readonly categoriesSignal = signal<DatumCategory[]>([]);
  private readonly allCategoriesSignal = signal<DatumCategory[]>([]);
  private readonly currentCategorySignal = signal<DatumCategory | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly filtersSignal = signal<CategoryFilters>({});
  private readonly metaSignal = signal<Omit<Category, 'data'> | null>(null);

  // Computed values públicos
  readonly categories = this.categoriesSignal.asReadonly();
  readonly allCategories = this.allCategoriesSignal.asReadonly();
  readonly currentCategory = this.currentCategorySignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly meta = this.metaSignal.asReadonly();

  readonly hasCategories = computed(() => this.categoriesSignal().length > 0);
  readonly totalCategories = computed(() => this.metaSignal()?.total ?? 0);
  readonly activeCategories = computed(() => 
    this.allCategoriesSignal().filter(cat => cat.isActive !== false)
  );

  // Computed específico para opciones de select
  readonly categorySelectOptions = computed(() => {
    const categories = this.activeCategories();
    return [
      { label: 'Todas las categorías', value: '' },
      ...categories
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(cat => ({ 
          label: cat.name, 
          value: cat.id,
          color: cat.color,
          icon: cat.icon
        }))
    ];
  });

  // Métodos públicos para obtener categorías
  getCategories(filters: CategoryFilters = {}): Observable<Category> {
    this.setLoading(true);
    this.clearError();
    this.filtersSignal.set(filters);

    const params = this.buildHttpParams(filters);

    return this.http.get<Category>(this.apiUrl, { params })
      .pipe(
        tap(response => {
          this.categoriesSignal.set(response.data);
          this.metaSignal.set({
            total: response.total,
            page: response.page,
            limit: response.limit,
            totalPages: response.totalPages
          });
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  getAllCategories(): Observable<DatumCategory[]> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<DatumCategory[]>(`${this.apiUrl}/all`)
      .pipe(
        tap(categories => {
          // Normalizar datos - agregar propiedades por defecto si no existen
          const normalizedCategories = categories.map(cat => ({
            ...cat,
            isActive: cat.isActive ?? true,
            slug: cat.slug ?? cat.name.toLowerCase().replace(/\s+/g, '-')
          }));
          
          this.allCategoriesSignal.set(normalizedCategories);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  getCategoryBySlug(slug: string): Observable<DatumCategory> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<DatumCategory>(`${this.apiUrl}/slug/${slug}`)
      .pipe(
        tap(category => {
          this.currentCategorySignal.set(category);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  getCategoryById(id: string): Observable<DatumCategory> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<DatumCategory>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(category => {
          this.currentCategorySignal.set(category);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // Métodos administrativos
  createCategory(categoryData: CreateCategoryRequest): Observable<DatumCategory> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<DatumCategory>(this.apiUrl, categoryData)
      .pipe(
        tap(newCategory => {
          this.categoriesSignal.update(categories => [...categories, newCategory]);
          this.allCategoriesSignal.update(categories => [...categories, newCategory]);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  updateCategory(id: string, updateData: UpdateCategoryRequest): Observable<DatumCategory> {
    this.setLoading(true);
    this.clearError();

    return this.http.patch<DatumCategory>(`${this.apiUrl}/${id}`, updateData)
      .pipe(
        tap(updatedCategory => {
          this.updateCategoryInSignals(id, updatedCategory);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  reorderCategories(reorderData: ReorderCategoryRequest): Observable<{ message: string }> {
    this.setLoading(true);
    this.clearError();

    return this.http.patch<{ message: string }>(`${this.apiUrl}/reorder`, reorderData)
      .pipe(
        tap(() => {
          this.applyCategoryReorder(reorderData.categories);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  getCategoryStatistics(): Observable<CategoryStatistics> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<CategoryStatistics>(`${this.apiUrl}/statistics`)
      .pipe(
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  deleteCategory(id: string): Observable<{ message: string }> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.removeCategoryFromSignals(id);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // Métodos de utilidad
  clearError(): void {
    this.errorSignal.set(null);
  }

  clearCurrentCategory(): void {
    this.currentCategorySignal.set(null);
  }

  refreshCategories(): void {
    this.getAllCategories().subscribe();
  }

  getCategoryFromCache(id: string): DatumCategory | undefined {
    return this.allCategoriesSignal().find(cat => cat.id === id);
  }

  // Métodos privados
  private setLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }

  private buildHttpParams(filters: CategoryFilters): HttpParams {
    let params = new HttpParams();

    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit !== undefined) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.includeSubcategories !== undefined) {
      params = params.set('includeSubcategories', filters.includeSubcategories.toString());
    }

    return params;
  }

  private updateCategoryInSignals(id: string, updatedCategory: DatumCategory): void {
    this.categoriesSignal.update(categories =>
      categories.map(cat => cat.id === id ? updatedCategory : cat)
    );
    
    this.allCategoriesSignal.update(categories =>
      categories.map(cat => cat.id === id ? updatedCategory : cat)
    );

    if (this.currentCategorySignal()?.id === id) {
      this.currentCategorySignal.set(updatedCategory);
    }
  }

  private removeCategoryFromSignals(id: string): void {
    this.categoriesSignal.update(categories =>
      categories.filter(cat => cat.id !== id)
    );
    
    this.allCategoriesSignal.update(categories =>
      categories.filter(cat => cat.id !== id)
    );

    if (this.currentCategorySignal()?.id === id) {
      this.currentCategorySignal.set(null);
    }

    if (this.metaSignal()) {
      this.metaSignal.update(meta => meta ? { ...meta, total: meta.total - 1 } : null);
    }
  }

  private applyCategoryReorder(reorderData: Array<{ id: string; displayOrder: number }>): void {
    const reorderMap = new Map(reorderData.map(item => [item.id, item.displayOrder]));

    this.categoriesSignal.update(categories =>
      categories.map(cat => ({
        ...cat,
        displayOrder: reorderMap.get(cat.id) ?? cat.displayOrder
      })).sort((a, b) => a.displayOrder - b.displayOrder)
    );

    this.allCategoriesSignal.update(categories =>
      categories.map(cat => ({
        ...cat,
        displayOrder: reorderMap.get(cat.id) ?? cat.displayOrder
      })).sort((a, b) => a.displayOrder - b.displayOrder)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      const categoryError = error.error as CategoryError;
      errorMessage = categoryError?.message || `Error ${error.status}: ${error.statusText}`;
    }

    this.errorSignal.set(errorMessage);
    console.error('Error en CategoryService:', error);
    
    return throwError(() => new Error(errorMessage));
  }
}
