import { Component, signal } from '@angular/core';
import { AuthLogin } from '../../organisms/auth-login/auth-login';
import { AuthRegister } from '../../organisms/auth-register/auth-register';

type AuthView = 'login' | 'register';

@Component({
  selector: 'app-login-template',
  standalone: true,
  imports: [AuthLogin, AuthRegister],
  templateUrl: './login-template.html',
  styleUrl: './login-template.scss'
})
export class LoginTemplate {
  activeView = signal<AuthView>('login');

  showLogin() {
    this.activeView.set('login');
  }

  showRegister() {
    this.activeView.set('register');
  }
}
