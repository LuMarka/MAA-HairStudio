import { Component, inject, output, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-auth-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-login.html',
  styleUrls: ['./auth-login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthLogin {
  // Usar output() en lugar de @Output()
  readonly goToRegister = output<void>();

  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Usar signals para el estado
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  // Computed para los controles del formulario
  readonly formControls = {
    email: this.form.get('email'),
    password: this.form.get('password'),
    remember: this.form.get('remember')
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

    // Corregir la llamada al servicio
    this.auth.login({ 
      email: email ?? '', 
      password: password ?? '' 
    })
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)) // Asegurar que loading siempre se resetee
    )
    .subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.redirectAfterLogin(response.user.role);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.error.set(err?.message || 'Error al iniciar sesión');
      },
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(current => !current);
  }

  onRegisterClick(): void {
    this.goToRegister.emit();
  }

  private redirectAfterLogin(role: string): void {
    const redirectPath = role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
    this.router.navigate([redirectPath]);
  }
}
