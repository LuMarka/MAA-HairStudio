import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentFailure } from './payment-failure';

describe('PaymentFailure', () => {
  let component: PaymentFailure;
  let fixture: ComponentFixture<PaymentFailure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentFailure]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentFailure);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
