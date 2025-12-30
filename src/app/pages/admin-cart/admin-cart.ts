import { Component } from '@angular/core';
import { AdminOrdersTemplate } from "../../shared/templates/admin-orders-template/admin-orders-template";

@Component({
  selector: 'app-admin-cart',
  imports: [AdminOrdersTemplate],
  templateUrl: './admin-cart.html',
  styleUrl: './admin-cart.scss'
})
export class AdminCart {

}
