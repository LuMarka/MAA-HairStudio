import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalInfoForm } from './personal-info-form';

describe('PersonalInfoForm', () => {
  let component: PersonalInfoForm;
  let fixture: ComponentFixture<PersonalInfoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalInfoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalInfoForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
