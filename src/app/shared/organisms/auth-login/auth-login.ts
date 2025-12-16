import { Component, inject, output, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-login.html',
  styleUrls: ['./auth-login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLogin {
  readonly goToRegister = output<void>();
  readonly goToPasswordRecovery = output<void>();

  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false],
  });

  readonly formControls = {
    email: this.form.get('email'),
    password: this.form.get('password'),
    remember: this.form.get('remember'),
  };

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;

    if (!email || !password) {
      this.error.set('Email y contraseña son requeridos');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const loginRequest = { email, password }; // Create an object of type LoginRequest

    this.auth
      .login(loginRequest)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.redirectAfterLogin(response.user.role);
        },
        error: (err) => {
          console.error('Login error:', err);
          this.error.set(err?.error?.message || 'Error al iniciar sesión');
        },
      });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((current) => !current);
  }

  onRegisterClick(): void {
    this.goToRegister.emit();
  }

  onForgotPasswordClick(): void {
    this.goToPasswordRecovery.emit();
  }

  private redirectAfterLogin(role: string): void {
    const redirectPath = role === 'ADMIN' ? '/admin/dashboard' : '/home';
    this.router.navigate([redirectPath]);
  }
}
