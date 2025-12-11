import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersUser } from './orders-user';

describe('OrdersUser', () => {
  let component: OrdersUser;
  let fixture: ComponentFixture<OrdersUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
