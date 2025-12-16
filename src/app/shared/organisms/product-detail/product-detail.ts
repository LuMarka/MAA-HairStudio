import { Component, computed, effect, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, catchError, throwError } from 'rxjs';
import { ProductsService } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Datum } from '../../../core/models/interfaces/Product.interface';

type ProductTab = 'details' | 'specs';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetail implements OnInit {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);

  // ========== SIGNALS - Estado del producto ==========
  readonly product = signal<Datum | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly quantity = signal(1);
  readonly selectedImage = signal('');
  readonly activeTab = signal<ProductTab>('details');
  readonly imageLoadError = signal(false);
  readonly addingToCart = signal(false);

  // ========== SIGNALS - Estado del carrito ==========
  readonly isAddingToCart = signal(false);
  readonly addToCartSuccess = signal(false);
  readonly addToCartError = signal<string | null>(null);

  // ========== COMPUTED - Precios ==========
  readonly priceWithoutTax = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct) return 0;
    return currentProduct.price / 1.21;
  });

  readonly hasDiscount = computed(() => {
    const currentProduct = this.product();
    return currentProduct ? currentProduct.originalPrice > currentProduct.price : false;
  });

  // ========== COMPUTED - Imágenes ==========
  readonly hasImages = computed(() => {
    const currentProduct = this.product();
    return currentProduct?.images && currentProduct.images.length > 0;
  });

  readonly mainImage = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct) return '';

    if (currentProduct.images && currentProduct.images.length > 0) {
      return currentProduct.images[0];
    }

    return currentProduct.image || '';
  });

  readonly fallbackImage = computed(() => {
    return 'assets/images/product-placeholder.jpg';
  });

  readonly displayImage = computed(() => {
    const selected = this.selectedImage();
    const main = this.mainImage();
    const fallback = this.fallbackImage();

    if (this.imageLoadError()) {
      return fallback;
    }

    return selected || main || fallback;
  });

  // ========== COMPUTED - Stock y disponibilidad ==========
  readonly inStock = computed(() => {
    const currentProduct = this.product();
    return currentProduct ? currentProduct.stock > 0 && currentProduct.isAvailable : false;
  });

  readonly categoryName = computed(() => {
    const currentProduct = this.product();
    return currentProduct?.subcategory?.category?.name || '';
  });

  readonly subcategoryName = computed(() => {
    const currentProduct = this.product();
    return currentProduct?.subcategory?.name || '';
  });

  // ========== COMPUTED - Estado del carrito ==========
  readonly isProductInCart = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct) return false;
    return this.cartService.isProductInCart(currentProduct.id);
  });

  readonly currentCartQuantity = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct) return 0;
    return this.cartService.getProductQuantity(currentProduct.id);
  });

  readonly canAddMoreToCart = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct) return false;
    return this.quantity() <= currentProduct.stock;
  });

  readonly addToCartButtonText = computed(() => {
    if (this.isAddingToCart()) {
      return 'Actualizando...';
    }
    if (this.isProductInCart()) {
      return 'Actualizar cantidad';
    }
    return 'Añadir al carrito';
  });

  // ========== CONSTRUCTOR ==========
  constructor() {
    // Effect para actualizar la imagen cuando cambia el producto
    effect(() => {
      const currentProduct = this.product();
      if (currentProduct) {
        const imageToShow = this.mainImage();
        this.selectedImage.set(imageToShow);
        this.imageLoadError.set(false);
      }
    });

    // Effect para sincronizar cantidad con carrito
    effect(() => {
      const currentProduct = this.product();
      if (currentProduct && this.isProductInCart()) {
        // Si el producto está en el carrito, sincronizar la cantidad
        const cartQty = this.currentCartQuantity();
        this.quantity.set(cartQty);
      }
    });

    // Effect para limpiar mensajes de éxito después de 3 segundos
    effect(() => {
      if (this.addToCartSuccess()) {
        setTimeout(() => {
          this.addToCartSuccess.set(false);
        }, 3000);
      }
    });
  }

  // ========== LIFECYCLE ==========
  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');

    if (productId) {
      this.loadProduct(productId);
    } else {
      this.error.set('ID de producto no válido');
    }
  }

  // ========== MÉTODOS PÚBLICOS - Carga de producto ==========
  private loadProduct(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.productsService.getProductById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.product.set(response.data);
        } else {
          this.error.set(response.message || 'Producto no encontrado');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el producto. Por favor, inténtalo de nuevo.');
        this.loading.set(false);
      }
    });
  }

  reloadProduct(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    }
  }

  // ========== MÉTODOS PÚBLICOS - Manejo de imágenes ==========
  changeImage(imageUrl: string): void {
    this.selectedImage.set(imageUrl);
    this.imageLoadError.set(false);
  }

  onImageError(): void {
    this.imageLoadError.set(true);
  }

  onImageLoad(): void {
    this.imageLoadError.set(false);
  }

  // ========== MÉTODOS PÚBLICOS - Manejo de cantidad ==========
  incrementQuantity(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const maxAllowed = currentProduct.stock;
    const newQty = this.quantity() + 1;

    if (newQty <= maxAllowed) {
      this.quantity.set(newQty);

      // Si el producto ya está en el carrito, actualizar inmediatamente
      if (this.isProductInCart()) {
        this.updateCartQuantityInstantly(currentProduct.id, newQty);
      }
    }
  }

  decrementQuantity(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const newQty = this.quantity() - 1;

    if (newQty >= 1) {
      this.quantity.set(newQty);

      // Si el producto ya está en el carrito, actualizar inmediatamente
      if (this.isProductInCart()) {
        this.updateCartQuantityInstantly(currentProduct.id, newQty);
      }
    }
  }

  canIncrementQuantity(): boolean {
    const currentProduct = this.product();
    if (!currentProduct) return false;

    return this.quantity() < currentProduct.stock;
  }

  canDecrementQuantity(): boolean {
    return this.quantity() > 1;
  }

  // ========== MÉTODOS PÚBLICOS - Carrito ==========
  addToCart(): void {
    // Verificar autenticación
    if (!this.verifyAuthentication()) {
      return;
    }

    const currentProduct = this.product();
    if (!currentProduct || !this.inStock()) {
      console.warn('⚠️ Producto no disponible o sin stock');
      return;
    }

    // Verificar si excede el stock disponible
    if (!this.canAddMoreToCart()) {
      this.addToCartError.set(`No puedes agregar más de ${currentProduct.stock} unidades`);
      return;
    }

    this.isAddingToCart.set(true);
    this.addToCartError.set(null);
    this.addToCartSuccess.set(false);

    // Si el producto ya está en el carrito, actualizar cantidad
    if (this.isProductInCart()) {
      this.updateCartQuantity(currentProduct.id, this.quantity());
    } else {
      this.addNewProductToCart(currentProduct.id);
    }
  }

  // ========== MÉTODOS PRIVADOS - Carrito ==========
  private addNewProductToCart(productId: string): void {
    const qty = this.quantity();

    this.cartService.addToCart({
      productId,
      quantity: qty
    })
      .pipe(
        finalize(() => this.isAddingToCart.set(false)),
        catchError((error) => {
          this.addToCartError.set(
            error?.error?.message || 'Error al agregar el producto al carrito'
          );
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          this.addToCartSuccess.set(true);

          // Mostrar notificación
          this.showSuccessNotification(`${qty} ${qty === 1 ? 'unidad agregada' : 'unidades agregadas'} al carrito`);
        },
        error: (err) => {
          console.error('❌ Error al agregar al carrito:', err);
        }
      });
  }

  private updateCartQuantity(productId: string, newQuantity: number): void {
    this.cartService.setQuantity(productId, newQuantity)
      .pipe(
        finalize(() => this.isAddingToCart.set(false)),
        catchError((error) => {
          this.addToCartError.set(
            error?.error?.message || 'Error al actualizar la cantidad'
          );
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          this.addToCartSuccess.set(true);

          // Mostrar notificación
          this.showSuccessNotification(
            `Cantidad actualizada a ${newQuantity} ${newQuantity === 1 ? 'unidad' : 'unidades'}`
          );
        },
        error: (err) => {
          console.error('❌ Error al actualizar cantidad:', err);
        }
      });
  }

  private updateCartQuantityInstantly(productId: string, newQuantity: number): void {
    this.cartService.setQuantity(productId, newQuantity)
      .pipe(
        catchError((error) => {
          console.error('❌ Error al actualizar cantidad:', error);
          // Revertir la cantidad en caso de error
          const originalQty = this.currentCartQuantity();
          this.quantity.set(originalQty);
          this.addToCartError.set('Error al actualizar la cantidad');
          return throwError(() => error);
        })
      )
      .subscribe({
        next: () => {
          console.log(`✅ Cantidad actualizada a ${newQuantity}`);
        }
      });
  }

  private showSuccessNotification(message: string): void {
    // TODO: Implementar sistema de notificaciones toast
    console.log('🎉', message);
  }

  private verifyAuthentication(): boolean {
    if (!this.authService.isAuthenticated() || !this.authService.hasValidToken()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return false;
    }
    return true;
  }

  // ========== MÉTODOS PÚBLICOS - Navegación ==========
  selectTab(tab: ProductTab): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.location.back();
  }
}
