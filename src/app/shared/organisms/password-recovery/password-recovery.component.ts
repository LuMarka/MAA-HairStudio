import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    output,
    signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

type RecoveryState = 'FORM' | 'SUCCESS' | 'ERROR';

interface RecoveryFormData {
  email: string;
}

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-recovery.component.html',
  styleUrls: ['./password-recovery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordRecoveryComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly backToLogin = output<void>();

  // Estado local
  private readonly currentState = signal<RecoveryState>('FORM');
  private readonly isLoading = signal(false);
  private readonly errorMessage = signal<string | null>(null);
  private readonly successEmail = signal<string>('');

  // Formulario reactivo
  private readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Getters
  readonly recoveryForm = this.form;
  readonly state = this.currentState.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly error = this.errorMessage.asReadonly();
  readonly successEmailValue = this.successEmail.asReadonly();

  // Validaciones
  private readonly emailControl = this.form.get('email');

  readonly isFormValid = computed(() => {
    const valid = this.form.valid && !this.isLoading();
    return valid;
  });

  readonly emailError = computed(() => {
    const control = this.emailControl;
    if (!control) return null;
    if (!control.touched) return null;
    if (control.hasError('required')) return 'El correo es requerido';
    if (control.hasError('email')) return 'Ingresa un correo válido';
    return null;
  });

  constructor() {
    this.setupFormValueChanges();
  }

  private setupFormValueChanges(): void {
    this.emailControl?.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.errorMessage()) {
          this.errorMessage.set(null);
        }
      });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.emailControl?.markAsTouched();
      return;
    }

    const formData = this.form.value as RecoveryFormData;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Simulación de llamada al backend (80% éxito, 20% error)
    setTimeout(() => {
      const success = Math.random() > 0.2;
      
      if (success) {
        this.successEmail.set(formData.email);
        this.currentState.set('SUCCESS');
      } else {
        this.errorMessage.set(
          'Hubo un error al procesar tu solicitud. Inténtalo de nuevo.'
        );
      }
      
      this.isLoading.set(false);
    }, 1400);

    //Descomentar cuando el backend esté listo
   // this.authService.requestPasswordReset(formData.email)
  // .pipe(takeUntilDestroyed())
 // .subscribe({
//  next: () => {
    //   this.successEmail.set(formData.email);
     //  this.currentState.set('SUCCESS');
      // this.isLoading.set(false);
    //  },
 // error: (err) => {
   //     this.errorMessage.set(
 //    err?.error?.message ?? 'Hubo un error al procesar tu solicitud.'
   //     );
   // this.isLoading.set(false);
   //    }
   //  });
//  }
  }

  onBackToLogin(): void {
    this.resetForm();
    this.backToLogin.emit();
  }

  onResetForm(): void {
    this.resetForm();
    this.currentState.set('FORM');
  }

  private resetForm(): void {
    this.form.reset();
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.successEmail.set('');
  }
}