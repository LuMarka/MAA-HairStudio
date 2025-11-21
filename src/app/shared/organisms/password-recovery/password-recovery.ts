import { Component, inject, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-recovery.html',
  styleUrl: './password-recovery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordRecovery {
  // Usar output() para emitir eventos
  readonly goToLogin = output<void>();

  private readonly fb = inject(FormBuilder);

  // Usar signals para el estado
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly step = signal<'email' | 'code' | 'password'>('email'); // Paso del flujo
  readonly successMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Estados de visibilidad de contraseña
  readonly newPasswordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  submitEmail(): void {
    const emailControl = this.form.get('email');
    if (!emailControl || emailControl.invalid) {
      emailControl?.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // TODO: Implementar llamada al servicio para enviar email de recuperación
    setTimeout(() => {
      this.loading.set(false);
      this.step.set('code');
      this.successMessage.set('Se ha enviado un código a tu correo');
    }, 1500);
  }

  submitCode(): void {
    const codeControl = this.form.get('code');
    if (!codeControl || codeControl.invalid) {
      codeControl?.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // TODO: Implementar validación del código
    setTimeout(() => {
      this.loading.set(false);
      this.step.set('password');
    }, 1500);
  }

  submitNewPassword(): void {
    const newPasswordControl = this.form.get('newPassword');
    const confirmPasswordControl = this.form.get('confirmPassword');

    if (!newPasswordControl || !confirmPasswordControl) {
      return;
    }

    newPasswordControl.markAsTouched();
    confirmPasswordControl.markAsTouched();

    if (newPasswordControl.invalid || confirmPasswordControl.invalid) {
      return;
    }

    if (newPasswordControl.value !== confirmPasswordControl.value) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // TODO: Implementar cambio de contraseña
    setTimeout(() => {
      this.loading.set(false);
      this.successMessage.set('Contraseña actualizada exitosamente');
      setTimeout(() => {
        this.onBackToLogin();
      }, 1500);
    }, 1500);
  }

  toggleNewPasswordVisibility(): void {
    this.newPasswordVisible.update(current => !current);
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update(current => !current);
  }

  onBackToLogin(): void {
    this.goToLogin.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.form.reset();
    this.step.set('email');
    this.error.set(null);
    this.successMessage.set(null);
    this.newPasswordVisible.set(false);
    this.confirmPasswordVisible.set(false);
  }
}
