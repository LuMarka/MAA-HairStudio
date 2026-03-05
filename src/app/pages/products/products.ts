import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProductsTemplate } from "../../shared/templates/products-template/products-template";


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-products',
  imports: [ProductsTemplate],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products   {

}
