import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCartTemplate } from './admin-cart-template';

describe('AdminCartTemplate', () => {
  let component: AdminCartTemplate;
  let fixture: ComponentFixture<AdminCartTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCartTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCartTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
