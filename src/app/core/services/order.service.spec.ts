import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OrderService, CheckoutState } from './order.service';
import { environment } from '../../../environments/environment';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}orders`;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(OrderService);
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

    it('should start with empty orders', () => {
      expect(service.orders()).toEqual([]);
      expect(service.hasOrders()).toBeFalse();
    });

    it('should not be loading', () => {
      expect(service.isLoading()).toBeFalse();
    });

    it('should not have active checkout', () => {
      expect(service.hasActiveCheckout()).toBeFalse();
    });
  });

  describe('checkout state management', () => {
    it('should init checkout with pickup type', () => {
      service.initCheckout('pickup');

      expect(service.hasActiveCheckout()).toBeTrue();
      expect(service.checkoutDeliveryType()).toBe('pickup');
      expect(service.isPickupCheckout()).toBeTrue();
      expect(service.isDeliveryCheckout()).toBeFalse();
    });

    it('should init checkout with delivery type and address', () => {
      service.initCheckout('delivery', 'address-123');

      expect(service.hasActiveCheckout()).toBeTrue();
      expect(service.checkoutDeliveryType()).toBe('delivery');
      expect(service.isDeliveryCheckout()).toBeTrue();
      expect(service.checkoutAddressId()).toBe('address-123');
    });

    it('should persist checkout state in localStorage', () => {
      service.initCheckout('delivery', 'addr-1');

      const stored = localStorage.getItem('maa_checkout_state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.deliveryType).toBe('delivery');
      expect(parsed.selectedAddressId).toBe('addr-1');
    });

    it('should update checkout address', () => {
      service.initCheckout('delivery', 'addr-1');
      service.updateCheckoutAddress('addr-2');

      expect(service.checkoutAddressId()).toBe('addr-2');
    });

    it('should not update address for pickup checkout', () => {
      service.initCheckout('pickup');
      service.updateCheckoutAddress('addr-1');

      expect(service.checkoutAddressId()).toBeNull();
    });

    it('should clear checkout state', () => {
      service.initCheckout('delivery', 'addr-1');
      expect(service.hasActiveCheckout()).toBeTrue();

      service.clearCheckoutState();

      expect(service.hasActiveCheckout()).toBeFalse();
      expect(service.checkoutDeliveryType()).toBeNull();
      expect(localStorage.getItem('maa_checkout_state')).toBeNull();
    });

    it('should detect expired checkout', () => {
      // Manually set expired state
      const expiredState: CheckoutState = {
        deliveryType: 'pickup',
        timestamp: Date.now() - (31 * 60 * 1000) // 31 minutos atrás
      };
      localStorage.setItem('maa_checkout_state', JSON.stringify(expiredState));

      // Recreate service to pick up the expired state
      const freshService = TestBed.inject(OrderService);

      expect(freshService.hasActiveCheckout()).toBeFalse();
    });

    it('should validate checkout correctly', () => {
      expect(service.validateCheckout()).toBeFalse();

      service.initCheckout('pickup');
      expect(service.validateCheckout()).toBeTrue();
    });

    it('should return correct delivery type via getCheckoutDeliveryType', () => {
      expect(service.getCheckoutDeliveryType()).toBeNull();

      service.initCheckout('delivery');
      expect(service.getCheckoutDeliveryType()).toBe('delivery');
    });
  });

  describe('createOrderFromCart', () => {
    it('should call POST /orders/from-cart', () => {
      const orderData = { deliveryType: 'pickup' as const, notes: 'test' };

      service.createOrderFromCart(orderData).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/from-cart`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(orderData);
      req.flush({
        data: { orderNumber: 'ORD-001', deliveryType: 'pickup', total: 5000 },
        meta: { requiresShippingCost: false }
      });
    });

    it('should set loading during request', () => {
      service.createOrderFromCart({ deliveryType: 'pickup' }).subscribe();

      expect(service.isLoading()).toBeTrue();

      httpMock.expectOne(`${apiUrl}/from-cart`).flush({
        data: { orderNumber: 'ORD-001' },
        meta: {}
      });

      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('getMyOrders', () => {
    const mockOrdersResponse = {
      data: [
        { id: '1', orderNumber: 'ORD-001', status: 'pending' },
        { id: '2', orderNumber: 'ORD-002', status: 'confirmed' }
      ],
      meta: { total: 2, page: 1, totalPages: 1 }
    };

    it('should call GET /orders/my-orders', () => {
      service.getMyOrders().subscribe();

      const req = httpMock.expectOne(r => r.url === `${apiUrl}/my-orders`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrdersResponse);
    });

    it('should update orders state', () => {
      service.getMyOrders().subscribe();
      httpMock.expectOne(r => r.url === `${apiUrl}/my-orders`).flush(mockOrdersResponse);

      expect(service.orders().length).toBe(2);
      expect(service.hasOrders()).toBeTrue();
    });

    it('should pass pagination params', () => {
      service.getMyOrders({ page: 2, limit: 5 }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${apiUrl}/my-orders`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('5');
      req.flush(mockOrdersResponse);
    });

    it('should compute filtered orders by status', () => {
      const ordersWithStatuses = {
        data: [
          { id: '1', status: 'pending' },
          { id: '2', status: 'pending' },
          { id: '3', status: 'confirmed' },
          { id: '4', status: 'delivered' }
        ],
        meta: { total: 4, page: 1, totalPages: 1 }
      };

      service.getMyOrders().subscribe();
      httpMock.expectOne(r => r.url === `${apiUrl}/my-orders`).flush(ordersWithStatuses);

      expect(service.pendingOrders().length).toBe(2);
      expect(service.confirmedOrders().length).toBe(1);
      expect(service.deliveredOrders().length).toBe(1);
    });
  });

  describe('pagination computed', () => {
    it('should compute pagination state correctly', () => {
      const response = {
        data: [{ id: '1' }],
        meta: { total: 30, page: 2, totalPages: 3 }
      };

      service.getMyOrders({ page: 2 }).subscribe();
      httpMock.expectOne(r => r.url === `${apiUrl}/my-orders`).flush(response);

      expect(service.currentPage()).toBe(2);
      expect(service.totalPages()).toBe(3);
      expect(service.hasNextPage()).toBeTrue();
      expect(service.hasPreviousPage()).toBeTrue();
    });
  });
});
