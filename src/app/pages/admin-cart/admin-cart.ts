import { Component } from '@angular/core';
import { AdminCartTemplate } from "../../shared/templates/admin-cart-template/admin-cart-template";

@Component({
  selector: 'app-admin-cart',
  imports: [AdminCartTemplate],
  templateUrl: './admin-cart.html',
  styleUrl: './admin-cart.scss'
})
export class AdminCart {

}
