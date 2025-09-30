import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/interfaces/Product.interface';

@Injectable({
  providedIn: 'root'
})
export class Products {
  private readonly apiUrl = '/api/products'; // Cambia esta URL por la de tu backend real

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductsByBrand(brand: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}?brand=${encodeURIComponent(brand)}`);
  }

  getProductsByCollection(collection: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}?collection=${encodeURIComponent(collection)}`);
  }
}
