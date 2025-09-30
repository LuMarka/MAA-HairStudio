import { Component, Input } from '@angular/core';
import { Products } from '../../organisms/products/products';

interface Product {
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
  selector: 'app-products-template',
  imports: [Products],
  templateUrl: './products-template.html',
  styleUrl: './products-template.scss'
})
export class ProductsTemplate {
  @Input() title!: string;
  @Input() products: Product[] = [];
}

