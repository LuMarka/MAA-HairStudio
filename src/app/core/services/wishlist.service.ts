import { Injectable, signal } from '@angular/core';
import { Datum } from '../models/interfaces/Product.interface';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly STORAGE_KEY = 'maa-wishlist';
  private readonly _wishlist = signal<Datum[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  get wishlist() {
    return this._wishlist.asReadonly();
  }

  get count() {
    return this._wishlist().length;
  }

  isInWishlist(product: Datum): boolean {
    return this._wishlist().some(p => p.id === product.id);
  }

  toggle(product: Datum): void {
    this._wishlist.update(list => {
      const exists = list.some(p => p.id === product.id);
      let newList: Datum[];

      if (exists) {
        newList = list.filter(p => p.id !== product.id);
      } else {
        newList = [...list, product];
      }

      this.saveToStorage(newList);
      return newList;
    });
  }

  add(product: Datum): void {
    if (!this.isInWishlist(product)) {
      this._wishlist.update(list => {
        const newList = [...list, product];
        this.saveToStorage(newList);
        return newList;
      });
    }
  }

  remove(product: Datum): void {
    this._wishlist.update(list => {
      const newList = list.filter(p => p.id !== product.id);
      this.saveToStorage(newList);
      return newList;
    });
  }

  clear(): void {
    this._wishlist.set([]);
    this.saveToStorage([]);
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const products = JSON.parse(stored) as Datum[];
          this._wishlist.set(products);
        }
      } catch (error) {
        console.warn('Error loading wishlist from storage:', error);
      }
    }
  }

  private saveToStorage(products: Datum[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
      } catch (error) {
        console.warn('Error saving wishlist to storage:', error);
      }
    }
  }
}
