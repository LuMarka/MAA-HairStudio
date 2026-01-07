import { Component, input, output, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import type { OrderData, OrderStatus, PaymentStatus } from '../../../core/models/interfaces/order.interface';

export interface OrderTableColumn {
  key: keyof OrderData | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'date' | 'currency' | 'status' | 'badge' | 'actions';
}

@Component({
  selector: 'app-orders-table',
  imports: [CommonModule],
  templateUrl: './orders-table.html',
  styleUrls: ['./orders-table.scss']
})
export class OrdersTable implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private resizeListener?: () => void;

  readonly orders = input.required<OrderData[]>();
  readonly columns = input.required<OrderTableColumn[]>();
  readonly loading = input<boolean>(false);

  readonly onChangeStatus = output<OrderData>();
  readonly onSort = output<{key: string, direction: 'asc' | 'desc'}>();
  readonly onRowClick = output<OrderData>();

  protected sortKey = signal<string | null>(null);
  protected sortDirection = signal<'asc' | 'desc'>('asc');
  protected screenWidth = signal<number>(0);
  protected readonly skeletonRows = Array(5).fill(null);

  // Computed para columnas responsivas
  protected readonly responsiveColumns = computed(() => {
    const width = this.screenWidth();
    const allColumns = this.columns();

    // Definir qué columnas mostrar según el ancho
    if (width <= 510) {
      // Móvil muy pequeño: solo pedido, total y pago
      return allColumns.filter(col =>
        ['orderNumber', 'total', 'paymentStatus'].includes(col.key as string)
      );
    } else if (width <= 768) {
      // Tablet pequeño: agregar fecha
      return allColumns.filter(col =>
        ['orderNumber', 'total', 'paymentStatus', 'createdAt'].includes(col.key as string)
      );
    } else if (width <= 1024) {
      // Tablet: agregar usuario y estado
      return allColumns.filter(col =>
        ['orderNumber', 'user', 'total', 'status', 'paymentStatus', 'createdAt'].includes(col.key as string)
      );
    } else {
      // Desktop: todas las columnas
      return allColumns;
    }
  });

  // Computed para saber si necesitamos mostrar indicador de "más info"
  protected readonly needsModal = computed(() => {
    const width = this.screenWidth();
    return width <= 1024; // Mostrar indicador si no se ven todas las columnas
  });

  ngOnInit(): void {
    this.updateScreenWidth();
    this.setupResizeListener();
  }

  ngOnDestroy(): void {
    if (this.resizeListener) {
      this.document.defaultView?.removeEventListener('resize', this.resizeListener);
    }
  }

  private updateScreenWidth(): void {
    if (this.document.defaultView) {
      this.screenWidth.set(this.document.defaultView.innerWidth);
    }
  }

  private setupResizeListener(): void {
    this.resizeListener = () => this.updateScreenWidth();
    this.document.defaultView?.addEventListener('resize', this.resizeListener);
  }

  protected handleRowClick(order: OrderData): void {
    // Solo emitir click si necesitamos mostrar modal (pantallas pequeñas)
    if (this.needsModal()) {
      this.onRowClick.emit(order);
    }
  }

  protected getCellValue(order: OrderData, key: string): any {
    if (key === 'actions') return '';
    if (key === 'user') return order.user?.name || order.user?.email || 'N/A';
    return (order as any)[key];
  }

  protected formatDate(value: any): string {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected formatCurrency(value: any): string {
    if (!value) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(num);
  }

  protected getStatusClass(status: OrderStatus | PaymentStatus): string {
    const statusMap: Record<string, string> = {
      // Estados de pedido activos
      'pending': 'warning',
      'confirmed': 'info',
      'delivered': 'success',
      'cancelled': 'error',

      // Estados de pago activos
      'approved': 'success',
      'rejected': 'error',

      // Estados de pedido no utilizados actualmente
      // 'processing': 'info',
      // 'ready_pickup': 'success',
      // 'shipped': 'info',
      // 'in_transit': 'info',
      // 'completed': 'success',
      // 'refunded': 'error',

      // Estados de pago no utilizados actualmente
      // 'payment_pending': 'warning',
    };
    return statusMap[status] || 'default';
  }

  protected getStatusLabel(status: OrderStatus | PaymentStatus): string {
    const statusLabels: Record<string, string> = {
      // Estados compartidos (tanto para pedidos como pagos)
      'pending': 'Pendiente',

      // Estados de pedido activos
      'confirmed': 'Completado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado',

      // Estados de pago activos
      'approved': 'Aprobado',
      'rejected': 'Rechazado',

      // Estados de pedido no utilizados actualmente
      // 'processing': 'Preparando',
      // 'ready_pickup': 'Listo para recoger',
      // 'shipped': 'Enviado',
      // 'in_transit': 'En tránsito',
      // 'completed': 'Completado',
      // 'refunded': 'Reembolsado',

      // Estados de pago no utilizados actualmente
      // 'payment_pending': 'Pago pendiente',

      // Estados de pago no utilizados actualmente
      //'payment_pending': 'Pago pendiente',

    };
    return statusLabels[status] || status;
  }

  protected getBadgeClass(value: any): string {
    // Logic for badge classes if needed
    return 'default';
  }

  protected canChangeStatus(order: OrderData): boolean {
    return !['completed', 'cancelled', 'refunded'].includes(order.status);
  }

  protected handleSort(key: string): void {
    const currentKey = this.sortKey();
    let newDirection: 'asc' | 'desc' = 'asc';

    // Si estamos ordenando la misma columna, alternar dirección
    if (currentKey === key) {
      newDirection = this.sortDirection() === 'asc' ? 'desc' : 'asc';
    }

    this.sortKey.set(key);
    this.sortDirection.set(newDirection);
    this.onSort.emit({ key, direction: newDirection });
  }

  protected getSortIcon(columnKey: string): string {
    if (this.sortKey() !== columnKey) return '⇅';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }
}
