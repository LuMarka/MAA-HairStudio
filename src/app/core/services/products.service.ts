import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Datum, Data, Meta, Filters, Category } from '../models/interfaces/Product.interface';
import { environment } from '../../../environments/environment.development';

export interface ProductFilters {
  search?: string;                    // Búsqueda en nombre, descripción, marca, colección, tipo
  subcategoryId?: string;             // UUID de subcategoría
  categoryId?: string;                // UUID de categoría
  brand?: string;                     // Filtro por marca
  collection?: string;                // Filtro por colección
  type_hair?: 'Graso' | 'Seco' | 'Mixto' | 'Rizado' | 'Liso' | 'Ondulado' | 'Teñido' | 'Dañado';
  desired_result?: 'Hidratación' | 'Volumen' | 'Anti-caspa' | 'Reparación' | 'Brillo' | 'Control de grasa' | 'Crecimiento' | 'Protección del color' | 'Definición';
  type_product?: 'Shampoo' | 'Acondicionador' | 'Mascarilla' | 'Serum' | 'Aceite' | 'Spray' | 'Crema' | 'Gel' | 'Mousse' | 'Cera' | 'Pomada' | 'Tratamiento' | 'Tinte' | 'Decolorante' | 'Protector Térmico' | 'Leave-in' | 'Ampolla' | 'Tónico' | 'Exfoliante';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isFeatured?: boolean;
  isOnSale?: boolean;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'finalPrice' | 'rating' | 'popularity' | 'createdAt' | 'updatedAt' | 'brand' | 'viewCount';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface ProductsByIdsRequest {
  ids: string[];
}

export interface ProductAvailability {
  available: boolean;
  stock: number;
  message?: string;
}

// Alias para mejor claridad
export type Product = Datum;
export type ProductsApiResponse = Data;

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly apiUrl = environment.apiUrl + 'products/';
  private readonly http = inject(HttpClient);

  // State management
  private readonly _products = signal<Product[]>([]);
  private readonly _featuredProducts = signal<Product[]>([]);
  private readonly _saleProducts = signal<Product[]>([]);
  private readonly _bestSellers = signal<Product[]>([]);
  private readonly _newArrivals = signal<Product[]>([]);
  private readonly _collections = signal<string[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Computed values
  readonly products = computed(() => this._products());
  readonly featuredProducts = computed(() => this._featuredProducts());
  readonly saleProducts = computed(() => this._saleProducts());
  readonly bestSellers = computed(() => this._bestSellers());
  readonly newArrivals = computed(() => this._newArrivals());
  readonly collections = computed(() => this._collections());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  /**
   * 1. Listar Productos con Filtros
   */
  getProducts(filters?: ProductFilters): Observable<ProductsApiResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ProductsApiResponse>(`${this.apiUrl}`, { params });
  }

  /**
   * 2. Obtener Múltiples Productos por IDs
   */
  getProductsByIds(ids: string[]): Observable<ProductsApiResponse> {
    const body: ProductsByIdsRequest = { ids };
    return this.http.post<ProductsApiResponse>(`${this.apiUrl}by-ids`, body);
  }

  /**
   * 3. Productos Destacados
   */
  getFeaturedProducts(limit = 8): Observable<ProductsApiResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductsApiResponse>(`${this.apiUrl}featured`, { params });
  }

  /**
   * 4. Productos en Oferta
   */
  getProductsOnSale(limit = 12): Observable<ProductsApiResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductsApiResponse>(`${this.apiUrl}on-sale`, { params });
  }

  /**
   * 5. Productos Más Vendidos
   */
  getBestSellers(limit = 10): Observable<ProductsApiResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductsApiResponse>(`${this.apiUrl}best-sellers`, { params });
  }

  /**
   * 6. Productos Nuevos
   */
  getNewArrivals(limit = 8): Observable<ProductsApiResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductsApiResponse>(`${this.apiUrl}new-arrivals`, { params });
  }

  /**
   * 7. Buscar Productos
   */
  searchProducts(query: string, options?: {
    brand?: string;
    collection?: string;
    limit?: number;
    page?: number;
  }): Observable<ProductsApiResponse> {
    let params = new HttpParams().set('q', query);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ProductsApiResponse>(`${this.apiUrl}search`, { params });
  }

  /**
   * 8. Productos por Colección
   */
  getProductsByCollection(collection: string, limit = 20, page = 1): Observable<ProductsApiResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());

    const encodedCollection = encodeURIComponent(collection);
    return this.http.get<ProductsApiResponse>(`${this.apiUrl}collection/${encodedCollection}`, { params });
  }

  /**
   * 9. Lista de Colecciones Disponibles
   */
  getCollections(): Observable<{ success: boolean; message: string; data: string[] }> {
    return this.http.get<{ success: boolean; message: string; data: string[] }>(`${this.apiUrl}collections/list`);
  }

  /**
   * 10. Obtener Producto por Slug
   */
  getProductBySlug(slug: string): Observable<{ success: boolean; message: string; data: Product }> {
    return this.http.get<{ success: boolean; message: string; data: Product }>(`${this.apiUrl}slug/${slug}`);
  }

  /**
   * 11. Obtener Producto por ID
   */
  getProductById(id: string): Observable<{ success: boolean; message: string; data: Product }> {
    return this.http.get<{ success: boolean; message: string; data: Product }>(`${this.apiUrl}${id}`);
  }

  /**
   * 12. Productos Relacionados
   */
  getRelatedProducts(productId: string, limit = 4): Observable<ProductsApiResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductsApiResponse>(`${this.apiUrl}${productId}/related`, { params });
  }

  /**
   * 13. Verificar Disponibilidad
   */
  checkProductAvailability(productId: string, quantity = 1): Observable<ProductAvailability> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.get<ProductAvailability>(`${this.apiUrl}${productId}/availability`, { params });
  }

  /**
   * 14. Incrementar Vistas
   */
  incrementProductViews(productId: string): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.apiUrl}${productId}/increment-views`, {});
  }

  // Helper methods para manejar el estado local
  updateProducts(products: Product[]): void {
    this._products.set(products);
    this._loading.set(false);
    this._error.set(null);
  }

  updateFeaturedProducts(products: Product[]): void {
    this._featuredProducts.set(products);
  }

  updateSaleProducts(products: Product[]): void {
    this._saleProducts.set(products);
  }

  updateBestSellers(products: Product[]): void {
    this._bestSellers.set(products);
  }

  updateNewArrivals(products: Product[]): void {
    this._newArrivals.set(products);
  }

  updateCollections(collections: string[]): void {
    this._collections.set(collections);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
    this._loading.set(false);
  }

  clearError(): void {
    this._error.set(null);
  }
}
