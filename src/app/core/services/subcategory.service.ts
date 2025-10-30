import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  SubCategory,
  Datum,
  SubCategoryFilters,
  CreateSubCategoryRequest,
  UpdateSubCategoryRequest,
  ReorderSubCategoryRequest,
  SubCategoryStatistics,
  SubCategoryError
} from '../models/interfaces/subcategory.interface';

interface SelectOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly color?: string;
  readonly icon?: string;
  readonly categoryName?: string;
}

interface AllSubCategoryOption {
  readonly id: string;
  readonly name: string;
  readonly categoryId: string;
  readonly categoryName: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}subcategories`;

  // Signals privados para el estado
  private readonly subCategoriesSignal = signal<Datum[]>([]);
  private readonly allSubCategoriesSignal = signal<AllSubCategoryOption[]>([]);
  private readonly subCategoriesByCategorySignal = signal<Datum[]>([]);
  private readonly currentSubCategorySignal = signal<Datum | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly filtersSignal = signal<SubCategoryFilters>({});
  private readonly metaSignal = signal<Omit<SubCategory, 'data'> | null>(null);

  // Computed values públicos de solo lectura
  readonly subCategories = this.subCategoriesSignal.asReadonly();
  readonly allSubCategories = this.allSubCategoriesSignal.asReadonly();
  readonly subCategoriesByCategory = this.subCategoriesByCategorySignal.asReadonly();
  readonly currentSubCategory = this.currentSubCategorySignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly meta = this.metaSignal.asReadonly();

  // Computed values derivados
  readonly hasSubCategories = computed(() => this.subCategoriesSignal().length > 0);
  readonly totalSubCategories = computed(() => this.metaSignal()?.total ?? 0);
  readonly activeSubCategories = computed(() =>
    this.allSubCategoriesSignal().filter(sub => sub.id) // Filtrar activos si tuviéramos esa propiedad
  );

  // Computed para opciones de select con paginación
  readonly subCategorySelectOptions = computed((): SelectOption[] => {
    const subCategories = this.subCategoriesSignal();
    return [
      { label: 'Todas las subcategorías', value: '' },
      ...subCategories
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(sub => ({
          label: sub.name,
          value: sub.id,
          color: sub.color,
          icon: sub.icon,
          categoryName: sub.category?.name || 'Sin categoría'
        } satisfies SelectOption))
    ];
  });

  // Computed parametrizado para subcategorías por categoría
  readonly subCategorySelectOptionsByCategory = computed(() => {
    return (categoryId: string): SelectOption[] => {
      if (!categoryId) {
        return [{ label: 'Selecciona una categoría primero', value: '', disabled: true }];
      }

      const byCategorySubCategories = this.subCategoriesByCategory()
        .filter(sub => sub.categoryId === categoryId);

      if (byCategorySubCategories.length === 0) {
        return [{ label: 'Todas las subcategorías', value: '' }];
      }

      const activeSubCategories = byCategorySubCategories
        .filter(sub => sub.isActive !== false)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      return [
        { label: 'Todas las subcategorías', value: '' },
        ...activeSubCategories.map(sub => ({
          label: sub.name,
          value: sub.id,
          color: sub.color,
          icon: sub.icon
        } satisfies SelectOption))
      ];
    };
  });

  // Computed para todas las subcategorías como opciones de select
  readonly allSubCategorySelectOptions = computed((): SelectOption[] => {
    const allSubs = this.allSubCategoriesSignal();
    return [
      { label: 'Todas las subcategorías', value: '' },
      ...allSubs.map(sub => ({
        label: sub.name,
        value: sub.id,
        categoryName: sub.categoryName
      } satisfies SelectOption))
    ];
  });

  // 1. Listar Subcategorías con Paginación y Filtros
  getSubCategories(filters: SubCategoryFilters = {}): Observable<SubCategory> {
    this.setLoading(true);
    this.clearError();
    this.filtersSignal.set(filters);

    const params = this.buildHttpParams(filters);

    return this.http.get<SubCategory>(this.apiUrl, { params })
      .pipe(
        tap(response => {
          this.subCategoriesSignal.set(response.data);
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

  // 2. Subcategorías por Categoría (Sin Paginación)
  getSubCategoriesByCategory(categoryId: string): Observable<Datum[]> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Datum[]>(`${this.apiUrl}/by-category/${categoryId}`)
      .pipe(
        tap(subCategories => {
          const normalizedSubCategories = subCategories.map(sub => ({
            ...sub,
            isActive: sub.isActive ?? true,
            categoryId: categoryId
          }));

          this.subCategoriesByCategorySignal.set(normalizedSubCategories);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // 3. Todas las Subcategorías para Select/Dropdown
  getAllSubCategories(): Observable<AllSubCategoryOption[]> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<AllSubCategoryOption[]>(`${this.apiUrl}/all`)
      .pipe(
        tap(subCategories => {
          this.allSubCategoriesSignal.set(subCategories);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // 4. Obtener Subcategoría por ID
  getSubCategoryById(id: string): Observable<Datum> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Datum>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(subCategory => {
          this.currentSubCategorySignal.set(subCategory);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // 5. Obtener Subcategoría por Slug
  getSubCategoryBySlug(slug: string): Observable<Datum> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Datum>(`${this.apiUrl}/slug/${slug}`)
      .pipe(
        tap(subCategory => {
          this.currentSubCategorySignal.set(subCategory);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // 6. Crear Subcategoría (Requiere autenticación)
  createSubCategory(subCategoryData: CreateSubCategoryRequest): Observable<Datum> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<Datum>(this.apiUrl, subCategoryData)
      .pipe(
        tap(newSubCategory => {
          this.subCategoriesSignal.update(subCategories => [...subCategories, newSubCategory]);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // 7. Actualizar Subcategoría (Requiere autenticación)
  updateSubCategory(id: string, updateData: UpdateSubCategoryRequest): Observable<Datum> {
    this.setLoading(true);
    this.clearError();

    return this.http.patch<Datum>(`${this.apiUrl}/${id}`, updateData)
      .pipe(
        tap(updatedSubCategory => {
          this.updateSubCategoryInSignals(id, updatedSubCategory);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // 8. Reordenar Subcategorías (Requiere autenticación)
  reorderSubCategories(categoryId: string, reorderData: ReorderSubCategoryRequest[]): Observable<{ message: string }> {
    this.setLoading(true);
    this.clearError();

    return this.http.patch<{ message: string }>(`${this.apiUrl}/category/${categoryId}/reorder`, reorderData)
      .pipe(
        tap(() => {
          this.applySubCategoryReorder(reorderData);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // 9. Obtener Estadísticas (Requiere autenticación)
  getSubCategoryStatistics(): Observable<SubCategoryStatistics> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<SubCategoryStatistics>(`${this.apiUrl}/statistics`)
      .pipe(
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // 10. Eliminar Subcategoría (Requiere autenticación)
  deleteSubCategory(id: string): Observable<{ message: string }> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.removeSubCategoryFromSignals(id);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // Métodos de utilidad
  clearError(): void {
    this.errorSignal.set(null);
  }

  clearCurrentSubCategory(): void {
    this.currentSubCategorySignal.set(null);
  }

  refreshSubCategories(): void {
    this.getAllSubCategories().subscribe();
  }

  getSubCategoryFromCache(id: string): Datum | undefined {
    const fromSubCategories = this.subCategoriesSignal().find(sub => sub.id === id);
    const fromByCategory = this.subCategoriesByCategory().find(sub => sub.id === id);
    return fromSubCategories || fromByCategory;
  }

  getSubCategoriesByCategoryFromCache(categoryId: string): Datum[] {
    return this.subCategoriesByCategory().filter(sub => sub.categoryId === categoryId);
  }

  // Métodos privados
  private setLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }

  private buildHttpParams(filters: SubCategoryFilters): HttpParams {
    let params = new HttpParams();

    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit !== undefined) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.includeProducts !== undefined) {
      params = params.set('includeProducts', filters.includeProducts.toString());
    }

    return params;
  }

  private updateSubCategoryInSignals(id: string, updatedSubCategory: Datum): void {
    this.subCategoriesSignal.update(subCategories =>
      subCategories.map(sub => sub.id === id ? updatedSubCategory : sub)
    );

    this.subCategoriesByCategorySignal.update(subCategories =>
      subCategories.map(sub => sub.id === id ? updatedSubCategory : sub)
    );

    if (this.currentSubCategorySignal()?.id === id) {
      this.currentSubCategorySignal.set(updatedSubCategory);
    }
  }

  private removeSubCategoryFromSignals(id: string): void {
    this.subCategoriesSignal.update(subCategories =>
      subCategories.filter(sub => sub.id !== id)
    );

    this.subCategoriesByCategorySignal.update(subCategories =>
      subCategories.filter(sub => sub.id !== id)
    );

    if (this.currentSubCategorySignal()?.id === id) {
      this.currentSubCategorySignal.set(null);
    }

    if (this.metaSignal()) {
      this.metaSignal.update(meta => meta ? { ...meta, total: meta.total - 1 } : null);
    }
  }

  private applySubCategoryReorder(reorderData: ReorderSubCategoryRequest[]): void {
    const reorderMap = new Map(reorderData.map(item => [item.id, item.displayOrder]));

    this.subCategoriesSignal.update(subCategories =>
      subCategories.map(sub => ({
        ...sub,
        displayOrder: reorderMap.get(sub.id) ?? sub.displayOrder
      })).sort((a, b) => a.displayOrder - b.displayOrder)
    );

    this.subCategoriesByCategorySignal.update(subCategories =>
      subCategories.map(sub => ({
        ...sub,
        displayOrder: reorderMap.get(sub.id) ?? sub.displayOrder
      })).sort((a, b) => a.displayOrder - b.displayOrder)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      const subCategoryError = error.error as SubCategoryError;
      errorMessage = subCategoryError?.message || `Error ${error.status}: ${error.statusText}`;
    }

    this.errorSignal.set(errorMessage);
    console.error('Error en SubCategoryService:', error);

    return throwError(() => new Error(errorMessage));
  }
}
