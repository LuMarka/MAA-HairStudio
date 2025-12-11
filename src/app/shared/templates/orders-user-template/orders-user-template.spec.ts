import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersUserTemplate } from './orders-user-template';

describe('OrdersUserTemplate', () => {
  let component: OrdersUserTemplate;
  let fixture: ComponentFixture<OrdersUserTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersUserTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersUserTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
