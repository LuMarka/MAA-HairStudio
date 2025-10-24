import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/interfaces/Product.interface';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly apiUrl = environment.apiUrl + 'products/';
  private readonly http = inject(HttpClient);

  // Signal-based state
  private readonly _products = signal<Product[]>([]);
  readonly products = this._products.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  private readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  // Computed signals for filtered data
  readonly productsByBrand = computed(() => {
    const products = this.products();
    return (brand: string) => products.filter(p => p.brand === brand);
  });

  readonly productsByCollection = computed(() => {
    const products = this.products();
    return (collection: string) => products.filter(p => p.collection === collection);
  });

  loadProducts(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<Product[]>(this.apiUrl).subscribe({
      next: (products) => {
        this._products.set(products);
        this._loading.set(false);
        console.log('Products loaded successfully =>', products);
      },
      error: (error) => {
        this._error.set('Error loading products');
        this._loading.set(false);
        console.error('Error:', error);
      }
    });
  }

  // Method to filter products by brand (reactive)
  getProductsByBrand(brand: string): Product[] {
    return this.productsByBrand()(brand);
  }

  // Method to filter products by collection (reactive)
  getProductsByCollection(collection: string): Product[] {
    return this.productsByCollection()(collection);
  }
}
