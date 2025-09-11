import { Component } from '@angular/core';
import { AdminSalesTemplate } from "../../shared/templates/admin-sales-template/admin-sales-template";

@Component({
  selector: 'app-admin-sales',
  imports: [AdminSalesTemplate],
  templateUrl: './admin-sales.html',
  styleUrl: './admin-sales.scss'
})
export class AdminSales {

}
