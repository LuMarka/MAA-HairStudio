import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPersonalData } from './form-personal-data';

describe('FormPersonalData', () => {
  let component: FormPersonalData;
  let fixture: ComponentFixture<FormPersonalData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPersonalData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPersonalData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
