import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderData } from '../../../core/models/interfaces/order.interface';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-orders-history',
  imports: [CommonModule, DatePipe],
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
    const userId = currentUser?.id;

    if (!userId) {
      this.errorMessage.set('No se pudo obtener el ID del usuario');
      this.isLoading.set(false);
      return;
    }

    this.orderService.getAllOrders({ page: this.currentPage(), limit: 20, userId }).subscribe({
      next: (response: unknown) => {
        const data = response as { data: OrderData[] };
        if (data?.data) {
          if (this.currentPage() === 1) {
            this.orders.set(data.data);
          } else {
            this.orders.update(current => [...current, ...data.data]);
          }
        } else {
          this.orders.set([]);
        }
      },
      error: (error: unknown) => {
        console.error('Error loading orders:', error);
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
}
