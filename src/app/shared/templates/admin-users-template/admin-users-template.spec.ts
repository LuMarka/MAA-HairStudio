import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUsersTemplate } from './admin-users-template';

describe('AdminUsersTemplate', () => {
  let component: AdminUsersTemplate;
  let fixture: ComponentFixture<AdminUsersTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminUsersTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
