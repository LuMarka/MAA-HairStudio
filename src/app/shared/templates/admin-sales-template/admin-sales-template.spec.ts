import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSalesTemplate } from './admin-sales-template';

describe('AdminSalesTemplate', () => {
  let component: AdminSalesTemplate;
  let fixture: ComponentFixture<AdminSalesTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSalesTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSalesTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
