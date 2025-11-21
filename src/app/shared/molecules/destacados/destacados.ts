import {
  Component,
  signal,
  computed,
  ViewChildren,
  ViewChild,
  QueryList,
  ElementRef,
  AfterViewInit,
  inject,
  DestroyRef,
  effect,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ProductsService, Product } from '../../../core/services/products.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductCard } from '../product-card/product-card';

@Component({
  selector: 'app-destacados',
  imports: [ProductCard],
  templateUrl: './destacados.html',
  styleUrls: ['./destacados.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: 'IMAGE_LOADER',
      useValue: (config: { src: string }) => {
        return config.src;
      }
    }
  ]
})
export class Destacados implements AfterViewInit, OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly productsService = inject(ProductsService);
  private readonly wishlistService = inject(WishlistService);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  @ViewChild('productGrid') productGrid?: ElementRef<HTMLElement>;
  @ViewChildren('productCard') productCards!: QueryList<ElementRef<HTMLElement>>;

  // Products data
  private readonly allProducts = signal<Product[]>([]);
  private readonly isLoading = signal<boolean>(true);
  private readonly error = signal<string | null>(null);

  // Carousel control
  private readonly itemsPerPageSignal = signal(1);
  private readonly currentPageSignal = signal(0);

  // Tracking loaded images and visible items
  private readonly loadedImages = signal<Set<string>>(new Set());
  private readonly visibleItems = signal<Set<string>>(new Set());

  // Intersection Observer
  private observer?: IntersectionObserver;

  // ========== COMPUTED - Products ==========
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly totalPages = computed(() =>
    Math.ceil(this.allProducts().length / this.itemsPerPageSignal())
  );

  readonly pageIndicators = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i)
  );

  readonly visibleProducts = computed(() => {
    const startIdx = this.currentPage() * this.itemsPerPageSignal();
    const endIdx = startIdx + this.itemsPerPageSignal();
    return this.allProducts().slice(startIdx, endIdx);
  });

  readonly products = this.allProducts.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  // ========== COMPUTED - Wishlist ==========
  readonly isWishlistLoading = computed(() => this.wishlistService.isLoading());

  // ========== COMPUTED - Cart ==========
  readonly isCartLoading = computed(() => this.cartService.isLoading());

  constructor() {
    effect(() => {
      const currentProducts = this.visibleProducts();
      setTimeout(() => {
        currentProducts.forEach(product => {
          this.visibleItems.update(set => {
            const newSet = new Set(set);
            newSet.add(product.id);
            return newSet;
          });
        });
      }, 100);
    });
  }

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupResponsiveLayout();
      this.setupIntersectionObserver();

      fromEvent(window, 'resize')
        .pipe(
          debounceTime(300),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.setupResponsiveLayout());
    }

    setTimeout(() => {
      this.visibleProducts().forEach(product => {
        this.visibleItems.update(set => {
          const newSet = new Set(set);
          newSet.add(product.id);
          return newSet;
        });
      });
    }, 300);
  }

  // ========== MÉTODOS PÚBLICOS - WISHLIST ==========

  /**
   * ✅ Verifica si un producto está en wishlist
   */
  isProductInWishlist(productId: string): boolean {
    return this.wishlistService.isProductInWishlist(productId);
  }

  /**
   * ✅ Maneja el toggle de wishlist con toda la lógica
   */
  handleToggleWishlist(productId: string): void {
    console.log('❤️ Destacados - Toggle Wishlist:', productId);

    // 1️⃣ Verificar autenticación
    if (!this.authService.isAuthenticated() || !this.authService.hasValidToken()) {
      console.warn('❌ Usuario NO autenticado');
      this.router.navigate(['/login']);
      return;
    }

    // 2️⃣ Verificar estado actual
    const isInWishlist = this.wishlistService.isProductInWishlist(productId);

    // 3️⃣ Ejecutar acción
    if (isInWishlist) {
      this.removeFromWishlist(productId);
    } else {
      this.addToWishlist(productId);
    }
  }

  // ========== MÉTODOS PRIVADOS - WISHLIST ==========

  private addToWishlist(productId: string): void {
    const product = this.allProducts().find(p => p.id === productId);

    this.wishlistService.addToWishlist({
      productId,
      note: product ? `Me gusta ${product.name}` : '',
      visibility: 'private'
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        console.log('✅ Producto agregado a wishlist:', response.message);
      },
      error: (error) => {
        console.error('❌ Error al agregar a wishlist:', error);
        const errorMessage = error?.error?.message || 'No se pudo agregar a favoritos';
        alert(errorMessage);
      }
    });
  }

  private removeFromWishlist(productId: string): void {
    this.wishlistService.removeFromWishlist(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('✅ Producto removido de wishlist:', response.message);
        },
        error: (error) => {
          console.error('❌ Error al remover de wishlist:', error);
          const errorMessage = error?.error?.message || 'No se pudo remover de favoritos';
          alert(errorMessage);
        }
      });
  }

  // ========== MÉTODOS PÚBLICOS - CART ==========

  /**
   * ✅ Verifica si un producto está en el carrito
   */
  isProductInCart(productId: string): boolean {
    return this.cartService.isProductInCart(productId);
  }

  /**
   * ✅ Obtiene la cantidad de un producto en el carrito
   */
  getProductQuantityInCart(productId: string): number {
    return this.cartService.getProductQuantity(productId);
  }

  /**
   * ✅ Maneja agregar producto al carrito con toda la lógica
   */
  handleAddToCart(productId: string): void {
    console.log('🛒 Destacados - Intentando agregar al carrito:', productId);

    // 1️⃣ Verificar autenticación
    if (!this.authService.isAuthenticated() || !this.authService.hasValidToken()) {
      console.warn('❌ Usuario NO autenticado');
      this.router.navigate(['/login']);
      return;
    }

    // 2️⃣ Verificar si ya está en el carrito
    if (this.cartService.isProductInCart(productId)) {
      console.warn('⚠️ El producto ya está en el carrito');
      alert('Este producto ya está en tu carrito. Ve al carrito para modificar la cantidad.');
      this.router.navigate(['/cart']);
      return;
    }

    // 3️⃣ Obtener información del producto
    const product = this.allProducts().find(p => p.id === productId);

    if (!product) {
      console.error('❌ Producto no encontrado');
      return;
    }

    // 4️⃣ Validar disponibilidad
    if (!product.isAvailable || product.stock <= 0) {
      console.warn('⚠️ Producto no disponible');
      alert(`Lo sentimos, "${product.name}" no está disponible en este momento.`);
      return;
    }

    // 5️⃣ Agregar al carrito
    this.addToCart(productId, product.name);
  }

  // ========== MÉTODOS PRIVADOS - CART ==========

  private addToCart(productId: string, productName: string): void {
    this.cartService.addToCart({
      productId,
      quantity: 1,
      note: `Agregado desde destacados: ${productName}`
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        console.log('✅ Producto agregado al carrito:', response.message);
        
        const shouldGoToCart = confirm(
          `"${productName}" se agregó al carrito.\n\n¿Quieres ir al carrito?`
        );
        
        if (shouldGoToCart) {
          this.router.navigate(['/cart']);
        }
      },
      error: (error) => {
        console.error('❌ Error al agregar al carrito:', error);
        const errorMessage = error?.error?.message || 'No se pudo agregar el producto al carrito';
        alert(errorMessage);
      }
    });
  }

  // ========== MÉTODOS PÚBLICOS - PRODUCTS ==========

  loadFeaturedProducts(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.productsService.getFeaturedProducts(12)
      .pipe(
        catchError(error => {
          console.error('Error loading featured products:', error);
          this.error.set('Error al cargar los productos destacados');
          this.isLoading.set(false);
          return of({ success: false, data: [], message: 'Error', meta: null, filters: null });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allProducts.set(response.data);
            this.isLoading.set(false);
          } else {
            this.error.set('No se pudieron cargar los productos destacados');
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          console.error('Subscription error:', error);
          this.error.set('Error al cargar los productos destacados');
          this.isLoading.set(false);
        }
      });
  }

  // ========== MÉTODOS PÚBLICOS - UI ==========

  onImageLoad(productId: string): void {
    this.loadedImages.update(set => {
      const newSet = new Set(set);
      newSet.add(productId);
      return newSet;
    });
  }

  isProductVisible(productId: string): boolean {
    return this.visibleItems().has(productId);
  }

  isImageLoaded(productId: string): boolean {
    return this.loadedImages().has(productId);
  }

  // ========== MÉTODOS PÚBLICOS - CAROUSEL ==========

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPageSignal.update(page => page + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPageSignal.update(page => page - 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPageSignal.set(page);
    }
  }

  isFirstPage(): boolean {
    return this.currentPage() === 0;
  }

  isLastPage(): boolean {
    return this.currentPage() === this.totalPages() - 1;
  }

  // ========== MÉTODOS PRIVADOS ==========

  private setupResponsiveLayout(): void {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large
      ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.itemsPerPageSignal.set(1);
        } else if (result.breakpoints[Breakpoints.Small] || result.breakpoints[Breakpoints.Medium]) {
          this.itemsPerPageSignal.set(2);
        } else {
          this.itemsPerPageSignal.set(4);
        }

        if (this.currentPage() >= this.totalPages()) {
          this.goToPage(this.totalPages() - 1);
        }
      });
  }

  private setupIntersectionObserver(): void {
    if (!this.productCards) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('data-product-id');
        if (entry.isIntersecting && id) {
          this.visibleItems.update(set => {
            const newSet = new Set(set);
            newSet.add(id);
            return newSet;
          });
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    this.productCards.forEach(card => {
      const element = card.nativeElement;
      const productId = element.getAttribute('data-product-id');
      if (productId) {
        this.observer?.observe(element);
      }
    });
  }
}
