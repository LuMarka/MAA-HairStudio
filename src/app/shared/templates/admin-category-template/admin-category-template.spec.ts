import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCategoryTemplate } from './admin-category-template';

describe('AdminCategoryTemplate', () => {
  let component: AdminCategoryTemplate;
  let fixture: ComponentFixture<AdminCategoryTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoryTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCategoryTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
