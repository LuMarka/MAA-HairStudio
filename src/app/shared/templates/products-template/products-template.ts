import { Component } from '@angular/core';
import { ProductosComponent } from '../../organisms/productos/productos';

@Component({
  selector: 'app-products-template',
  imports: [ProductosComponent],
  templateUrl: './products-template.html',
  styleUrl: './products-template.scss'
})
export class ProductsTemplate {

}
