import { Component, ChangeDetectionStrategy, inject, input, output, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Paginator, PaginationEvent } from '../../molecules/paginator/paginator';
import type { CartInterface, Datum } from '../../../core/models/interfaces/cart.interface';

@Component({
  selector: 'app-shopping-cart',
  imports: [Paginator],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingCart {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ========== INPUTS ==========
  readonly dataApi = input<CartInterface | null>();

  // ========== OUTPUTS ==========
  readonly paginated = output<PaginationEvent>();
  readonly itemRemoved = output<string>(); // productId
  readonly quantityIncreased = output<string>(); // productId
  readonly quantityDecreased = output<string>(); // productId
  readonly cartCleared = output<void>();
  readonly checkoutInitiated = output<void>();
  readonly shoppingContinued = output<void>();

  // ========== COMPUTED - Data ==========
  readonly cartData = computed(() => this.dataApi());
  readonly items = computed(() => this.cartData()?.data ?? []);
  readonly summary = computed(() => this.cartData()?.summary ?? null);
  readonly meta = computed(() => this.cartData()?.meta ?? null);

  // ========== COMPUTED - Estado ==========
  readonly isEmpty = computed(() => this.items().length === 0);
  readonly hasItems = computed(() => this.items().length > 0);
  readonly isLoading = computed(() => false); // Controlado por el padre

  // ========== COMPUTED - Resumen ==========
  readonly totalItems = computed(() => this.summary()?.totalItems ?? 0);
  readonly totalQuantity = computed(() => this.summary()?.totalQuantity ?? 0);
  readonly subtotal = computed(() => this.summary()?.subtotal ?? 0);
  readonly totalDiscount = computed(() => this.summary()?.totalDiscount ?? 0);
  readonly totalAmount = computed(() => this.summary()?.totalAmount ?? 0);
  readonly estimatedTax = computed(() => this.summary()?.estimatedTax ?? 0);
  readonly estimatedShipping = computed(() => this.summary()?.estimatedShipping ?? 0);
  readonly estimatedTotal = computed(() => this.summary()?.estimatedTotal ?? 0);

  // ========== COMPUTED - UI ==========
  readonly hasUnavailableItems = computed(() =>
    this.items().some(item => !this.isAvailable(item))
  );

  // ========== MÉTODOS PÚBLICOS - PAGINACIÓN ==========

  /**
   * Maneja el cambio de página
   */
  onPageChange(event: PaginationEvent): void {
    this.paginated.emit(event);
  }

  // ========== MÉTODOS PÚBLICOS - CART ==========

  /**
   * Elimina un item del carrito
   */
  removeItem(item: Datum): void {
    if (!this.verifyAuthentication()) return;
    this.itemRemoved.emit(item.product.id);
  }

  /**
   * Incrementa la cantidad de un producto
   */
  increaseQuantity(item: Datum): void {
    if (!this.verifyAuthentication()) return;

    if (item.quantity >= item.product.stock) {
      alert(`Stock máximo disponible: ${item.product.stock}`);
      return;
    }

    this.quantityIncreased.emit(item.product.id);
  }

  /**
   * Decrementa la cantidad de un producto
   */
  decreaseQuantity(item: Datum): void {
    if (!this.verifyAuthentication()) return;

    if (item.quantity <= 1) {
      this.removeItem(item);
      return;
    }

    this.quantityDecreased.emit(item.product.id);
  }

  /**
   * Limpia todo el carrito
   */
  clearCart(): void {
    if (this.isEmpty()) return;
    if (!this.verifyAuthentication()) return;

    if (!confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      return;
    }

    this.cartCleared.emit();
  }

  // ========== MÉTODOS PÚBLICOS - CHECKOUT ==========

  /**
   * Procede al checkout
   */
  proceedToCheckout(): void {
    if (this.isEmpty()) return;
    if (!this.verifyAuthentication()) return;

    this.checkoutInitiated.emit();
  }

  /**
   * Continúa comprando
   */
  continueShopping(): void {
    this.shoppingContinued.emit();
  }

  // ========== MÉTODOS AUXILIARES ==========

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  hasDiscount(item: Datum): boolean {
    return item.isOnSale && item.product.originalPrice > item.product.finalPrice;
  }

  getDiscountPercentage(item: Datum): string {
    return item.product.discountPercentage;
  }

  isAvailable(item: Datum): boolean {
    return item.product.isAvailable && item.product.stock > 0;
  }

  // ========== MÉTODOS PRIVADOS ==========

  private verifyAuthentication(): boolean {
    if (!this.authService.isAuthenticated() || !this.authService.hasValidToken()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
