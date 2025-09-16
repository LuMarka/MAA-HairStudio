import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../../shared/organisms/navbar/navbar';
import { Footer } from '../../../shared/organisms/footer/footer';
import { Search } from '../../../shared/organisms/search/search';
import { FloatingCtaButton } from '../../../shared/molecules/floating-cta-button/floating-cta-button';



@Component({
  selector: 'app-layout-home',
  imports: [RouterOutlet, Navbar, Search, Footer, FloatingCtaButton],
  templateUrl: './layout-home.html',
  styleUrl: './layout-home.scss'
})
export class LayoutHome {

}
