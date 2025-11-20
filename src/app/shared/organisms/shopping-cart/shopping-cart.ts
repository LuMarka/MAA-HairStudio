import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';

type DeliveryOption = 'delivery' | 'pickup';

@Component({
  selector: 'app-shopping-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.scss'
})
export class ShoppingCart {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly showDeliveryOptions = signal(false);
  readonly selectedDeliveryOption = signal<DeliveryOption | null>(null);

  readonly items = computed(() => this.cartService.items());
  readonly totalItems = computed(() => this.cartService.totalItems());
  readonly cartTotal = computed(() => this.cartService.total()/1.21);
  readonly isEmpty = computed(() => this.items().length === 0);

  readonly tax = computed(() => this.cartTotal() * 0.21);
  readonly totalWithTax = computed(() => this.cartTotal() + this.tax());

  readonly deliveryText = computed(() => {
    const option = this.selectedDeliveryOption();
    if (!option) return '';
    return option === 'delivery' ? 'Envío a domicilio' : 'Retiro en tienda';
  });

  readonly deliverySubtext = computed(() => {
    const option = this.selectedDeliveryOption();
    if (!option) return '';
    return option === 'delivery' ? 'Costo a convenir' : 'Sin costo adicional';
  });

  removeItem(itemId: string): void {
    this.cartService.removeItem(itemId);
  }

  updateQuantity(itemId: string, quantity: number): void {
    this.cartService.updateQuantity(itemId, quantity);
  }

  increaseQuantity(itemId: string): void {
    const item = this.items().find(i => i.id === itemId);
    if (item) {
      this.updateQuantity(itemId, item.quantity + 1);
    }
  }

  decreaseQuantity(itemId: string): void {
    const item = this.items().find(i => i.id === itemId);
    if (item && item.quantity > 1) {
      this.updateQuantity(itemId, item.quantity - 1);
    }
  }

  onStartCheckout(): void {
    this.showDeliveryOptions.set(true);
  }

  onSelectDeliveryOption(option: DeliveryOption): void {
    this.selectedDeliveryOption.set(option);
  }

  onProceedToCheckout(): void {
    const deliveryOption = this.selectedDeliveryOption();
    if (!deliveryOption) return;

    // Navegar al purchase-order con la opción seleccionada
    this.router.navigate(['/purchase-order'], {
      queryParams: { deliveryOption }
    });
  }

  onCancelDeliverySelection(): void {
    this.showDeliveryOptions.set(false);
    this.selectedDeliveryOption.set(null);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  goToProductDetail(productId: string): void {
    this.router.navigate(['/details', productId]);
  }
}
