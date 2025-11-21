import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginTemplate } from '../../shared/templates/login-template/login-template';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginTemplate],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {}

