import { Component } from '@angular/core';
import { PurchaseOrderTemplate } from "../../shared/templates/purchase-order-template/purchase-order-template";

@Component({
  selector: 'app-purchase-order',
  imports: [PurchaseOrderTemplate],
  templateUrl: './purchase-order.html',
  styleUrl: './purchase-order.scss'
})
export class PurchaseOrder {

}
