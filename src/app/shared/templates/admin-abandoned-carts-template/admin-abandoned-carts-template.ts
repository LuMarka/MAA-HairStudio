import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import type { AbandonedCartsResponse, AbandonedCart as AbandonedCartInterface } from '../../../core/models/interfaces/cart.interface';
import { StatsCard, StatsCardData } from '../../molecules/stats-card/stats-card';

interface AbandonedCart {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'abandoned';
  totalAmount: number;
  totalItems: number;
  lastActivityAt: string;
  createdAt: string;
  abandonedSince: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface AbandonmentStats {
  totalAbandonedCarts: number;
  potentialRevenue: number;
  abandonmentRate?: string;
  conversionRate?: string;
}

@Component({
  selector: 'app-admin-abandoned-carts-template',
  standalone: true,
  imports: [CommonModule, StatsCard],
  templateUrl: './admin-abandoned-carts-template.html',
  styleUrl: './admin-abandoned-carts-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAbandonedCartsTemplate implements OnInit {
  private readonly cartService = inject(CartService);

  // State
  readonly isLoading = signal(false);
  readonly abandonedCarts = signal<AbandonedCart[]>([]);
  readonly stats = signal<AbandonmentStats>({
    totalAbandonedCarts: 0,
    potentialRevenue: 0,
    abandonmentRate: '0%',
    conversionRate: '0%',
  });
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly hoursThreshold = signal<number | null>(null);
  readonly selectedCart = signal<AbandonedCart | null>(null);
  readonly showCartModal = signal(false);

  // Computed
  readonly statsCards = computed((): StatsCardData[] => {
    const s = this.stats();
    return [
      {
        title: 'Carritos Abandonados',
        value: s.totalAbandonedCarts,
        subtitle: 'Carritos sin completar',
        icon: '🛒',
        color: 'warning',
        loading: this.isLoading(),
      },
      {
        title: 'Ingresos Potenciales',
        value: this.formatPrice(s.potentialRevenue),
        subtitle: 'Valor en carritos abandonados',
        icon: '💰',
        color: 'warning',
        loading: this.isLoading(),
      },
      {
        title: 'Tasa de Abandono',
        value: s.abandonmentRate || '0%',
        subtitle: 'Porcentaje de carrito abandonados',
        icon: '📊',
        color: 'info',
        loading: this.isLoading(),
      },
      {
        title: 'Tasa de Conversión',
        value: s.conversionRate || '0%',
        subtitle: 'Carritos convertidos a orden',
        icon: '✅',
        color: 'success',
        loading: this.isLoading(),
      },
    ];
  });

  ngOnInit(): void {
    this.loadAbandonedCarts();
  }

  private loadAbandonedCarts(): void {
    this.isLoading.set(true);

    const hours = this.hoursThreshold();
    this.cartService
      .getAbandonedCarts(hours ?? undefined, {
        page: this.currentPage(),
        limit: 20,
      })
      .subscribe({
        next: (response: AbandonedCartsResponse) => {
          const transformedCarts: AbandonedCart[] = response.data.map((cart: any) => ({
            id: cart.id,
            userId: cart.userId || cart.user?.id || 'N/A',
            userEmail: cart.userEmail || cart.user?.email || 'N/A',
            userName: cart.userName || cart.user?.name || 'Usuario',
            status: 'abandoned' as const,
            totalAmount: cart.totalAmount,
            totalItems: cart.totalItems,
            lastActivityAt: new Date(cart.lastActivityAt).toISOString(),
            createdAt: new Date(cart.createdAt).toISOString(),
            abandonedSince: this.calculateAbandondedTime(cart.lastActivityAt),
            items: (cart.items || []).map((item: any) => ({
              productId: item.productId || 'N/A',
              productName: item.productName || 'Desconocido',
              quantity: item.quantity || 0,
              unitPrice: parseFloat(item.unitPrice) || 0,
            })),
          }));

          this.abandonedCarts.set(transformedCarts);
          this.totalPages.set(response.meta.totalPages);
          this.stats.set({
            totalAbandonedCarts: response.meta.total,
            potentialRevenue: transformedCarts.reduce((sum, cart) => sum + cart.totalAmount, 0),
            abandonmentRate: '0%',
            conversionRate: '0%',
          });
        },
        error: (error: unknown) => {
          console.error('Error loading abandoned carts:', error);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  private calculateAbandondedTime(date: Date | string): string {
    const cartDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - cartDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} día${diffDays > 1 ? 's' : ''} ${diffHours}h`;
    }
    return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  }

  onViewCart(cart: AbandonedCart): void {
    this.selectedCart.set(cart);
    this.showCartModal.set(true);
  }

  onCloseModal(): void {
    this.showCartModal.set(false);
    this.selectedCart.set(null);
  }

  onPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadAbandonedCarts();
    }
  }

  onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadAbandonedCarts();
    }
  }

  onChangeHours(hours: number | null): void {
    this.hoursThreshold.set(hours);
    this.currentPage.set(1);
    this.loadAbandonedCarts();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price);
  }

  getCartItemsTotal(cart: AbandonedCart): number {
    return cart.items.reduce((acc, item) => acc + item.quantity, 0);
  }
}
