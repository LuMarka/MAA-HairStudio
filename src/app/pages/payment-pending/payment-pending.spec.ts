import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentPending } from './payment-pending';

describe('PaymentPending', () => {
  let component: PaymentPending;
  let fixture: ComponentFixture<PaymentPending>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentPending]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentPending);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
