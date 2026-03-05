import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import type { CartInterface, CartActionResponse, Summary } from '../models/interfaces/cart.interface';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const baseUrl = `${environment.apiUrl}cart`;

  const mockSummary: Summary = {
    totalItems: 2,
    totalQuantity: 3,
    subtotal: 5000,
    totalDiscount: 500,
    totalAmount: 4500,
    estimatedTax: 0,
    estimatedShipping: 0,
    estimatedTotal: 4500
  };

  const mockCartData: CartInterface = {
    success: true,
    message: 'ok',
    data: [
      {
        id: 'item-1',
        quantity: 2,
        product: { id: 'prod-1', name: 'Shampoo Kérastase', price: 2000, finalPrice: 1800, slug: 'shampoo-kerastase', images: ['img.jpg'] } as any,
        unitPrice: '1800',
        originalPrice: '2000',
        subtotal: 3600,
        totalDiscount: 400,
        isOnSale: true,
        note: '',
        addedAt: new Date(),
        lastModifiedAt: new Date()
      },
      {
        id: 'item-2',
        quantity: 1,
        product: { id: 'prod-2', name: 'Acondicionador', price: 1400, finalPrice: 1400, slug: 'acondicionador', images: ['img2.jpg'] } as any,
        unitPrice: '1400',
        originalPrice: '1400',
        subtotal: 1400,
        totalDiscount: 0,
        isOnSale: false,
        note: '',
        addedAt: new Date(),
        lastModifiedAt: new Date()
      }
    ],
    summary: mockSummary,
    meta: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    cart: {} as any
  };

  const mockCartAction: CartActionResponse = {
    success: true,
    message: 'ok',
    action: 'added',
    cart: mockCartData
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'hasValidToken',
      'getToken'
    ]);
    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.hasValidToken.and.returnValue(false);

    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    });

    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with empty cart', () => {
      expect(service.cart()).toBeNull();
      expect(service.items()).toEqual([]);
      expect(service.hasItems()).toBeFalse();
      expect(service.isEmpty()).toBeTrue();
    });

    it('should start with zero totals', () => {
      expect(service.totalItems()).toBe(0);
      expect(service.totalQuantity()).toBe(0);
      expect(service.subtotal()).toBe(0);
      expect(service.totalAmount()).toBe(0);
    });

    it('should not be loading initially', () => {
      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('getCart', () => {
    it('should call GET /cart', () => {
      service.getCart().subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockCartData);
    });

    it('should update cart state after fetching', () => {
      service.getCart().subscribe();

      httpMock.expectOne(baseUrl).flush(mockCartData);

      expect(service.cart()).toEqual(mockCartData);
      expect(service.items().length).toBe(2);
      expect(service.hasItems()).toBeTrue();
      expect(service.isEmpty()).toBeFalse();
    });

    it('should compute summary values from cart data', () => {
      service.getCart().subscribe();

      httpMock.expectOne(baseUrl).flush(mockCartData);

      expect(service.totalItems()).toBe(2);
      expect(service.totalQuantity()).toBe(3);
      expect(service.subtotal()).toBe(5000);
      expect(service.totalAmount()).toBe(4500);
    });

    it('should pass pagination params', () => {
      service.getCart({ page: 2, limit: 5 }).subscribe();

      const req = httpMock.expectOne(r => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('5');
      req.flush(mockCartData);
    });

    it('should handle errors', () => {
      service.getCart().subscribe({ error: () => {} });

      httpMock.expectOne(baseUrl).flush({}, { status: 500, statusText: 'Error' });

      expect(service.errorMessage()).toBeTruthy();
    });
  });

  describe('addToCart', () => {
    it('should call POST /cart/add', () => {
      service.addToCart({ productId: 'prod-1', quantity: 1 }).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/add`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ productId: 'prod-1', quantity: 1 });
      req.flush(mockCartAction);
    });

    it('should update cart state after adding', () => {
      service.addToCart({ productId: 'prod-1', quantity: 1 }).subscribe();

      httpMock.expectOne(`${baseUrl}/add`).flush(mockCartAction);

      expect(service.items().length).toBe(2);
    });
  });

  describe('updateCart', () => {
    it('should call PATCH /cart/update when product is in cart', () => {
      // First, populate the cart
      service.getCart().subscribe();
      httpMock.expectOne(baseUrl).flush(mockCartData);

      // Then update
      service.updateCart({ productId: 'prod-1', quantity: 3, action: 'set' }).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/update`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockCartAction);
    });

    it('should fail when product is not in cart', () => {
      service.updateCart({ productId: 'not-in-cart', quantity: 1, action: 'set' }).subscribe({
        error: (err) => expect(err.message).toContain('no está en el carrito')
      });
    });
  });

  describe('removeFromCart', () => {
    it('should call DELETE /cart/remove/:id when product is in cart', () => {
      service.getCart().subscribe();
      httpMock.expectOne(baseUrl).flush(mockCartData);

      service.removeFromCart('prod-1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/remove/prod-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockCartAction);
    });

    it('should fail when product is not in cart', () => {
      service.removeFromCart('not-in-cart').subscribe({
        error: (err) => expect(err.message).toContain('no está en el carrito')
      });
    });
  });

  describe('clearCart', () => {
    it('should call DELETE /cart/clear', () => {
      service.clearCart().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/clear`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockCartAction);
    });
  });

  describe('incrementQuantity / decrementQuantity', () => {
    beforeEach(() => {
      service.getCart().subscribe();
      httpMock.expectOne(baseUrl).flush(mockCartData);
    });

    it('should call updateCart with increment action', () => {
      service.incrementQuantity('prod-1', 1).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/update`);
      expect(req.request.body).toEqual({ productId: 'prod-1', quantity: 1, action: 'increment' });
      req.flush(mockCartAction);
    });

    it('should call updateCart with decrement action', () => {
      service.decrementQuantity('prod-1', 1).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/update`);
      expect(req.request.body).toEqual({ productId: 'prod-1', quantity: 1, action: 'decrement' });
      req.flush(mockCartAction);
    });
  });

  describe('isProductInCart', () => {
    it('should return false before loading cart', () => {
      expect(service.isProductInCart('prod-1')).toBeFalse();
    });

    it('should return true for products in cart', () => {
      service.getCart().subscribe();
      httpMock.expectOne(baseUrl).flush(mockCartData);

      expect(service.isProductInCart('prod-1')).toBeTrue();
      expect(service.isProductInCart('prod-2')).toBeTrue();
    });

    it('should return false for products not in cart', () => {
      service.getCart().subscribe();
      httpMock.expectOne(baseUrl).flush(mockCartData);

      expect(service.isProductInCart('prod-999')).toBeFalse();
    });
  });

  describe('getProductQuantity', () => {
    it('should return 0 for products not in cart', () => {
      expect(service.getProductQuantity('prod-999')).toBe(0);
    });

    it('should return correct quantity', () => {
      service.getCart().subscribe();
      httpMock.expectOne(baseUrl).flush(mockCartData);

      expect(service.getProductQuantity('prod-1')).toBe(2);
      expect(service.getProductQuantity('prod-2')).toBe(1);
    });
  });

  describe('resetState', () => {
    it('should reset all state to initial values', () => {
      service.getCart().subscribe();
      httpMock.expectOne(baseUrl).flush(mockCartData);

      expect(service.hasItems()).toBeTrue();

      service.resetState();

      expect(service.cart()).toBeNull();
      expect(service.items()).toEqual([]);
      expect(service.isLoading()).toBeFalse();
      expect(service.errorMessage()).toBeNull();
    });
  });
});
