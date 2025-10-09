import { Component } from '@angular/core';
import { ShoppingCart } from '../../organisms/shopping-cart/shopping-cart';

@Component({
  selector: 'app-cart-template',
  imports: [ShoppingCart],
  templateUrl: './cart-template.html',
  styleUrl: './cart-template.scss'
})
export class CartTemplate {

}
