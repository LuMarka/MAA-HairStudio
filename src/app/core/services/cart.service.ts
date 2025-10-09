import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/interfaces/cart.interface';

@Injectable({ providedIn: 'root' })
export class CartService {
  // Estado del carrito
  private cartItems = signal<CartItem[]>([]);

  // Getters reactivos
  items = this.cartItems.asReadonly();

  itemCount = computed(() =>
    this.cartItems().reduce((count, item) => count + item.quantity, 0)
  );

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  isEmpty = computed(() => this.cartItems().length === 0);

  // Métodos del carrito
  addItem(item: Omit<CartItem, 'quantity'>): void {
    const existingItemIndex = this.cartItems().findIndex(cartItem => cartItem.id === item.id);

    if (existingItemIndex >= 0) {
      // Si el item ya existe, incrementar cantidad
      this.updateQuantity(item.id, this.cartItems()[existingItemIndex].quantity + 1);
    } else {
      // Si es nuevo, agregarlo con cantidad 1
      this.cartItems.update(items => [...items, { ...item, quantity: 1 }]);
    }
  }

  updateQuantity(itemId: string, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    this.cartItems.update(items =>
      items.map(item => {
        if (item.id === itemId) {
          const validQuantity = Math.min(newQuantity, item.maxQuantity);
          return { ...item, quantity: validQuantity };
        }
        return item;
      })
    );
  }

  removeItem(itemId: string): void {
    this.cartItems.update(items =>
      items.filter(item => item.id !== itemId)
    );
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  // Inicializar con datos de ejemplo (remover en producción)
  initializeWithSampleData(): void {
    if (this.cartItems().length === 0) {
      this.cartItems.set([
        {
          id: '1',
          name: 'Shampoo Nutritive Bain Satin 1',
          brand: 'Kérastase',
          price: 8500,
          originalPrice: 9500,
          quantity: 1,
          image: '/images/ker_nutritive.jpg',
          description: 'Para cabello normal a ligeramente seco',
          inStock: true,
          maxQuantity: 10
        },
        {
          id: '2',
          name: 'Mascarilla Absolut Repair Molecular',
          brand: "L'Oréal Professionnel",
          price: 12000,
          quantity: 2,
          image: '/images/kerastase.png',
          description: 'Reparación molecular intensa',
          inStock: true,
          maxQuantity: 10
        }
      ]);
    }
  }
}
