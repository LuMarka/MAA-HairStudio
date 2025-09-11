import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsTemplate } from './products-template';

describe('ProductsTemplate', () => {
  let component: ProductsTemplate;
  let fixture: ComponentFixture<ProductsTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
