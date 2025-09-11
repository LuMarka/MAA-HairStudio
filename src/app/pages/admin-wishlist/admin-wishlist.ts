import { Component } from '@angular/core';
import { AdminWishlistTemplate } from "../../shared/templates/admin-wishlist-template/admin-wishlist-template";

@Component({
  selector: 'app-admin-wishlist',
  imports: [AdminWishlistTemplate],
  templateUrl: './admin-wishlist.html',
  styleUrl: './admin-wishlist.scss'
})
export class AdminWishlist {

}
