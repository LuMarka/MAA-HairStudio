import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ProductDetail } from '../../organisms/product-detail/product-detail';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detail-product-template',
  imports: [ProductDetail, CommonModule],
  templateUrl: './detail-product-template.html',
  styleUrl: './detail-product-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailProductTemplate {

}
