import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderData } from '../../../core/models/interfaces/order.interface';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { DatePipe, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-orders-history',
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './orders-history.html',
  styleUrl: './orders-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersHistory implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);

  readonly onViewDetails = output<string>();

  readonly orders = signal<OrderData[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly currentPage = signal(1);
  readonly hasNextPage = computed(() => this.orders().length >= 10);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const currentUser = this.authService.currentUser();
    if (!currentUser?.id) {
      this.errorMessage.set('No se pudo obtener el ID del usuario');
      this.isLoading.set(false);
      return;
    }

    this.orderService.getMyOrders({ page: this.currentPage(), limit: 20 }).subscribe({
      next: (response) => {
        if (response?.data) {
          if (this.currentPage() === 1) {
            this.orders.set(response.data);
          } else {
            this.orders.update(current => [...current, ...response.data]);
          }
        } else {
          this.orders.set([]);
        }
      },
      error: (error: unknown) => {
        console.error('Error al cargar las órdenes:', error);
        this.errorMessage.set('Error al cargar las órdenes');
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  onLoadMore(): void {
    this.currentPage.update(page => page + 1);
    this.loadOrders();
  }

  viewOrderDetails(orderId: string): void {
    this.onViewDetails.emit(orderId);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'processing': 'En Proceso',
      'shipped': 'Enviada',
      'delivered': 'Entregada',
      'cancelled': 'Cancelada'
    };
    return labels[status] ?? status;
  }

  getDeliveryLabel(deliveryType: string): string {
    const labels: Record<string, string> = {
      'delivery': 'Envío a Domicilio',
      'pickup': 'Retiro en Local'
    };
    return labels[deliveryType] ?? deliveryType;
  }

  /**
   * Calcula el total correcto para una orden específica
   * usando el totalPrice de cada item (monto realmente abonado)
   */
  calculateOrderTotal(order: OrderData): number {
    if (!order?.items || order.items.length === 0) return 0;

    // Usar directamente el totalPrice de cada item (monto realmente abonado)
    const itemsTotal = order.items.reduce((sum, item) => {
      // Usar totalPrice que es el precio total ya calculado correctamente
      const totalPrice = parseFloat(item.totalPrice);
      return sum + totalPrice;
    }, 0);

    // Agregar shipping cost si existe
    const shippingCost = parseFloat(order.shippingCost || '0');
    return itemsTotal + shippingCost;
  }
}
