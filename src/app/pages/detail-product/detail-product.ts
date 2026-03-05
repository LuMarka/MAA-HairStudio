import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DetailProductTemplate } from "../../shared/templates/detail-product-template/detail-product-template";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-detail-product',
  imports: [DetailProductTemplate],
  templateUrl: './detail-product.html',
  styleUrl: './detail-product.scss'
})
export class DetailProduct {

}
