import { Component, computed, effect, input, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ProductDetailModel } from '../../../core/models/product.model';

// Definimos la tupla para los tabs
type ProductTab = 'details' | 'specs';


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetail {
  /**
   * Input (signal) requerido para el producto.
   * El componente no se renderizará sin esto.
   */
  product = input.required<ProductDetailModel>();

  // --- Estado Local de la UI (gestionado con Signals) ---

  /** Signal para la cantidad seleccionada */
  quantity = signal(1);

  /** Signal para la URL de la imagen principal mostrada */
  selectedImage = signal<string>('');

  /** Signal para el tab de información activa */
  activeTab = signal<ProductTab>('details');

  /**
   * Precio calculado sin impuestos (asumiendo IVA del 21% en Argentina).
   * Este se recalcula si el 'price' del producto cambia.
   */
  priceWithoutTax = computed(() => {
    const p = this.product();
    if (!p) return 0;
    // Asumimos que 'price' (precio final) incluye IVA (21%)
    return p.price / 1.21;
  });

  /**
   * Efecto (effect) que se ejecuta cuando el input 'product' cambia.
   * Se usa para inicializar la imagen seleccionada.
   */
  constructor() {
    effect(() => {
      const currentProduct = this.product();
      if (currentProduct?.images?.length > 0) {
        // Establece la primera imagen del carrusel como la principal
        this.selectedImage.set(currentProduct.images[0]);
      }
    });
  }

  // --- Métodos de Interacción de la UI ---

  /** Cambia la imagen principal al hacer clic en un thumbnail */
  changeImage(imageUrl: string): void {
    this.selectedImage.set(imageUrl);
  }

  /** Incrementa la cantidad del producto */
  incrementQuantity(): void {
    this.quantity.update((q) => q + 1);
  }

  /** Decrementa la cantidad, con un mínimo de 1 */
  decrementQuantity(): void {
    this.quantity.update((q) => (q > 1 ? q - 1 : 1));
  }

  /** Selecciona el tab de información (Detalles o Especificaciones) */
  selectTab(tab: ProductTab): void {
    this.activeTab.set(tab);
  }

  /** Maneja el evento de añadir al carrito */
  addToCart(): void {
    // Aquí iría la lógica para emitir un evento o llamar a un servicio
    console.log('AÑADIR AL CARRITO:', {
      product: this.product().name,
      quantity: this.quantity(),
    });
  }
}
