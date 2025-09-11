import { Component } from '@angular/core';
import { ProductsTemplate } from "../../shared/templates/products-template/products-template";

@Component({
  selector: 'app-products',
  imports: [ProductsTemplate],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products {

}
