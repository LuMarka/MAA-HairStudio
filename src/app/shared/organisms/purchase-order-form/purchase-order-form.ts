import { Component, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PersonalInfoForm } from '../../molecules/personal-info-form/personal-info-form';
import { PaymentMethodForm } from '../../molecules/payment-method-form/payment-method-form';
import { OrderConfirmation } from '../../molecules/order-confirmation/order-confirmation';
import { NavigationButtons } from '../../molecules/navigation-buttons/navigation-buttons';

@Component({
  selector: 'app-purchase-order-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PersonalInfoForm,
    PaymentMethodForm,
    OrderConfirmation,
    NavigationButtons
  ],
  templateUrl: './purchase-order-form.html',
  styleUrl: './purchase-order-form.scss'
})
export class PurchaseOrderForm {
  // Inputs
  currentStep = input.required<number>();

  // Outputs
  validationChange = output<boolean>();
  dataChange = output<any>();
  nextStep = output<void>();
  previousStep = output<void>();

  // Signals
  private fb = new FormBuilder();
  formData = signal<any>(null);
  private formValidState = signal<boolean>(false);

  // Formularios
  personalInfoForm: FormGroup;
  paymentForm: FormGroup;

  constructor() {
    // Inicializar formularios
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+54|54)?[0-9]{8,12}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[A-Z]?\d{4}[A-Z]{0,3}$/)]],
      notes: ['']
    });

    this.paymentForm = this.fb.group({
      paymentMethod: ['', [Validators.required]]
    });

    // Configurar listeners
    this.personalInfoForm.valueChanges.subscribe(() => {
      this.updateValidation();
    });

    this.personalInfoForm.statusChanges.subscribe(() => {
      this.updateValidation();
    });

    this.paymentForm.valueChanges.subscribe(() => {
      this.updateValidation();
    });

    this.paymentForm.statusChanges.subscribe(() => {
      this.updateValidation();
    });

    // Effect para monitorear validación cuando cambia el paso
    effect(() => {
      const step = this.currentStep();
      console.log('Current step changed to:', step);
      this.updateValidation();
    });
  }

  // Computed para validación
  canProceed = computed(() => {
    const step = this.currentStep();
    const isValid = this.formValidState();

    console.log('=== canProceed computed ===');
    console.log('Step:', step);
    console.log('Form valid state:', isValid);

    return isValid;
  });

  private updateValidation(): void {
    const step = this.currentStep();
    let isValid = false;
    let data = {};

    switch (step) {
      case 1:
        isValid = this.personalInfoForm.valid;
        data = this.personalInfoForm.value;
        console.log('=== Step 1 - Personal Info Form ===');
        console.log('Valid:', isValid);
        console.log('Value:', data);
        console.log('Errors:', this.getFormErrors(this.personalInfoForm));
        console.log('Form status:', this.personalInfoForm.status);
        break;
      case 2:
        isValid = this.paymentForm.valid;
        data = {
          ...this.personalInfoForm.value,
          ...this.paymentForm.value
        };
        console.log('=== Step 2 - Payment Form ===');
        console.log('Valid:', isValid);
        break;
      case 3:
        isValid = true;
        data = {
          ...this.personalInfoForm.value,
          ...this.paymentForm.value
        };
        console.log('=== Step 3 - Confirmation ===');
        break;
    }

    this.formData.set(data);
    this.formValidState.set(isValid);
    this.validationChange.emit(isValid);
    this.dataChange.emit(data);
  }

  private getFormErrors(formGroup: FormGroup): Record<string, any> {
    const errors: Record<string, any> = {};
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control?.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  onFormChange(): void {
    this.updateValidation();
  }

  onNext(): void {
    if (this.canProceed()) {
      this.nextStep.emit();
    }
  }

  onPrevious(): void {
    this.previousStep.emit();
  }
}
