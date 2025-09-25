import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-brand-cards',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './brand-cards.html',
  styleUrls: ['./brand-cards.scss']
})
export class BrandCards {
  // Datos minimalistas para las dos tarjetas
  cards = [
    { id: 'c1', img: '/images/loreal-professionnel-logo-png_seeklogo-81124.png', alt: 'Ir a la Tienda - Productos', route: '/products' },
    { id: 'c2', img: '/images/Kerastase-logo.png', alt: 'Ir a la Tienda - Ofertas', route: '/products' }
  ];
}
