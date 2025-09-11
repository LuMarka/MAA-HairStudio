import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWishlistTemplate } from './admin-wishlist-template';

describe('AdminWishlistTemplate', () => {
  let component: AdminWishlistTemplate;
  let fixture: ComponentFixture<AdminWishlistTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWishlistTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminWishlistTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
