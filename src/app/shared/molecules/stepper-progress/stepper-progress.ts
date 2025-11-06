import { Component, input, computed } from '@angular/core';

interface Step {
  id: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-stepper-progress',
  templateUrl: './stepper-progress.html',
  styleUrl: './stepper-progress.scss'
})
export class StepperProgress {
  // Inputs
  currentStep = input.required<number>();
  totalSteps = input.required<number>();
  steps = input.required<Step[]>();

  // Computed para determinar el estado de cada paso
  getStepStatus = computed(() => (stepId: number) => {
    const current = this.currentStep();
    if (stepId < current) return 'completed';
    if (stepId === current) return 'current';
    return 'pending';
  });

  // Computed para el progreso porcentual
  progressPercentage = computed(() =>
    ((this.currentStep() - 1) / (this.totalSteps() - 1)) * 100
  );
}
