import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ProductDetail } from '../../organisms/product-detail/product-detail';
import { CommonModule } from '@angular/common';
import { ProductDetailModel } from '../../../core/models/product.model';

@Component({
  selector: 'app-detail-product-template',
  imports: [ProductDetail, CommonModule],
  templateUrl: './detail-product-template.html',
  styleUrl: './detail-product-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailProductTemplate {

  readonly productData = signal<ProductDetailModel | null>(null);

  constructor() {
    setTimeout(() => {
      this.productData.set({
        id: '123',
        name: 'Shampoo Bomba Carbón Purificante',
        volume: '400',
        originalPrice: 5900,
        price: 2950,
        description:
          'El Shampoo Bomba Carbón Purificante de Inecto es ideal para cabellos secos o dañados. Su fórmula con carbón activado limpia profundamente el cuero cabelludo, eliminando impurezas y toxinas, mientras nutre e hidrata la fibra capilar.',
        desiredResult: 'Nutrición profunda y purificación',
        type_hair: 'Seco o dañado',
        category: 'INECTO',
        images: [
          'public/images/ale.jpg', // Main image
          'public/images/ale.jpg', // Side view
          'public/images/ale.jpg', // Back view
          'public/images/ale.jpg', // Different angle - Changed to avoid duplicate
        ],
      });
    }, 1000);
  }
}
