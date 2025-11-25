import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect } from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { Paginator, PaginationEvent } from '../../molecules/paginator/paginator';
import type { CartInterface, Datum } from '../../../core/models/interfaces/cart.interface';
import type { DeliveryType } from '../../../core/models/interfaces/order.interface';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-shopping-cart',
  imports: [Paginator],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingCart {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);

  // ========== INPUTS ==========
  readonly dataApi = input<CartInterface | null>();
  readonly isProcessing = input<boolean>(false);
  readonly processingItemId = input<string | null>(null);

  // ========== OUTPUTS ==========
  readonly paginated = output<PaginationEvent>();
  readonly itemRemoved = output<string>();
  readonly quantityIncreased = output<string>();
  readonly quantityDecreased = output<string>();
  readonly cartCleared = output<void>();
  readonly checkoutInitiated = output<void>();
  readonly shoppingContinued = output<void>();

  // ========== SIGNALS - Estado del carrito ==========
  readonly showDeliveryOptions = signal(false);
  readonly selectedDeliveryOption = signal<DeliveryType | null>(null);
  readonly checkoutError = signal<string | null>(null);

  // ========== COMPUTED - Data ==========
  readonly cartData = computed(() => this.dataApi());
  readonly items = computed(() => this.cartData()?.data ?? []);
  readonly summary = computed(() => this.cartData()?.summary ?? null);
  readonly meta = computed(() => this.cartData()?.meta ?? null);

  // ========== COMPUTED - Estado ==========
  readonly isEmpty = computed(() => this.items().length === 0);
  readonly hasItems = computed(() => this.items().length > 0);

  // ========== COMPUTED - Resumen ==========
  readonly totalItems = computed(() => this.summary()?.totalItems ?? 0);
  readonly totalQuantity = computed(() => this.summary()?.totalQuantity ?? 0);
  readonly subtotal = computed(() => this.summary()?.subtotal ?? 0);
  readonly totalDiscount = computed(() => this.summary()?.totalDiscount ?? 0);
  readonly totalAmount = computed(() => this.summary()?.totalAmount ?? 0);
  readonly estimatedTax = computed(() => this.summary()?.estimatedTax ?? 0);
  readonly estimatedShipping = computed(() => this.summary()?.estimatedShipping ?? 0);
  readonly estimatedTotal = computed(() => this.summary()?.estimatedTotal ?? 0);
  readonly cartTotal = computed(() => this.cartService.totalAmount() / 1.21);

  // ========== COMPUTED - UI ==========
  readonly hasUnavailableItems = computed(() =>
    this.items().some(item => !this.isAvailable(item))
  );

  // ========== COMPUTED - CHECKOUT ==========
  readonly deliveryText = computed(() => {
    const option = this.selectedDeliveryOption();
    return option === 'delivery'
      ? 'Envío a domicilio seleccionado'
      : 'Retiro en tienda seleccionado';
  });

  readonly deliverySubtext = computed(() => {
    const option = this.selectedDeliveryOption();
    return option === 'delivery'
      ? 'Recibirás una cotización de envío antes de pagar'
      : 'Podrás retirar tu pedido en nuestro local';
  });

  readonly canProceedToCheckout = computed(() => {
    return this.hasItems() && !this.hasUnavailableItems() && !this.isProcessing();
  });

  // ========== EFFECTS ==========
  constructor() {
    // Limpiar errores al cambiar opción de entrega
    effect(() => {
      this.selectedDeliveryOption();
      this.checkoutError.set(null);
    });
  }

  // ========== MÉTODOS PÚBLICOS - PAGINACIÓN ==========

  onPageChange(event: PaginationEvent): void {
    this.paginated.emit(event);
  }

  // ========== MÉTODOS PÚBLICOS - CART ==========

  removeItem(item: Datum): void {
    if (!this.verifyAuthentication()) return;
    if (this.isProcessing()) return;
    this.itemRemoved.emit(item.product.id);
  }

  increaseQuantity(item: Datum): void {
    if (!this.verifyAuthentication()) return;
    if (this.isProcessingItem(item.product.id)) return;

    if (item.quantity >= item.product.stock) {
      alert(`Stock máximo disponible: ${item.product.stock}`);
      return;
    }

    this.quantityIncreased.emit(item.product.id);
  }

  decreaseQuantity(item: Datum): void {
    if (!this.verifyAuthentication()) return;
    if (this.isProcessingItem(item.product.id)) return;

    if (item.quantity <= 1) {
      console.warn('⚠️ Cantidad mínima alcanzada (1)');
      return;
    }

    this.quantityDecreased.emit(item.product.id);
  }

  clearCart(): void {
    if (this.isEmpty()) return;
    if (!this.verifyAuthentication()) return;
    if (this.isProcessing()) return;

    if (!confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      return;
    }

    this.cartCleared.emit();
  }

  proceedToCheckout(): void {
    if (this.isEmpty()) return;
    if (!this.verifyAuthentication()) return;
    if (this.isProcessing()) return;

    this.checkoutInitiated.emit();
  }

  continueShopping(): void {
    this.shoppingContinued.emit();
  }

  // ========== MÉTODOS PÚBLICOS - CHECKOUT ==========

  /**
   * Inicia el proceso de selección de tipo de entrega
   */
  onStartCheckout(): void {
    if (!this.verifyAuthentication()) return;
    if (!this.canProceedToCheckout()) return;

    this.showDeliveryOptions.set(true);
    this.checkoutError.set(null);
    console.log('🛒 Iniciando checkout...');
  }

  /**
   * Selecciona el tipo de entrega
   */
  onSelectDeliveryOption(option: DeliveryType): void {
    this.selectedDeliveryOption.set(option);
    this.checkoutError.set(null);
    console.log('📦 Tipo de entrega seleccionado:', option);
  }

  /**
   * Cancela la selección de entrega y cierra el modal
   */
  onCancelDeliverySelection(): void {
    this.showDeliveryOptions.set(false);
    this.selectedDeliveryOption.set(null);
    this.checkoutError.set(null);
    console.log('❌ Cancelando selección de entrega');
  }

  /**
   * ✅ REFACTORIZADO: Solo guarda el estado y redirige a purchase-order
   * Ya NO crea la orden aquí
   */
  onProceedToCheckout(): void {
    const deliveryType = this.selectedDeliveryOption();

    if (!deliveryType) {
      this.checkoutError.set('Por favor, selecciona un tipo de entrega');
      return;
    }

    if (!this.verifyAuthentication()) return;

    // 1. Guardar el estado de checkout en el servicio
    this.orderService.initCheckout(deliveryType);
    console.log('✅ Estado de checkout guardado:', deliveryType);

    // 2. Redirigir a purchase-order donde se manejará todo
    console.log('🚀 Redirigiendo a purchase-order...');
    this.router.navigate(['/purchase-order']);

    // 3. Cerrar el modal de opciones de entrega
    this.showDeliveryOptions.set(false);
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

  canDecrease(item: Datum): boolean {
    return item.quantity > 1 && !this.isProcessingItem(item.product.id);
  }

  canIncrease(item: Datum): boolean {
    return item.quantity < item.product.stock &&
           this.isAvailable(item) &&
           !this.isProcessingItem(item.product.id);
  }

  isProcessingItem(productId: string): boolean {
    return this.processingItemId() === productId;
  }

  private verifyAuthentication(): boolean {
    if (!this.authService.isAuthenticated() || !this.authService.hasValidToken()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

  goToProductDetail(productId: string): void {
    this.router.navigate(['/details', productId]);
  }
}