import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseOrderHeader } from './purchase-order-header';

describe('PurchaseOrderHeader', () => {
  let component: PurchaseOrderHeader;
  let fixture: ComponentFixture<PurchaseOrderHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseOrderHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseOrderHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
