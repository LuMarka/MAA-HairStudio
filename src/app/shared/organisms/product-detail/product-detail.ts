import { Component, computed, effect, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { Datum } from '../../../core/models/interfaces/Product.interface';

type ProductTab = 'details' | 'specs';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetail implements OnInit {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);

  readonly product = signal<Datum | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly quantity = signal(1);
  readonly selectedImage = signal('');
  readonly activeTab = signal<ProductTab>('details');
  readonly imageLoadError = signal(false);

  readonly priceWithoutTax = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct) return 0;
    return currentProduct.price / 1.21;
  });

  readonly hasDiscount = computed(() => {
    const currentProduct = this.product();
    return currentProduct ? currentProduct.originalPrice > currentProduct.price : false;
  });

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

  constructor() {
    effect(() => {
      const currentProduct = this.product();
      if (currentProduct) {
        const imageToShow = this.mainImage();
        this.selectedImage.set(imageToShow);
        this.imageLoadError.set(false);
      }
    });
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    
    if (productId) {
      this.loadProduct(productId);
    } else {
      this.error.set('ID de producto no válido');
    }
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.productsService.getProductById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.product.set(response.data);
          /* this.incrementViews(id); */
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

  /* private incrementViews(productId: string): void {
    this.productsService.incrementProductViews(productId).subscribe();
  } */

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

  incrementQuantity(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;
    
    const maxQuantity = currentProduct.stock;
    this.quantity.update(q => q < maxQuantity ? q + 1 : q);
  }

  decrementQuantity(): void {
    this.quantity.update(q => q > 1 ? q - 1 : 1);
  }

  selectTab(tab: ProductTab): void {
    this.activeTab.set(tab);
  }

  addToCart(): void {
    const currentProduct = this.product();
    if (!currentProduct || !this.inStock()) return;

    // TODO: Implementar servicio de carrito
  }

  goBack(): void {
    this.location.back();
  }

  reloadProduct(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    }
  }

  canIncrementQuantity(): boolean {
    const currentProduct = this.product();
    return currentProduct ? this.quantity() < currentProduct.stock : false;
  }
}
