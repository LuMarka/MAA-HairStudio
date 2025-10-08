import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from "../../../shared/organisms/footer/footer";
import { Navbar } from "../../../shared/organisms/navbar/navbar";
import { Search } from "../../../shared/organisms/search/search";
import { FloatingCtaButton } from '../../../shared/molecules/floating-cta-button/floating-cta-button';

@Component({
  selector: 'app-layout-login',
  standalone: true,
  imports: [RouterOutlet, Footer, Navbar, Search, FloatingCtaButton],
  templateUrl: './layout-login.html',
  styleUrl: './layout-login.scss'
})
export class LayoutLogin {

}
