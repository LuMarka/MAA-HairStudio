import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { AuthLogin } from '../../organisms/auth-login/auth-login';
import { AuthRegister } from '../../organisms/auth-register/auth-register';
import { PasswordRecovery } from '../../organisms/password-recovery/password-recovery';

type AuthView = 'login' | 'register' | 'password-recovery';

@Component({
  selector: 'app-login-template',
  standalone: true,
  imports: [AuthLogin, AuthRegister, PasswordRecovery],
  templateUrl: './login-template.html',
  styleUrl: './login-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginTemplate {
  activeView = signal<AuthView>('login');

  showLogin(): void {
    this.activeView.set('login');
  }

  showRegister(): void {
    this.activeView.set('register');
  }

  showPasswordRecovery() {
    this.activeView.set('password-recovery');
  }
}
