import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileTemplate } from './profile-template';

describe('ProfileTemplate', () => {
  let component: ProfileTemplate;
  let fixture: ComponentFixture<ProfileTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
