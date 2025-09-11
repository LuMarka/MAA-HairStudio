import { Component } from '@angular/core';
import { AdminProductsTemplate } from "../../shared/templates/admin-products-template/admin-products-template";

@Component({
  selector: 'app-admin-products',
  imports: [AdminProductsTemplate],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.scss'
})
export class AdminProducts {

}
