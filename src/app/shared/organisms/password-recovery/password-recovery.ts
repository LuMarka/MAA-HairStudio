import { Component, inject, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';

type RecoveryStep = 'email' | 'code' | 'password';

/**
 * Componente para recuperación de contraseña (3 pasos)
 * 
 * @responsibility Gestionar el flujo de recuperación de contraseña
 * @step1 Email - Solicitar código de recuperación
 * @step2 Code - Verificar código de 6 dígitos
 * @step3 Password - Establecer nueva contraseña
 * 
 * @example
 * ```html
 * <app-password-recovery (goToLogin)="navigateToLogin()"></app-password-recovery>
 * ```
 */
@Component({
  selector: 'app-password-recovery',
  imports: [ReactiveFormsModule],
  templateUrl: './password-recovery.html',
  styleUrl: './password-recovery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordRecovery {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);

  // ========== OUTPUTS ==========
  readonly goToLogin = output<void>();

  // ========== SIGNALS - Estado del flujo ==========
  readonly step = signal<RecoveryStep>('email');
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly emailSent = signal<string | null>(null);

  // ========== SIGNALS - Visibilidad de contraseñas ==========
  readonly newPasswordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  // ========== COMPUTED - Estado del servicio ==========
  readonly loading = computed(() => this.usersService.isLoading());
  readonly serviceError = computed(() => this.usersService.errorMessage());

  // ========== FORM ==========
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  // ========== COMPUTED - Validaciones ==========
  readonly isEmailValid = computed(() => this.form.get('email')?.valid ?? false);
  readonly isCodeValid = computed(() => this.form.get('code')?.valid ?? false);

  readonly isPasswordValid = computed(() => {
    const newPassword = this.form.get('newPassword');
    const confirmPassword = this.form.get('confirmPassword');
    return (
      newPassword?.valid &&
      confirmPassword?.valid &&
      newPassword.value === confirmPassword.value
    );
  });

  readonly passwordsMatch = computed(() => {
    const newPassword = this.form.get('newPassword');
    const confirmPassword = this.form.get('confirmPassword');
    if (!newPassword?.value || !confirmPassword?.value) return true;
    return newPassword.value === confirmPassword.value;
  });

  readonly canSubmitEmail = computed(() => this.isEmailValid() && !this.loading());
  readonly canSubmitCode = computed(() => this.isCodeValid() && !this.loading());
  readonly canSubmitPassword = computed(() => 
    this.isPasswordValid() && this.passwordsMatch() && !this.loading()
  );

  // ========== PASO 1: Solicitar código ==========

  /**
   * Envía el email para solicitar código de recuperación
   */
  submitEmail(): void {
    const emailControl = this.form.get('email');
    
    if (!emailControl || emailControl.invalid) {
      emailControl?.markAsTouched();
      this.error.set('Por favor, ingresa un email válido');
      return;
    }

    const email = emailControl.value;
    if (!email) {
      this.error.set('Email requerido');
      return;
    }

    this.error.set(null);
    this.successMessage.set(null);

    this.usersService.forgotPassword({ email }).subscribe({
      next: (response) => {
        console.log('✅ [PasswordRecovery] Código enviado:', response.message);
        this.emailSent.set(email);
        this.step.set('code');
        this.successMessage.set(
          `Se ha enviado un código de 6 dígitos a ${email}. Válido por ${response.expiresInMinutes} minutos.`
        );
        this.error.set(null);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Error al enviar el código. Intenta nuevamente.';
        this.error.set(errorMsg);
        console.error('❌ [PasswordRecovery] Error al solicitar código:', err);
      }
    });
  }

  // ========== PASO 2: Verificar código ==========

  /**
   * Verifica si el código ingresado es válido
   */
  submitCode(): void {
    const codeControl = this.form.get('code');
    
    if (!codeControl || codeControl.invalid) {
      codeControl?.markAsTouched();
      this.error.set('El código debe tener exactamente 6 dígitos numéricos');
      return;
    }

    const code = codeControl.value;
    if (!code) {
      this.error.set('Código requerido');
      return;
    }

    this.error.set(null);
    this.successMessage.set(null);

    this.usersService.verifyResetCode({ code }).subscribe({
      next: (response) => {
        console.log('✅ [PasswordRecovery] Código verificado:', response.valid);
        
        if (response.valid) {
          this.step.set('password');
          this.successMessage.set('Código verificado. Ahora ingresa tu nueva contraseña.');
          this.error.set(null);
        } else {
          this.error.set('El código ingresado no es válido o ha expirado');
        }
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Código inválido o expirado';
        this.error.set(errorMsg);
        console.error('❌ [PasswordRecovery] Error al verificar código:', err);
      }
    });
  }

  // ========== PASO 3: Nueva contraseña ==========

  /**
   * Resetea la contraseña con el código verificado
   */
  submitNewPassword(): void {
    const newPasswordControl = this.form.get('newPassword');
    const confirmPasswordControl = this.form.get('confirmPassword');
    const codeControl = this.form.get('code');

    if (!newPasswordControl || !confirmPasswordControl || !codeControl) {
      this.error.set('Error en el formulario');
      return;
    }

    newPasswordControl.markAsTouched();
    confirmPasswordControl.markAsTouched();

    if (newPasswordControl.invalid) {
      this.error.set('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (confirmPasswordControl.invalid) {
      this.error.set('Confirma tu contraseña correctamente');
      return;
    }

    if (newPasswordControl.value !== confirmPasswordControl.value) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    const code = codeControl.value;
    const newPassword = newPasswordControl.value;

    if (!code || !newPassword) {
      this.error.set('Datos incompletos');
      return;
    }

    this.error.set(null);
    this.successMessage.set(null);

    this.usersService.resetPassword({ code, newPassword }).subscribe({
      next: (response) => {
        console.log('✅ [PasswordRecovery] Contraseña actualizada:', response.message);
        this.successMessage.set('¡Contraseña actualizada exitosamente! Redirigiendo al login...');
        this.error.set(null);

        this.usersService.clearError();

        setTimeout(() => {
          this.onBackToLogin();
        }, 2000);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Error al actualizar la contraseña';
        this.error.set(errorMsg);
        console.error('❌ [PasswordRecovery] Error al resetear contraseña:', err);
      }
    });
  }

  // ========== NAVEGACIÓN ==========

  /**
   * Vuelve al paso anterior
   */
  goToPreviousStep(): void {
    this.error.set(null);
    this.successMessage.set(null);
    this.usersService.clearError();

    if (this.step() === 'code') {
      this.step.set('email');
      this.form.get('code')?.reset();
    } else if (this.step() === 'password') {
      this.step.set('code');
      this.form.get('newPassword')?.reset();
      this.form.get('confirmPassword')?.reset();
    }
  }

  /**
   * Reenvía el código al email
   */
  resendCode(): void {
    const emailControl = this.form.get('email');
    const email = emailControl?.value;

    if (!email) {
      this.error.set('No se pudo reenviar el código. Intenta desde el inicio.');
      return;
    }

    this.error.set(null);
    this.successMessage.set(null);

    this.usersService.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.successMessage.set(
          `Código reenviado a ${email}. Válido por ${response.expiresInMinutes} minutos.`
        );
        this.error.set(null);
        console.log('✅ [PasswordRecovery] Código reenviado exitosamente');
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Error al reenviar el código';
        this.error.set(errorMsg);
        console.error('❌ [PasswordRecovery] Error al reenviar código:', err);
      }
    });
  }

  /**
   * Regresa al login y resetea el formulario
   */
  onBackToLogin(): void {
    this.resetForm();
    this.usersService.clearError();
    this.goToLogin.emit();
  }

  // ========== UI HELPERS ==========

  /**
   * Alterna visibilidad de la nueva contraseña
   */
  toggleNewPasswordVisibility(): void {
    this.newPasswordVisible.update(current => !current);
  }

  /**
   * Alterna visibilidad de confirmar contraseña
   */
  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update(current => !current);
  }

  /**
   * Valida y limita el input del código a 6 dígitos numéricos
   */
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    const truncated = value.slice(0, 6);

    if (truncated !== input.value) {
      input.value = truncated;
      this.form.get('code')?.setValue(truncated, { emitEvent: false });
    }
  }

  /**
   * Obtiene el número del paso actual para el progressbar
   */
  getCurrentStepNumber(): number {
    const stepMap: Record<RecoveryStep, number> = {
      email: 1,
      code: 2,
      password: 3
    };
    return stepMap[this.step()];
  }

  // ========== PRIVATE METHODS ==========
  /**
   * Resetea el formulario al estado inicial
   */
  private resetForm(): void {
    this.form.reset();
    this.step.set('email');
    this.error.set(null);
    this.successMessage.set(null);
    this.emailSent.set(null);
    this.newPasswordVisible.set(false);
    this.confirmPasswordVisible.set(false);
  }
}