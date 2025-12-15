import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { OrdersHistory } from "../../organisms/orders-history/orders-history";
import { OrderDetail } from "../../organisms/order-detail/order-detail";

@Component({
  selector: 'app-orders-user-template',
  imports: [OrdersHistory, OrderDetail],
  templateUrl: './orders-user-template.html',
  styleUrl: './orders-user-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersUserTemplate {
  readonly selectedOrderId = signal<string | null>(null);

  onOrderSelected(orderId: string): void {
    this.selectedOrderId.set(orderId);
  }

  onBackToHistory(): void {
    this.selectedOrderId.set(null);
  }
}
