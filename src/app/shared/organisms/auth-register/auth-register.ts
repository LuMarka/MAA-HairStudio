import { Component, inject, output, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

export function confirmPasswordValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-auth-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-register.html',
  styleUrl: './auth-register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthRegister {
  readonly goToLogin = output<void>();

  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Usar signals para el estado
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
    },
    { validators: confirmPasswordValidator('password', 'confirm') }
  );

  // Computed para los controles del formulario
  readonly formControls = {
    name: this.form.get('name'),
    email: this.form.get('email'),
    password: this.form.get('password'),
    confirm: this.form.get('confirm')
  };

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.value;
    
    if (!name || !email || !password) {
      this.error.set('Todos los campos son requeridos');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.auth.register({ name, email, password })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (user) => {
          console.log('Usuario registrado exitosamente:', user);
          this.successMessage.set('¡Registro exitoso! Ahora puedes iniciar sesión.');
          this.form.reset();
          // Opcional: redirigir automáticamente al login después de un tiempo
          setTimeout(() => this.onLoginClick(), 2000);
        },
        error: (err) => {
          console.error('Registration error:', err);
          this.error.set(err?.message || 'Error en el registro');
        }
      });
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.passwordVisible.update(current => !current);
    } else {
      this.confirmPasswordVisible.update(current => !current);
    }
  }

  onLoginClick(): void {
    this.goToLogin.emit();
  }

  clearMessages(): void {
    this.error.set(null);
    this.successMessage.set(null);
  }
}
