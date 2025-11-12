import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseOrderSummary } from './purchase-order-summary';

describe('PurchaseOrderSummary', () => {
  let component: PurchaseOrderSummary;
  let fixture: ComponentFixture<PurchaseOrderSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseOrderSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseOrderSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
