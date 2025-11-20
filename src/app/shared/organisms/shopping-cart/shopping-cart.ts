import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect } from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { AddressService } from '../../../core/services/address.service';
import { Paginator, PaginationEvent } from '../../molecules/paginator/paginator';
import type { CartInterface, Datum } from '../../../core/models/interfaces/cart.interface';
import type { DeliveryType } from '../../../core/models/interfaces/order.interface';

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
  // ✅ NUEVO: Inyectar servicios necesarios para checkout
  private readonly orderService = inject(OrderService);
  private readonly addressService = inject(AddressService);

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

  // ========== COMPUTED - UI ==========
  readonly hasUnavailableItems = computed(() =>
    this.items().some(item => !this.isAvailable(item))
  );

  // ========== SIGNALS - CHECKOUT ==========
  readonly showDeliveryOptions = signal(false);
  readonly selectedDeliveryOption = signal<DeliveryType | null>(null);
  // ✅ NUEVO: Signals para manejo de estado de checkout
  readonly isCreatingOrder = signal(false);
  readonly checkoutError = signal<string | null>(null);

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

  // ✅ NUEVO: Computed para validar si puede proceder
  readonly canProceedToCheckout = computed(() => {
    return this.hasItems() && 
           !this.hasUnavailableItems() && 
           !this.isCreatingOrder();
  });

  // ✅ NUEVO: Effect para limpiar errores
  constructor() {
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

  onStartCheckout(): void {
    if (!this.verifyAuthentication()) return;
    if (!this.canProceedToCheckout()) return;

    this.showDeliveryOptions.set(true);
    this.checkoutError.set(null);
    console.log('🛒 Iniciando checkout...');
  }

  onSelectDeliveryOption(option: DeliveryType): void {
    this.selectedDeliveryOption.set(option);
    this.checkoutError.set(null);
    console.log('📦 Tipo de entrega seleccionado:', option);
  }

  onCancelDeliverySelection(): void {
    this.showDeliveryOptions.set(false);
    this.selectedDeliveryOption.set(null);
    this.checkoutError.set(null);
    console.log('❌ Cancelando selección de entrega');
  }

  // ✅ NUEVO: Método principal de checkout con lógica completa
  onProceedToCheckout(): void {
    const deliveryType = this.selectedDeliveryOption();
    
    if (!deliveryType) {
      this.checkoutError.set('Por favor, selecciona un tipo de entrega');
      return;
    }

    if (!this.verifyAuthentication()) return;
    
    this.isCreatingOrder.set(true);
    this.checkoutError.set(null);

    if (deliveryType === 'pickup') {
      this.handleStorePickup();
    } else {
      this.handleHomeDelivery();
    }
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

  // ========== MÉTODOS PRIVADOS - CHECKOUT LOGIC ==========

  /**
   * ✅ NUEVO: Maneja el checkout con retiro en tienda
   */
  private handleStorePickup(): void {
    console.log('🏪 Procesando retiro en tienda...');

    this.orderService.createOrderFromCart({
      deliveryType: 'pickup',
      notes: 'Retiro en tienda'
    }).subscribe({
      next: (response) => {
        console.log('✅ Orden creada exitosamente:', response.data.orderNumber);
        
        // Emitir evento para que el padre limpie el carrito
        this.cartCleared.emit();
        
        // Redirigir a la página de la orden
        this.router.navigate(['/orders', response.data.id]);
      },
      error: (error) => {
        console.error('❌ Error al crear orden:', error);
        this.checkoutError.set(error.message || 'Error al crear la orden');
        this.isCreatingOrder.set(false);
      },
      complete: () => {
        this.isCreatingOrder.set(false);
      }
    });
  }

  /**
   * ✅ NUEVO: Maneja el checkout con envío a domicilio
   */
  private handleHomeDelivery(): void {
    console.log('🚚 Procesando envío a domicilio...');

    this.addressService.getAddresses().subscribe({
      next: (addressResponse) => {
        const addresses = addressResponse.data;

        if (addresses.length === 0) {
          console.log('📍 Sin direcciones. Redirigiendo a crear dirección...');
          this.router.navigate(['/addresses/new'], {
            queryParams: { returnUrl: '/cart', action: 'checkout' }
          });
          this.isCreatingOrder.set(false);
          return;
        }

        const defaultAddress = addresses.find(addr => addr.isDefault);
        
        if (defaultAddress) {
          this.createOrderWithAddress(defaultAddress.id);
        } else {
          console.log('📍 Sin dirección por defecto. Redirigiendo a seleccionar...');
          this.router.navigate(['/addresses/select'], {
            queryParams: { returnUrl: '/cart', action: 'checkout' }
          });
          this.isCreatingOrder.set(false);
        }
      },
      error: (error) => {
        console.error('❌ Error al obtener direcciones:', error);
        this.checkoutError.set('Error al verificar direcciones. Intenta nuevamente.');
        this.isCreatingOrder.set(false);
      }
    });
  }

  /**
   * ✅ NUEVO: Crea una orden con una dirección específica
   */
  private createOrderWithAddress(addressId: string): void {
    console.log('📦 Creando orden con dirección:', addressId);

    this.orderService.createOrderFromCart({
      deliveryType: 'delivery',
      shippingAddressId: addressId,
      notes: 'Envío a domicilio'
    }).subscribe({
      next: (response) => {
        console.log('✅ Orden creada exitosamente:', response.data.orderNumber);
        
        // Emitir evento para que el padre limpie el carrito
        this.cartCleared.emit();
        
        // Redirigir a la página de la orden
        this.router.navigate(['/orders', response.data.id]);
      },
      error: (error) => {
        console.error('❌ Error al crear orden:', error);
        this.checkoutError.set(error.message || 'Error al crear la orden');
        this.isCreatingOrder.set(false);
      },
      complete: () => {
        this.isCreatingOrder.set(false);
      }
    });
  }

  private verifyAuthentication(): boolean {
    if (!this.authService.isAuthenticated() || !this.authService.hasValidToken()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
