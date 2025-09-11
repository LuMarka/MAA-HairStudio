import { Component } from '@angular/core';
import { LoginTemplate } from "../../shared/templates/login-template/login-template";

@Component({
  selector: 'app-login',
  imports: [LoginTemplate],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

}
