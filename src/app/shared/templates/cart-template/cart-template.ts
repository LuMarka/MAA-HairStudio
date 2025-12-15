import {
  Component,
  OnInit,
  inject,
  DestroyRef,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError, finalize } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { ShoppingCart } from '../../organisms/shopping-cart/shopping-cart';
import { CartService } from '../../../core/services/cart.service';
import { PaginationEvent } from '../../molecules/paginator/paginator';
import type { CartInterface, CartQueryParams } from '../../../core/models/interfaces/cart.interface';

@Component({
  selector: 'app-cart-template',
  imports: [ShoppingCart],
  templateUrl: './cart-template.html',
  styleUrl: './cart-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartTemplate implements OnInit {
  // Dependencias inyectadas

  private readonly destroyRef = inject(DestroyRef);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  // State management con signals
  private readonly _cartData = signal<CartInterface | null>(null);
  private readonly _localLoading = signal(false);
  private readonly _localError = signal<string | null>(null);
  private readonly _currentParams = signal<CartQueryParams>({ page: 1, limit: 10 });

  // ✅ NUEVO: Signal para trackear operación en progreso
  private readonly _isProcessing = signal(false);

  // Computed values - estado derivado
  readonly cartData = computed(() => this._cartData());
  readonly items = computed(() => this._cartData()?.data || []);
  readonly meta = computed(() => this._cartData()?.meta);
  readonly summary = computed(() => this._cartData()?.summary);
  readonly currentParams = computed(() => this._currentParams());
  readonly isLoading = computed(() => this._localLoading() || this.cartService.isLoading());
  readonly error = computed(() => this._localError() || this.cartService.errorMessage());
  readonly hasItems = computed(() => this.items().length > 0);
  readonly isEmpty = computed(() => !this.hasItems());

  // Computed para información del carrito
  readonly totalItems = computed(() => this.summary()?.totalItems ?? 0);
  readonly totalQuantity = computed(() => this.summary()?.totalQuantity ?? 0);
  readonly subtotal = computed(() => this.summary()?.subtotal ?? 0);
  readonly totalDiscount = computed(() => this.summary()?.totalDiscount ?? 0);
  readonly totalAmount = computed(() => this.summary()?.totalAmount ?? 0);
  readonly estimatedTax = computed(() => this.summary()?.estimatedTax ?? 0);
  readonly estimatedShipping = computed(() => this.summary()?.estimatedShipping ?? 0);
  readonly estimatedTotal = computed(() => this.summary()?.estimatedTotal ?? 0);
  isProcessing = signal(false);

  ngOnInit(): void {
    this.loadCart();
  }

  // ========== MÉTODOS PÚBLICOS - EVENTOS DEL HIJO ==========

  /**
   * Maneja el cambio de página
   */
  onPageChange(event: PaginationEvent): void {

    const newParams: CartQueryParams = {
      page: event.page,
      limit: event.limit
    };

    this.updateParams(newParams);
    this.loadCartWithParams(this.getCurrentParams());
  }

  /**
   * Maneja la eliminación de un item
   */
  onItemRemoved(productId: string): void {

    this._localLoading.set(true);

    this.cartService.removeFromCart(productId)
      .pipe(
        tap((response) => {
          this._cartData.set(response.cart);
        }),
        catchError((error) => {
          console.error('❌ Error al eliminar item:', error);
          this._localError.set('No se pudo eliminar el producto');
          return EMPTY;
        }),
        finalize(() => this._localLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Maneja el incremento de cantidad
   */
  onQuantityIncreased(productId: string): void {

    this._isProcessing.set(true); // ✅ Activar processing
    this._localLoading.set(true);

    this.cartService.incrementQuantity(productId, 1)
      .pipe(
        tap((response) => {
          this._cartData.set(response.cart);
        }),
        catchError((error) => {
          console.error('❌ Error al incrementar:', error);
          this._localError.set('No se pudo actualizar la cantidad');
          return EMPTY;
        }),
        finalize(() => {
          this._localLoading.set(false);
          this._isProcessing.set(false); // ✅ Desactivar processing
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Maneja el decremento de cantidad
   */
  onQuantityDecreased(productId: string): void {

    this._isProcessing.set(true); // ✅ Activar processing
    this._localLoading.set(true);

    this.cartService.decrementQuantity(productId, 1)
      .pipe(
        tap((response) => {
          this._cartData.set(response.cart);
        }),
        catchError((error) => {
          console.error('❌ Error al decrementar:', error);
          this._localError.set('No se pudo actualizar la cantidad');
          return EMPTY;
        }),
        finalize(() => {
          this._localLoading.set(false);
          this._isProcessing.set(false); // ✅ Desactivar processing
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Maneja la limpieza del carrito
   */
  onCartCleared(): void {

    this._localLoading.set(true);

    this.cartService.clearCart()
      .pipe(
        tap((response) => {
          this._cartData.set(response.cart);
        }),
        catchError((error) => {
          console.error('❌ Error al limpiar carrito:', error);
          this._localError.set('No se pudo vaciar el carrito');
          return EMPTY;
        }),
        finalize(() => this._localLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Maneja el inicio del checkout
   */
  onCheckoutInitiated(): void {

    // Validar carrito antes de continuar
    this.cartService.validateCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (validation) => {
          if (validation.data.hasUnavailableItems) {
            console.warn('⚠️ Hay productos no disponibles');

            const unavailableProducts = validation.data.details
              .filter(d => !d.available)
              .map(d => `- ${d.productName}: ${d.message}`)
              .join('\n');

            alert(`Algunos productos no están disponibles:\n\n${unavailableProducts}\n\nPor favor revisa tu carrito.`);
            return;
          }

          // Navegar a purchase-order
          this.router.navigate(['/purchase-order']);
        },
        error: (error) => {
          console.error('❌ Error al validar carrito:', error);
          alert('Error al validar el carrito. Por favor intenta nuevamente.');
        }
      });
  }

  /**
   * Maneja continuar comprando
   */
  onContinueShopping(): void {
    this.router.navigate(['/products']);
  }

  // ========== MÉTODOS PÚBLICOS - ACCIONES ==========

  /**
   * Recarga el carrito manualmente
   */
  reloadCart(): void {
    this.loadCart();
  }

  /**
   * Limpia el error local
   */
  clearError(): void {
    this._localError.set(null);
  }

  /**
   * Maneja el reintento después de un error
   */
  onRetry(): void {
    this.clearError();
    this.reloadCart();
  }

  // ========== MÉTODOS PRIVADOS ==========

  private initializeParams(): void {
    const baseParams: CartQueryParams = {
      page: 1,
      limit: 10
    };
    this._currentParams.set(baseParams);
  }

  private loadCart(): void {
    this.initializeParams();
    this.loadCartWithParams(this.getCurrentParams());
  }

  private getCurrentParams(): CartQueryParams {
    return this._currentParams();
  }

  private updateParams(newParams: CartQueryParams): void {
    this._currentParams.set({ ...this._currentParams(), ...newParams });
  }

  private loadCartWithParams(params: CartQueryParams): void {
    this._localLoading.set(true);
    this._localError.set(null);

    this.cartService.getCart(params)
      .pipe(
        tap((response: CartInterface) => {
          this._cartData.set(response);
        }),
        catchError((error) => {
          const errorMessage = error?.error?.message || 'Error al cargar el carrito';
          this._localError.set(errorMessage);
          console.error('❌ Error al cargar carrito:', error);
          return EMPTY;
        }),
        finalize(() => this._localLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
