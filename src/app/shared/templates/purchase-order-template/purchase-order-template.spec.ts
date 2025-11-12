import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseOrderTemplate } from './purchase-order-template';

describe('PurchaseOrderTemplate', () => {
  let component: PurchaseOrderTemplate;
  let fixture: ComponentFixture<PurchaseOrderTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseOrderTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseOrderTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
