import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-login.html',
  styleUrls: ['./auth-login.scss']
})
export class AuthLogin {
  @Output() goToRegister = new EventEmitter<void>();
  
  loading = false;
  error: string | null = null;
  passwordVisible = signal(false);
  
  form: ReturnType<FormBuilder['group']>;
  
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true]
    });
  }


get f() { 
  return {
    email: this.form.get('email'),
    password: this.form.get('password'),
    remember: this.form.get('remember')
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
    const { email, password, remember } = this.form.value;
    await this.auth.login(email ?? '', password ?? '', remember ?? true);
    // AuthService handles the redirect based on user role
  } catch (err: any) {
    console.error('Login error:', err);
    this.error = err?.message || 'Error al iniciar sesión';
  } finally {
    this.loading = false;
  }
}


togglePasswordVisibility() {
  this.passwordVisible.update(current => !current);
}

onRegisterClick() {
  this.goToRegister.emit();
}
}
