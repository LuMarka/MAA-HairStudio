import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminAbandonedCartsTemplate } from '../../shared/templates/admin-abandoned-carts-template/admin-abandoned-carts-template';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-abandoned-carts',
  standalone: true,
  imports: [AdminAbandonedCartsTemplate],
  templateUrl: './admin-abandoned-carts.html',
  styleUrl: './admin-abandoned-carts.scss',
})
export class AdminAbandonedCarts {}
