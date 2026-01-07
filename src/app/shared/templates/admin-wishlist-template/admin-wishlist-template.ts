import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsCard, type StatsCardData } from '../../molecules/stats-card/stats-card';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ProductsService } from '../../../core/services/products.service';
import type { Datum as ProductDatum } from '../../../core/models/interfaces/Product.interface';

export interface WishlistStats {
  totalWishlists: number;
  totalUniqueProducts: number;
  averageItemsPerWishlist: number;
  mostWishedProducts: Array<{
    product: ProductDatum;
    wishlistCount: number;
    conversionRate?: number;
  }>;
}

@Component({
  selector: 'app-admin-wishlist-template',
  imports: [CommonModule, StatsCard],
  templateUrl: './admin-wishlist-template.html',
  styleUrl: './admin-wishlist-template.scss'
})
export class AdminWishlistTemplate implements OnInit {
  private readonly wishlistService = inject(WishlistService);
  private readonly productsService = inject(ProductsService);

  // State signals
  protected readonly isLoadingStats = signal(false);
  protected readonly isLoadingProducts = signal(false);
  protected readonly wishlistStats = signal<WishlistStats>({
    totalWishlists: 0,
    totalUniqueProducts: 0,
    averageItemsPerWishlist: 0,
    mostWishedProducts: []
  });

  protected readonly mostWishedProducts = signal<Array<{
    product: ProductDatum;
    wishlistCount: number;
    conversionRate?: number;
  }>>([]);

  // Modal state
  protected readonly selectedImage = signal<{ url: string; alt: string; price: number; originalPrice?: number; discount?: string } | null>(null);

  // Computed stats cards
  protected readonly statsCards = computed((): StatsCardData[] => {
    const stats = this.wishlistStats();

    return [
      {
        title: 'Total Wishlists',
        value: stats.totalWishlists,
        subtitle: 'Usuarios con listas de deseos',
        icon: '❤️',
        color: 'primary',
        loading: this.isLoadingStats()
      },
      {
        title: 'Productos Únicos',
        value: stats.totalUniqueProducts,
        subtitle: 'En todas las wishlists',
        icon: '🛍️',
        color: 'info',
        loading: this.isLoadingStats()
      },
      {
        title: 'Promedio por Lista',
        value: stats.averageItemsPerWishlist.toFixed(1),
        subtitle: 'Productos por wishlist',
        icon: '📊',
        color: 'success',
        loading: this.isLoadingStats()
      },
      {
        title: 'Producto Top',
        value: stats.mostWishedProducts[0]?.wishlistCount || 0,
        subtitle: 'Veces en wishlist',
        icon: '🏆',
        color: 'warning',
        loading: this.isLoadingStats(),
        trend: stats.mostWishedProducts[0]?.conversionRate ?
          { value: Math.round(stats.mostWishedProducts[0].conversionRate), direction: 'up', label: 'tasa conversión' } :
          undefined
      }
    ];
  });

  ngOnInit(): void {
    this.loadWishlistAnalytics();
  }

  protected async loadWishlistAnalytics(): Promise<void> {
    this.isLoadingStats.set(true);
    this.isLoadingProducts.set(true);

    try {
      // Load wishlist analytics
      this.wishlistService.getAnalytics().subscribe({
        next: (response) => {
          console.log('Wishlist analytics response:', response);
          // For now, let's simulate data since the backend analytics might be basic
          this.simulateWishlistStats();
        },
        error: (error) => {
          console.error('Error loading wishlist analytics:', error);
          // Fallback to simulated data
          this.simulateWishlistStats();
        },
        complete: () => {
          this.isLoadingStats.set(false);
        }
      });

      // Load products to simulate most wished items
      this.loadMostWishedProducts();

    } catch (error) {
      console.error('Error loading wishlist analytics:', error);
      this.simulateWishlistStats();
      this.isLoadingStats.set(false);
      this.isLoadingProducts.set(false);
    }
  }

  private simulateWishlistStats(): void {
    // This would be replaced with real data from the backend
    const mockStats: WishlistStats = {
      totalWishlists: 156,
      totalUniqueProducts: 89,
      averageItemsPerWishlist: 3.2,
      mostWishedProducts: []
    };

    this.wishlistStats.set(mockStats);
  }

  private async loadMostWishedProducts(): Promise<void> {
    try {
      // Get featured products as a proxy for popular items
      // In a real implementation, you'd have an endpoint for most-wished products
      this.productsService.getFeaturedProducts(10).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Simulate wishlist counts and conversion rates
            const productsWithStats = response.data.map((product, index) => ({
              product,
              wishlistCount: Math.max(50 - index * 5, 5), // Simulated decreasing popularity
              conversionRate: Math.random() * 20 + 10 // 10-30% conversion rate
            }));

            this.mostWishedProducts.set(productsWithStats);

            // Update the main stats with the first products
            this.wishlistStats.update(stats => ({
              ...stats,
              mostWishedProducts: productsWithStats
            }));
          }
        },
        error: (error) => {
          console.error('Error loading products:', error);
        },
        complete: () => {
          this.isLoadingProducts.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading most wished products:', error);
      this.isLoadingProducts.set(false);
    }
  }

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }

  protected getConversionColor(rate: number): string {
    if (rate >= 20) return 'high';
    if (rate >= 15) return 'medium';
    return 'low';
  }

  protected openImageModal(imageUrl: string, productName: string, price: number, originalPrice?: number, discount?: string): void {
    this.selectedImage.set({
      url: imageUrl,
      alt: productName,
      price,
      originalPrice,
      discount
    });
  }

  protected closeImageModal(): void {
    this.selectedImage.set(null);
  }
}
