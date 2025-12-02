
import { Component } from '@angular/core';
import { AdminCategoryTemplate } from '../../shared/templates/admin-category-template/admin-category-template';
import { Router } from '@angular/router';



@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AdminCategoryTemplate],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard {
  constructor(private router: Router) {}

  goToProductsPanel() {
    this.router.navigate(['/admin/products']);
  }
}
