import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWishlist } from './admin-wishlist';

describe('AdminWishlist', () => {
  let component: AdminWishlist;
  let fixture: ComponentFixture<AdminWishlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWishlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminWishlist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
