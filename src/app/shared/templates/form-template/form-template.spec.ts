import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTemplate } from './form-template';

describe('FormTemplate', () => {
  let component: FormTemplate;
  let fixture: ComponentFixture<FormTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
