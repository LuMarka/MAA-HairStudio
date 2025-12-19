import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-pending',
  templateUrl: './payment-pending.html',
  styleUrls: ['./payment-pending.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class PaymentPending implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly _orderId = signal<number | null>(null);
  protected readonly _paymentId = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const orderId = params['order'];
      const paymentId = params['payment_id'];

      if (orderId) this._orderId.set(Number(orderId));
      if (paymentId) this._paymentId.set(paymentId);
    });
  }

  protected goToOrders(): void {
    this.router.navigate(['/order-me']);
  }

  protected goToHome(): void {
    this.router.navigate(['/']);
  }
}
