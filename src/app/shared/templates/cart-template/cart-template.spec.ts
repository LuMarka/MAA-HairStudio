import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartTemplate } from './cart-template';

describe('CartTemplate', () => {
  let component: CartTemplate;
  let fixture: ComponentFixture<CartTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
