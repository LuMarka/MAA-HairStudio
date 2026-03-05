import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminProductsTemplate } from "../../shared/templates/admin-products-template/admin-products-template";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-products',
  imports: [AdminProductsTemplate],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.scss'
})
export class AdminProducts {

}
