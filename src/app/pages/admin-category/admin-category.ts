import { Component } from '@angular/core';
import { AdminCategoryTemplate } from "../../shared/templates/admin-category-template/admin-category-template";

@Component({
  selector: 'app-admin-category',
  imports: [AdminCategoryTemplate],
  templateUrl: './admin-category.html',
  styleUrl: './admin-category.scss'
})
export class AdminCategory {

}
