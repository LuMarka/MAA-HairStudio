import { Component, input, computed } from '@angular/core';
import { StepperProgress } from '../../molecules/stepper-progress/stepper-progress';

@Component({
  selector: 'app-purchase-order-header',
  imports: [StepperProgress],
  templateUrl: './purchase-order-header.html',
  styleUrl: './purchase-order-header.scss'
})
export class PurchaseOrderHeader {
  // Inputs usando la nueva API de signals
  currentStep = input.required<number>();
  totalSteps = input.required<number>();

  // Computed para el progreso
  progressPercentage = computed(() =>
    (this.currentStep() / this.totalSteps()) * 100
  );

  // Configuración de pasos
  steps = [
    {
      id: 1,
      title: 'Información Personal',
      description: 'Datos de contacto y entrega'
    },
    {
      id: 2,
      title: 'Método de Pago',
      description: 'Selecciona tu forma de pago'
    },
    {
      id: 3,
      title: 'Confirmación',
      description: 'Revisa y confirma tu pedido'
    }
  ];
}
