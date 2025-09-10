import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCart } from './admin-cart';

describe('AdminCart', () => {
  let component: AdminCart;
  let fixture: ComponentFixture<AdminCart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
