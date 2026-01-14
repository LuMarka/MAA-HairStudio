import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAbandonedCartsTemplate } from './admin-abandoned-carts-template';
import { CartService } from '../../../core/services/cart.service';
import { of } from 'rxjs';
import type { AbandonedCartsResponse } from '../../../core/models/interfaces/cart.interface';

describe('AdminAbandonedCartsTemplate', () => {
  let component: AdminAbandonedCartsTemplate;
  let fixture: ComponentFixture<AdminAbandonedCartsTemplate>;
  let cartService: jasmine.SpyObj<CartService>;

  // Mock data
  const mockAbandonedCartsResponse: AbandonedCartsResponse = {
    success: true,
    message: 'Carritos abandonados obtenidos',
    data: [
      {
        id: 'uuid-cart-1',
        user: {
          id: 'uuid-user-1',
          email: 'cliente@email.com',
          name: 'Juan Pérez',
        },
        status: 'abandoned',
        totalAmount: 45500.0,
        totalItems: 3,
        lastActivityAt: new Date('2026-01-12T15:30:00.000Z'),
        createdAt: new Date('2026-01-10T10:00:00.000Z'),
        items: [
          {
            id: 'item-1',
            product: {
              id: 'uuid-product-1',
              name: 'Shampoo Profesional 500ml',
              image: '/images/shampoo.jpg',
              price: 15000,
              slug: 'shampoo-profesional',
            },
            quantity: 2,
            unitPrice: 15000,
            subtotal: 30000,
          },
          {
            id: 'item-2',
            product: {
              id: 'uuid-product-2',
              name: 'Acondicionador Reparador 300ml',
              image: '/images/acondicionador.jpg',
              price: 12500,
              slug: 'acondicionador-reparador',
            },
            quantity: 1,
            unitPrice: 12500,
            subtotal: 12500,
          },
        ],
      },
    ],
    meta: {
      total: 25,
      page: 1,
      limit: 10,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: false,
    },
  };

  beforeEach(async () => {
    const cartServiceSpy = jasmine.createSpyObj('CartService', ['getAbandonedCarts']);

    await TestBed.configureTestingModule({
      imports: [AdminAbandonedCartsTemplate],
      providers: [
        {
          provide: CartService,
          useValue: cartServiceSpy,
        },
      ],
    }).compileComponents();

    cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
    fixture = TestBed.createComponent(AdminAbandonedCartsTemplate);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load abandoned carts on init', (done) => {
    cartService.getAbandonedCarts.and.returnValue(of(mockAbandonedCartsResponse));

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.abandonedCarts().length).toBe(1);
      expect(component.totalPages()).toBe(3);
      expect(component.stats().totalAbandonedCarts).toBe(25);
      done();
    }, 100);
  });

  it('should transform abandoned cart data correctly', (done) => {
    cartService.getAbandonedCarts.and.returnValue(of(mockAbandonedCartsResponse));

    fixture.detectChanges();

    setTimeout(() => {
      const cart = component.abandonedCarts()[0];

      expect(cart.id).toBe('uuid-cart-1');
      expect(cart.userEmail).toBe('cliente@email.com');
      expect(cart.userName).toBe('Juan Pérez');
      expect(cart.totalAmount).toBe(45500);
      expect(cart.items.length).toBe(2);

      done();
    }, 100);
  });

  it('should handle modal operations', () => {
    cartService.getAbandonedCarts.and.returnValue(of(mockAbandonedCartsResponse));

    fixture.detectChanges();

    const cart = component.abandonedCarts()[0];

    component.onViewCart(cart);
    expect(component.showCartModal()).toBe(true);
    expect(component.selectedCart()).toBe(cart);

    component.onCloseModal();
    expect(component.showCartModal()).toBe(false);
    expect(component.selectedCart()).toBeNull();
  });

  it('should display statistics cards', (done) => {
    cartService.getAbandonedCarts.and.returnValue(of(mockAbandonedCartsResponse));

    fixture.detectChanges();

    setTimeout(() => {
      const cards = component.statsCards();
      expect(cards.length).toBe(4);
      expect(cards[0].title).toBe('Carritos Abandonados');
      expect(cards[1].title).toBe('Ingresos Potenciales');

      done();
    }, 100);
  });
});
