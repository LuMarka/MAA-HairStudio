import { Component } from '@angular/core';
import { ProductsTemplate } from "../../shared/templates/products-template/products-template";



interface Product{
  id: number;
  name: string;
  brand: 'Loreal' | 'Kerastase';
  collection: string; // en lugar de familia
  type: string;       // shampoo, conditioner, etc.
  description: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-products',
  imports: [ProductsTemplate],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products   {

}
