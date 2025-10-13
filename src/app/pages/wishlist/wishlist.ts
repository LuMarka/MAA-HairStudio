import { Component } from '@angular/core';
import { WishlistTemplate } from "../../shared/templates/wishlist-template/wishlist-template";

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [WishlistTemplate],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss'
})
export class Wishlist {

}
