import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export function confirmPasswordValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-register.html',
  styleUrl: './auth-register.scss',
})
export class AuthRegister {
  @Output() goToLogin = new EventEmitter<void>();

  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);

  form;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm: ['', [Validators.required]],
      },
      { validators: confirmPasswordValidator('password', 'confirm') }
    );
  }

  get f() {
    return {
      name: this.form.get('name'),
      email: this.form.get('email'),
      password: this.form.get('password'),
      confirm: this.form.get('confirm')
    };
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = null;
    try {
      const { name, email, password } = this.form.value;
      await this.auth.register({
        name: name ?? '',
        email: email ?? '',
        password: password ?? ''
      });
      this.successMessage = '¡Registro exitoso! Ahora puedes iniciar sesión.';
      this.form.reset();
    } catch (err: any) {
      this.error = err?.message || 'Error en el registro';
    } finally {
      this.loading = false;
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.passwordVisible.update(v => !v);
    } else {
      this.confirmPasswordVisible.update(v => !v);
    }
  }

  onLoginClick() {
    this.goToLogin.emit();
  }
}
