import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MethodePay } from './methode-pay';

describe('MethodePay', () => {
  let component: MethodePay;
  let fixture: ComponentFixture<MethodePay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MethodePay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MethodePay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
