import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, Output, EventEmitter } from '@angular/core';
import { OrderData } from '../../../core/models/interfaces/order.interface';
import { OrderService } from '../../../core/services/order.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-orders-history',
  imports: [DatePipe],
  templateUrl: './orders-history.html',
  styleUrl: './orders-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersHistory implements OnInit {
  private readonly orderService = inject(OrderService);

  @Output() onViewDetails = new EventEmitter<string>();

  readonly orders = signal<OrderData[]>([]);
  readonly isLoading = computed(() => this.orderService.isLoading());
  readonly errorMessage = computed(() => this.orderService.errorMessage());
  readonly hasNextPage = computed(() => this.orderService.hasNextPage());
  readonly currentPage = signal(1);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.orderService.getMyOrders({
      page: this.currentPage(),
      limit: 10
    }).subscribe({
      next: (response) => {
        if (this.currentPage() === 1) {
          this.orders.set(response.data);
        } else {
          this.orders.update(current => [...current, ...response.data]);
        }
      }
    });
  }

  onLoadMore(): void {
    this.currentPage.update(page => page + 1);
    this.loadOrders();
  }

  viewOrderDetails(orderId: string): void {
    console.log('📤 Emitiendo onViewDetails con orderId:', orderId);
    this.onViewDetails.emit(orderId);
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'processing': 'En Proceso',
      'shipped': 'Enviada',
      'delivered': 'Entregada',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }

  getDeliveryLabel(deliveryType: string): string {
    const labels: { [key: string]: string } = {
      'delivery': 'Envío a Domicilio',
      'pickup': 'Retiro en Local'
    };
    return labels[deliveryType] || deliveryType;
  }
}
