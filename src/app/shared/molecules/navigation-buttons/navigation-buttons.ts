import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-navigation-buttons',
  templateUrl: './navigation-buttons.html',
  styleUrl: './navigation-buttons.scss'
})
export class NavigationButtons {
  // Inputs
  currentStep = input.required<number>();
  totalSteps = input.required<number>();
  canProceed = input<boolean>(true);

  // Outputs
  previous = output<void>();
  next = output<void>();

  get showPreviousButton() {
    return this.currentStep() > 1;
  }

  get isLastStep() {
    return this.currentStep() === this.totalSteps();
  }

  get nextButtonText() {
    return this.isLastStep ? 'Finalizar Pedido' : 'Continuar';
  }

  onPrevious() {
    this.previous.emit();
  }

  onNext() {
    this.next.emit();
  }
}
