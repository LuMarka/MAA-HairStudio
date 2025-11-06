import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentMethodForm } from './payment-method-form';

describe('PaymentMethodForm', () => {
  let component: PaymentMethodForm;
  let fixture: ComponentFixture<PaymentMethodForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentMethodForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentMethodForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
