import { Component } from '@angular/core';
import { OrdersUserTemplate } from "../../shared/templates/orders-user-template/orders-user-template";

@Component({
  selector: 'app-orders-user',
  imports: [OrdersUserTemplate],
  templateUrl: './orders-user.html',
  styleUrl: './orders-user.scss'
})
export class OrdersUser {

}
