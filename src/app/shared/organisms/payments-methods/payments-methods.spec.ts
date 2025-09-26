import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentsMethods } from './payments-methods';

describe('PaymentsMethods', () => {
  let component: PaymentsMethods;
  let fixture: ComponentFixture<PaymentsMethods>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentsMethods]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentsMethods);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
