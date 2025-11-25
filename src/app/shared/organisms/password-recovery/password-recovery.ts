import { Component, inject, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { finalize, catchError, throwError } from 'rxjs';

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
  readonly step = signal<'email' | 'code' | 'password'>('email');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly emailSent = signal<string | null>(null); // Email al que se envió el código

  // ========== SIGNALS - Visibilidad de contraseñas ==========
  readonly newPasswordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  // ========== FORM ==========
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  // ========== COMPUTED - Validaciones ==========
  readonly isEmailValid = computed(() => {
    const emailControl = this.form.get('email');
    return emailControl?.valid || false;
  });

  readonly isCodeValid = computed(() => {
    const codeControl = this.form.get('code');
    return codeControl?.valid || false;
  });

  /**
 * Obtiene el número del paso actual para el progressbar
 */
  getCurrentStepNumber(): number {
    switch (this.step()) {
      case 'email': return 1;
      case 'code': return 2;
      case 'password': return 3;
      default: return 1;
    }
  }

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

  readonly canSubmitEmail = computed(() => {
    return this.isEmailValid() && !this.loading();
  });

  readonly canSubmitCode = computed(() => {
    return this.isCodeValid() && !this.loading();
  });

  readonly canSubmitPassword = computed(() => {
    return this.isPasswordValid() && this.passwordsMatch() && !this.loading();
  });

  // ========== MÉTODOS PÚBLICOS - Paso 1: Solicitar código ==========

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

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const email = emailControl.value;
    if (!email) {
      this.error.set('Email requerido');
      this.loading.set(false);
      return;
    }

    this.usersService.forgotPassword({ email })
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          const errorMsg = err?.error?.message || 'Error al enviar el código. Intenta nuevamente.';
          this.error.set(errorMsg);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Código enviado:', response);
          this.emailSent.set(email);
          this.step.set('code');
          this.successMessage.set(
            `Se ha enviado un código de 6 dígitos a ${email}. Válido por ${response.expiresInMinutes} minutos.`
          );
          this.error.set(null);
        },
        error: (err) => {
          console.error('❌ Error al solicitar código:', err);
        }
      });
  }

  // ========== MÉTODOS PÚBLICOS - Paso 2: Verificar código ==========

  /**
   * Verifica si el código ingresado es válido
   */
  submitCode(): void {
    const codeControl = this.form.get('code');
    
    if (!codeControl || codeControl.invalid) {
      codeControl?.markAsTouched();
      this.error.set('El código debe tener exactamente 6 dígitos');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const code = codeControl.value;
    if (!code) {
      this.error.set('Código requerido');
      this.loading.set(false);
      return;
    }

    this.usersService.verifyResetCode({ code })
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          const errorMsg = err?.error?.message || 'Código inválido o expirado';
          this.error.set(errorMsg);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Código verificado:', response);
          
          if (response.valid) {
            this.step.set('password');
            this.successMessage.set('Código verificado. Ahora ingresa tu nueva contraseña.');
            this.error.set(null);
          } else {
            this.error.set('El código ingresado no es válido o ha expirado');
          }
        },
        error: (err) => {
          console.error('❌ Error al verificar código:', err);
        }
      });
  }

  // ========== MÉTODOS PÚBLICOS - Paso 3: Nueva contraseña ==========

  /**
   * Resetea la contraseña con el código verificado
   */
  submitNewPassword(): void {
    const newPasswordControl = this.form.get('newPassword');
    const confirmPasswordControl = this.form.get('confirmPassword');
    const codeControl = this.form.get('code');

    if (!newPasswordControl || !confirmPasswordControl || !codeControl) {
      return;
    }

    newPasswordControl.markAsTouched();
    confirmPasswordControl.markAsTouched();

    if (newPasswordControl.invalid) {
      this.error.set('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (confirmPasswordControl.invalid) {
      this.error.set('Confirma tu contraseña');
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

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.usersService.resetPassword({ code, newPassword })
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          const errorMsg = err?.error?.message || 'Error al actualizar la contraseña';
          this.error.set(errorMsg);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Contraseña actualizada:', response);
          this.successMessage.set('¡Contraseña actualizada exitosamente! Redirigiendo al login...');
          this.error.set(null);

          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.onBackToLogin();
          }, 2000);
        },
        error: (err) => {
          console.error('❌ Error al resetear contraseña:', err);
        }
      });
  }

  // ========== MÉTODOS PÚBLICOS - Navegación ==========

  /**
   * Vuelve al paso anterior
   */
  goToPreviousStep(): void {
    this.error.set(null);
    this.successMessage.set(null);

    if (this.step() === 'code') {
      this.step.set('email');
    } else if (this.step() === 'password') {
      this.step.set('code');
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

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.usersService.forgotPassword({ email })
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          this.error.set('Error al reenviar el código');
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set(
            `Código reenviado a ${email}. Válido por ${response.expiresInMinutes} minutos.`
          );
        }
      });
  }

  /**
   * Regresa al login y resetea el formulario
   */
  onBackToLogin(): void {
    this.goToLogin.emit();
    this.resetForm();
  }

  // ========== MÉTODOS PÚBLICOS - UI ==========

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
   * Valida que solo se ingresen números en el campo de código
   */
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    
    if (value !== input.value) {
      input.value = value;
      this.form.get('code')?.setValue(value);
    }

    // Limitar a 6 dígitos
    if (value.length > 6) {
      const truncated = value.slice(0, 6);
      input.value = truncated;
      this.form.get('code')?.setValue(truncated);
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

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
    this.loading.set(false);
  }
}
