import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepperProgress } from './stepper-progress';

describe('StepperProgress', () => {
  let component: StepperProgress;
  let fixture: ComponentFixture<StepperProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperProgress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepperProgress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
