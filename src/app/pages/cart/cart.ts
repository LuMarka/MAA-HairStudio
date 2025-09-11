import { Component } from '@angular/core';
import { CartTemplate } from "../../shared/templates/cart-template/cart-template";

@Component({
  selector: 'app-cart',
  imports: [CartTemplate],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart {

}
