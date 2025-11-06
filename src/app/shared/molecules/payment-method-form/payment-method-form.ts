import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-method-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './payment-method-form.html',
  styleUrl: './payment-method-form.scss'
})
export class PaymentMethodForm {
  formGroup = input.required<FormGroup>();
  formChange = output<void>();

  onFormChange(): void {
    this.formChange.emit();
  }
}
