import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from "../../../shared/organisms/footer/footer";

@Component({
  selector: 'app-layout-login',
  imports: [RouterOutlet, Footer],
  templateUrl: './layout-login.html',
  styleUrl: './layout-login.scss'
})
export class LayoutLogin {

}
