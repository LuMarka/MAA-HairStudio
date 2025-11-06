import { Component, input, computed, signal, OnInit } from '@angular/core';
import { CartSummary } from '../../molecules/cart-summary/cart-summary';
import { OrderDetails } from '../../molecules/order-details/order-details';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-purchase-order-summary',
  imports: [CartSummary, OrderDetails, CurrencyPipe],
  templateUrl: './purchase-order-summary.html',
  styleUrl: './purchase-order-summary.scss'
})
export class PurchaseOrderSummary implements OnInit {
  // Inputs
  orderData = input<any>(null);
  currentStep = input.required<number>();

  // Señales para datos simulados del carrito
  cartItems = signal([
    {
      id: 1,
      name: 'Shampoo Reparador Premium',
      price: 45.99,
      quantity: 2,
      image: '/assets/images/products/shampoo-premium.jpg'
    },
    {
      id: 2,
      name: 'Acondicionador Hidratante',
      price: 38.50,
      quantity: 1,
      image: '/assets/images/products/acondicionador.jpg'
    },
    {
      id: 3,
      name: 'Mascarilla Nutritiva',
      price: 62.00,
      quantity: 1,
      image: '/assets/images/products/mascarilla.jpg'
    }
  ]);

  // Computed para cálculos
  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  shipping = computed(() => {
    const subtotal = this.subtotal();
    return subtotal > 100 ? 0 : 15.99; // Envío gratis por compras mayores a $100
  });

  tax = computed(() =>
    this.subtotal() * 0.16 // 16% IVA
  );

  total = computed(() =>
    this.subtotal() + this.shipping() + this.tax()
  );

  // Información adicional
  estimatedDelivery = signal('3-5 días hábiles');

  ngOnInit() {
    // Aquí podrías cargar los datos reales del carrito desde un servicio
    this.loadCartData();
  }

  private loadCartData() {
    // Simulación de carga de datos del carrito
    // En un caso real, esto vendría de un servicio
    console.log('Cargando datos del carrito...');
  }
}
