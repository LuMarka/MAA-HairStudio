import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProductsTemplate } from './admin-products-template';

describe('AdminProductsTemplate', () => {
  let component: AdminProductsTemplate;
  let fixture: ComponentFixture<AdminProductsTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductsTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProductsTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
