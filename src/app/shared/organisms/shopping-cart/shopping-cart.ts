import { Component, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models/interfaces/cart.interface';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.scss'
})
export class ShoppingCart implements OnInit {
  isLoading = signal(false);

  // Usar el servicio de carritorta
  cartItems;
  itemCount;
  subtotal;
  isEmpty;

  // Computed values específicos del componente
  shipping;
  total;

  constructor(private router: Router, private cartService: CartService) {
    this.cartItems = this.cartService.items;
    this.itemCount = this.cartService.totalItems;
    this.subtotal = this.cartService.total;
    this.isEmpty = computed(() => this.cartService.items().length === 0);

    this.shipping = computed(() => this.subtotal() >= 50000 ? 0 : 3000);
    this.total = computed(() => this.subtotal() + this.shipping());
  }

  ngOnInit() {
    // Commented out since initializeWithSampleData method doesn't exist
    // this.cartService.initializeWithSampleData();
  }

  // Métodos del carrito
  updateQuantity(itemId: string, newQuantity: number): void {
    this.cartService.updateQuantity(itemId, newQuantity);
  }

  removeItem(itemId: string): void {
    this.cartService.removeItem(itemId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  proceedToCheckout(): void {
    if (this.isEmpty()) return;
    this.router.navigate(['/purchase-order']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  // Formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  }
}
