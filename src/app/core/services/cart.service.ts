import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  description?: string;
  inStock?: boolean;
  maxQuantity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = computed(() => this._items());
  readonly totalItems = computed(() =>
    this._items().reduce((total, item) => total + item.quantity, 0)
  );
  readonly total = computed(() =>
    this._items().reduce((total, item) => total + (item.price * item.quantity), 0)
  );

  addItem(item: CartItem): void {
    const currentItems = this._items();
    const existingItemIndex = currentItems.findIndex(existing => existing.id === item.id);

    if (existingItemIndex > -1) {
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + item.quantity
      };
      this._items.set(updatedItems);
    } else {
      this._items.set([...currentItems, item]);
    }

    console.log('Item added to cart:', item);
    console.log('Current cart items:', this._items());
  }

  removeItem(itemId: string): void {
    const currentItems = this._items();
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    this._items.set(updatedItems);

    console.log('Item removed from cart:', itemId);
    console.log('Current cart items:', this._items());
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    const currentItems = this._items();
    const updatedItems = currentItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    this._items.set(updatedItems);

    console.log('Item quantity updated:', { itemId, quantity });
    console.log('Current cart items:', this._items());
  }

  clearCart(): void {
    this._items.set([]);
    console.log('Cart cleared');
  }

  getItemCount(): number {
    return this.totalItems();
  }

  getCartTotal(): number {
    return this.total();
  }

  // Método de prueba para agregar datos de ejemplo
  addSampleItems(): void {
    const sampleItems: CartItem[] = [
      {
        id: '1',
        name: 'Champú Profesional Hidratante',
        brand: 'L\'Oréal Professional',
        price: 2500,
        quantity: 1,
        image: '/images/products/shampoo-1.jpg',
        description: 'Champú hidratante para cabello seco y dañado',
        inStock: true,
        maxQuantity: 10
      },
      {
        id: '2',
        name: 'Mascarilla Reparadora',
        brand: 'Kerastase',
        price: 4200,
        quantity: 2,
        image: '/images/products/mask-1.jpg',
        description: 'Mascarilla intensiva para la reparación del cabello',
        inStock: true,
        maxQuantity: 5
      }
    ];

    this._items.set(sampleItems);
    console.log('Sample items added to cart');
  }
}
